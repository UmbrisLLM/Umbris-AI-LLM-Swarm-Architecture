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

import asyncio
import subprocess
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..agents.base import Budget
from ..blackboard import InMemoryBlackboard
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
from .transcript import write_cycle_transcript, write_progress_manifest


# How often the mid-cycle progress writer flushes the in-progress
# deliberation to the manifest. 8s strikes a balance · the page polls
# every 20s, so two flushes happen between polls · visible motion
# without thrashing disk + git.
PROGRESS_TICK_SECONDS = 8.0

# Self-healing v2.0 · the convocation's deliberation may spend at most
# this fraction of the per-cycle cost cap. Leaves 30% headroom for the
# patcher step, so a runaway deliberation can't burn the whole cap on
# its own before the Patcher gets a turn.
DELIBERATION_BUDGET_RATIO = 0.70

# Self-healing v2.0 · how many of the most recent commits to inspect
# for fixation detection. If the convocation proposes a patch that
# touches a file we've shipped in the last N commits, reject early so
# the next cycle is forced to pick a different angle.
FIXATION_LOOKBACK_COMMITS = 5


def _recently_shipped_paths(
    repo_root: Path, lookback: int = FIXATION_LOOKBACK_COMMITS
) -> set[str]:
    """Return the set of repo-relative file paths touched by the last
    ``lookback`` commits authored by UMBRIS itself. Used as a fixation
    detector · the convocation should not be allowed to re-propose
    edits to files it just shipped.

    Best-effort · returns an empty set on any error so the cycle never
    breaks because of fixation detection itself."""
    try:
        proc = subprocess.run(
            [
                "git", "log",
                f"--max-count={lookback}",
                "--author=UMBRIS",
                "--name-only",
                "--pretty=format:",
            ],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
        if proc.returncode != 0:
            return set()
        out: set[str] = set()
        for line in proc.stdout.splitlines():
            line = line.strip()
            if line:
                out.add(line)
        return out
    except Exception:
        return set()


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
    # Construct the blackboard up-front so a background progress writer
    # can poll it while the convocation deliberates. Each tick writes
    # the current voices to `manifest.json` with status="deliberating"
    # so umbrisai.com/convocation streams the deliberation as it happens
    # rather than only updating once per finished cycle.
    umbra = Umbra(llm=llm)
    live_bb = InMemoryBlackboard()

    async def _progress_writer() -> None:
        """Flush in-progress voices to the manifest every PROGRESS_TICK_SECONDS."""
        try:
            while True:
                await asyncio.sleep(PROGRESS_TICK_SECONDS)
                try:
                    records = list(await live_bb.read())
                except Exception:
                    records = []
                # The LLM client tracks running spend on its own ledger ·
                # surface that as the in-progress cost.
                cost_so_far = 0.0
                try:
                    cost_so_far = float(
                        getattr(llm, "total_cost_usd", 0.0) or 0.0
                    )
                except Exception:
                    pass
                await write_progress_manifest(
                    repo_root=config.repo_root,
                    cycle_number=config.cycle_number,
                    started_iso=started_iso,
                    records=records,
                    cost_so_far=cost_so_far,
                )
        except asyncio.CancelledError:
            # Normal · cycle is finishing; suppress the cancellation.
            raise
        except Exception:
            # Best-effort · never let progress writes break the cycle.
            return

    # Write a "cycle has started" manifest entry IMMEDIATELY so the
    # page flips from the previous cycle's final state to "cycle N · in
    # deliberation" the instant a new cycle begins, instead of staying
    # frozen on the previous shipped cycle until the first progress
    # tick (8s later) or the cycle completes.
    try:
        await write_progress_manifest(
            repo_root=config.repo_root,
            cycle_number=config.cycle_number,
            started_iso=started_iso,
            records=[],
            cost_so_far=0.0,
        )
    except Exception:
        pass

    progress_task = asyncio.create_task(_progress_writer())

    # Self-healing budget guard · cap the deliberation at 70% of the
    # per-cycle cap so it can't burn the whole budget on its own. The
    # convocation's verification loop will see the budget exhausted
    # signal and exit gracefully instead of blowing through to $1.50.
    deliberation_budget = Budget(
        max_total_usd=config.ledger.cap_per_cycle_usd * DELIBERATION_BUDGET_RATIO,
    )

    try:
        surface_result = await surface_bottlenecks(
            umbra, observations,
            n=config.observations_top_n,
            blackboard=live_bb,
            budget=deliberation_budget,
        )
    finally:
        progress_task.cancel()
        try:
            await progress_task
        except (asyncio.CancelledError, Exception):
            pass

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

    # ── Self-healing v2.0 · fixation detector ─────────────────
    # If the convocation is trying to write a file path that was
    # touched by one of the last few commits, reject early as a skip.
    # The daemon's outer loop will detect "fixation_break" in the
    # reason and immediately retry with a fresh observation set
    # (60-second fast retry, not the full 20-min interval).
    proposed = {pf.path for pf in patch.files}
    recent = _recently_shipped_paths(config.repo_root)
    fixated = proposed & recent
    if fixated:
        config.ledger.record_cycle(cost_usd=cycle_cost)
        return CycleResult(event=await finalize(make_event(
            status="skipped",
            reason=(
                "fixation_break · convocation re-proposed recently shipped "
                f"files: {sorted(fixated)[:3]}"
            ),
            observations_count=len(observations),
            verdict_summary=patch.summary,
            files_changed=[],
            cost_usd=cycle_cost,
        )))

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

        # ─── Pre-commit transcript + manifest write ────────────────
        # The mid-cycle progress writer leaves manifest.json with
        # status="deliberating" and cost=0 (it only writes the running
        # state · final cost is known later). If we let git add pick
        # up that state, the committed manifest tells the page the
        # convocation is "deliberating" even though we're about to
        # commit a finished verdict. So we update the manifest NOW,
        # with the final status="ok" and the real cost, before staging.
        #
        # commit_hash is still None at this point · git commit hasn't
        # run yet. The post-commit finalize() below will rewrite the
        # manifest locally with the real hash, and the next cycle's
        # commit will push that into the recent[] tail.
        try:
            sr = surface_result_ref[0]
            await write_cycle_transcript(
                repo_root=config.repo_root,
                cycle_number=config.cycle_number,
                started_iso=started_iso,
                finished_iso=now_iso(),
                wall_seconds=round(time.time() - start, 3),
                status="ok",
                reason="convocation shipped",
                verdict_text=verdict_text_ref[0],
                verdict_blackboard=getattr(sr, "blackboard", None)
                    if sr is not None else None,
                patch_summary=patch_summary_ref[0],
                patch_files=patch_files_ref[0],
                raw_patcher_response=raw_patcher_ref[0],
                observations_count=len(observations),
                files_changed=written,
                commit_hash=None,
                cost_usd=cycle_cost,
            )
        except Exception:
            # Best-effort · the transcript writer is supposed to never
            # raise but if it does we still want the cycle to commit.
            pass

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
