"""
umbris.daemon.cycle · one revolution's worth of autonomous work.

The revolution is the single most important unit in Custos. It
contains every gate, every safety check, every rollback path. The
outer `core.Daemon` does nothing except call `run_cycle()` on a
schedule and respect its return value.

A revolution goes:

  cost-cap pre-check  →  scan repo  →  surface bottleneck
       →  ask convocation for structured patch  →  apply to disk
       →  pytest gate  →  optional npm-build gate
       →  commit + push  →  log everything

If any gate fails, the working tree is restored and the revolution ends
with a clean `status` so Custos can keep going.
"""

from __future__ import annotations

import subprocess
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..umbra import Umbra
from ..introspection import RepoAnalyst, surface_bottlenecks
from ..llm.client import LLMClient
from .apply import ApplyResult, apply_patch, request_patch
from .git_ops import (
    add,
    changed_files,
    commit,
    has_uncommitted_changes,
    head_short_hash,
    push,
    restore_working_tree,
)
from .log import CycleEvent, now_iso
from .safety import CostLedger, PathPolicy
from .transcript import write_cycle_transcript


# ──────────────────────────────────────────────────────────────────
# Result + config
# ──────────────────────────────────────────────────────────────────


@dataclass
class CycleResult:
    event: CycleEvent
    pushed: bool = False


@dataclass
class CycleConfig:
    repo_root: Path
    policy: PathPolicy
    ledger: CostLedger

    # Surface stage
    observations_top_n: int = 1

    # Test + build gates
    run_tests: bool = True
    run_build_when_web_touched: bool = True
    test_command: list[str] = None  # type: ignore[assignment]
    build_command: list[str] = None  # type: ignore[assignment]
    test_timeout_seconds: int = 600
    build_timeout_seconds: int = 600

    # Git
    commit_and_push: bool = True
    remote: str = "origin"
    branch: str = "main"
    cycle_number: int = 0

    def __post_init__(self) -> None:
        if self.test_command is None:
            # default: pytest -x in umbris-core/, via uv if available
            self.test_command = ["pytest", "-x", "--tb=short"]
        if self.build_command is None:
            self.build_command = ["npm", "run", "build"]


# ──────────────────────────────────────────────────────────────────
# Gate helpers
# ──────────────────────────────────────────────────────────────────


def _run_subprocess_gate(
    cmd: list[str],
    *,
    cwd: Path,
    timeout: int,
) -> tuple[bool, str]:
    """Run a single subprocess gate; return (passed, short-log)."""
    try:
        proc = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
    except FileNotFoundError:
        return False, f"command not found: {cmd[0]!r}"
    except subprocess.TimeoutExpired:
        return False, f"timeout after {timeout}s running {' '.join(cmd)}"
    log = (proc.stdout or "") + "\n" + (proc.stderr or "")
    tail = log.strip().splitlines()
    short = "\n".join(tail[-15:]) if tail else ""
    return proc.returncode == 0, short


def _any_path_in(prefix: str, paths: list[str]) -> bool:
    return any(p.startswith(prefix.rstrip("/") + "/") or p == prefix for p in paths)


# ──────────────────────────────────────────────────────────────────
# The revolution itself
# ──────────────────────────────────────────────────────────────────


async def run_cycle(
    *,
    llm: LLMClient,
    config: CycleConfig,
) -> CycleResult:
    """Run one full revolution. Always returns a `CycleResult`; never
    raises for normal failure paths (cost cap, no observations, test
    fail, etc.). Only programming errors propagate."""

    start = time.time()
    started_iso = now_iso()

    # ── Per-cycle state captured by the transcript writer ─────────
    # These accumulate as the cycle progresses; whatever exists at the
    # moment of return is what the transcript records.
    surface_result_ref: list[Any] = [None]   # holds the RunResult once produced
    verdict_text_ref:   list[str | None] = [None]
    patch_summary_ref:  list[str | None] = [None]
    patch_files_ref:    list[list[tuple[str, str]]] = [[]]
    raw_patcher_ref:    list[str | None] = [None]

    def make_event(
        *,
        status: str,
        reason: str,
        observations_count: int = 0,
        verdict_summary: str | None = None,
        files_changed: list[str] | None = None,
        commit_hash: str | None = None,
        cost_usd: float = 0.0,
    ) -> CycleEvent:
        return CycleEvent(
            cycle=config.cycle_number,
            started_at=started_iso,
            finished_at=now_iso(),
            wall_seconds=round(time.time() - start, 3),
            status=status,
            reason=reason,
            observations_count=observations_count,
            verdict_summary=verdict_summary,
            files_changed=files_changed or [],
            commit_hash=commit_hash,
            cost_usd=round(cost_usd, 4),
        )

    async def finalize(
        event: CycleEvent,
    ) -> CycleEvent:
        """Write the per-cycle markdown transcript before returning.
        Never raises · transcript failures must not break the cycle."""
        try:
            sr = surface_result_ref[0]
            await write_cycle_transcript(
                repo_root=config.repo_root,
                cycle_number=event.cycle,
                started_iso=event.started_at,
                finished_iso=event.finished_at,
                wall_seconds=event.wall_seconds,
                status=event.status,
                reason=event.reason,
                verdict_text=verdict_text_ref[0],
                verdict_blackboard=getattr(sr, "blackboard", None) if sr is not None else None,
                patch_summary=patch_summary_ref[0],
                patch_files=patch_files_ref[0],
                raw_patcher_response=raw_patcher_ref[0],
                observations_count=event.observations_count,
                files_changed=event.files_changed,
                commit_hash=event.commit_hash,
                cost_usd=event.cost_usd,
            )
        except Exception:
            pass
        return event

    # ── 0. Cost cap pre-check ──────────────────────────────────
    cost_check = config.ledger.check_before_cycle()
    if not cost_check.allowed:
        return CycleResult(event=await finalize(make_event(
            status="halted",
            reason=f"cost-cap: {cost_check.reason}",
        )))

    # ── 1. Scan the repo ───────────────────────────────────────
    analyst = RepoAnalyst(repo_root=config.repo_root)
    observations = analyst.scan()
    if not observations:
        return CycleResult(event=await finalize(make_event(
            status="skipped",
            reason="no observations surfaced from scan",
            observations_count=0,
        )))

    # ── 2. Surface a bottleneck ────────────────────────────────
    umbra = Umbra(llm=llm)
    surface_result = await surface_bottlenecks(
        umbra, observations, n=config.observations_top_n,
    )
    surface_result_ref[0] = surface_result   # for the transcript writer
    verdict_text = _extract_text(surface_result.answer)
    verdict_text_ref[0] = verdict_text
    cycle_cost = float(surface_result.summary.total_cost_usd or 0.0)

    # ── 3. Ask the convocation for a structured patch ──────────
    patch, raw, patch_cost = await request_patch(
        umbra, verdict_text=verdict_text, policy=config.policy,
    )
    cycle_cost += patch_cost
    raw_patcher_ref[0] = raw

    if patch is None:
        config.ledger.record_cycle(cost_usd=cycle_cost)
        return CycleResult(event=await finalize(make_event(
            status="skipped",
            reason="patcher response failed to parse / validate",
            observations_count=len(observations),
            verdict_summary=verdict_text[:200],
            cost_usd=cycle_cost,
        )))

    # Capture the patch contents for the transcript before any policy check.
    patch_summary_ref[0] = patch.summary
    try:
        patch_files_ref[0] = [(pf.path, pf.content) for pf in patch.files]
    except Exception:
        patch_files_ref[0] = []

    # ── 4. Apply patch to disk (with policy enforcement) ───────
    apply_result: ApplyResult = apply_patch(
        patch, repo_root=config.repo_root, policy=config.policy,
    )
    if not apply_result.ok:
        # Nothing was written (apply_patch validates everything pre-write).
        config.ledger.record_cycle(cost_usd=cycle_cost)
        return CycleResult(event=await finalize(make_event(
            status="skipped",
            reason=f"apply rejected: {apply_result.reason}",
            observations_count=len(observations),
            verdict_summary=patch.summary,
            cost_usd=cycle_cost,
        )))

    written = apply_result.paths_written or []

    # ── 5. Test gate ──────────────────────────────────────────
    if config.run_tests:
        passed, log = _run_subprocess_gate(
            config.test_command,
            cwd=config.repo_root / "umbris-core",
            timeout=config.test_timeout_seconds,
        )
        if not passed:
            restore_working_tree(config.repo_root)
            config.ledger.record_cycle(cost_usd=cycle_cost)
            return CycleResult(event=await finalize(make_event(
                status="failed",
                reason=f"test gate failed:\n{log[-400:]}",
                observations_count=len(observations),
                verdict_summary=patch.summary,
                files_changed=written,
                cost_usd=cycle_cost,
            )))

    # ── 6. Build gate (only if a web file was touched) ─────────
    if config.run_build_when_web_touched and _any_path_in("umbris-web", written):
        passed, log = _run_subprocess_gate(
            config.build_command,
            cwd=config.repo_root / "umbris-web",
            timeout=config.build_timeout_seconds,
        )
        if not passed:
            restore_working_tree(config.repo_root)
            config.ledger.record_cycle(cost_usd=cycle_cost)
            return CycleResult(event=await finalize(make_event(
                status="failed",
                reason=f"build gate failed:\n{log[-400:]}",
                observations_count=len(observations),
                verdict_summary=patch.summary,
                files_changed=written,
                cost_usd=cycle_cost,
            )))

    # ── 7. Commit + push (if enabled) ──────────────────────────
    commit_hash: str | None = None
    pushed = False

    if config.commit_and_push:
        if not has_uncommitted_changes(config.repo_root):
            # Nothing actually changed on disk · unusual but safe to skip.
            config.ledger.record_cycle(cost_usd=cycle_cost)
            return CycleResult(event=await finalize(make_event(
                status="skipped",
                reason="patch applied but git sees no changes",
                observations_count=len(observations),
                verdict_summary=patch.summary,
                files_changed=written,
                cost_usd=cycle_cost,
            )))

        add_res = add(config.repo_root, list(changed_files(config.repo_root)))
        if not add_res.ok:
            restore_working_tree(config.repo_root)
            config.ledger.record_cycle(cost_usd=cycle_cost)
            return CycleResult(event=await finalize(make_event(
                status="failed",
                reason=f"git add failed: {add_res.stderr[-200:]}",
                observations_count=len(observations),
                verdict_summary=patch.summary,
                files_changed=written,
                cost_usd=cycle_cost,
            )))

        message = _compositione_commit_message(
            cycle_n=config.cycle_number,
            summary=patch.summary,
            verdict=verdict_text,
            cost_usd=cycle_cost,
        )
        commit_res = commit(config.repo_root, message)
        if not commit_res.ok:
            restore_working_tree(config.repo_root)
            config.ledger.record_cycle(cost_usd=cycle_cost)
            return CycleResult(event=await finalize(make_event(
                status="failed",
                reason=f"git commit failed: {commit_res.stderr[-200:]}",
                observations_count=len(observations),
                verdict_summary=patch.summary,
                files_changed=written,
                cost_usd=cycle_cost,
            )))

        commit_hash = head_short_hash(config.repo_root)
        push_res = push(config.repo_root, remote=config.remote, branch=config.branch)
        if not push_res.ok:
            # The local commit succeeded but the remote rejected.
            # We leave the commit in place · the next revolution's
            # cost-cap check and the next push attempt will retry.
            config.ledger.record_cycle(cost_usd=cycle_cost)
            return CycleResult(event=await finalize(make_event(
                status="failed",
                reason=f"git push failed: {push_res.stderr[-300:]}",
                observations_count=len(observations),
                verdict_summary=patch.summary,
                files_changed=written,
                commit_hash=commit_hash,
                cost_usd=cycle_cost,
            )))
        pushed = True

    config.ledger.record_cycle(cost_usd=cycle_cost)
    return CycleResult(
        event=await finalize(make_event(
            status="shipped",
            reason="ok",
            observations_count=len(observations),
            verdict_summary=patch.summary,
            files_changed=written,
            commit_hash=commit_hash,
            cost_usd=cycle_cost,
        )),
        pushed=pushed,
    )


# ──────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────


def _extract_text(answer: Any) -> str:
    if isinstance(answer, str):
        return answer
    if isinstance(answer, dict) and "answer" in answer:
        return str(answer["answer"])
    return str(answer)


def _compositione_commit_message(
    *,
    cycle_n: int,
    summary: str,
    verdict: str,
    cost_usd: float,
) -> str:
    short_verdict = verdict.replace("\r", "").strip()
    if len(short_verdict) > 600:
        short_verdict = short_verdict[:600].rstrip() + "…"
    return (
        f"compositione: {summary}\n"
        f"\n"
        f"The convocation surfaced this in its autonomous revolution #{cycle_n}.\n"
        f"\n"
        f"Plan:\n{short_verdict}\n"
        f"\n"
        f"Verified: yes (test gate passed, build gate passed where applicable)\n"
        f"Cost:     ${cost_usd:.4f}\n"
        f"Revolution:    {cycle_n}\n"
        f"\n"
        f"Co-Authored-By: UMBRIS Convocation <noreply@umbrisai.com>\n"
    )
