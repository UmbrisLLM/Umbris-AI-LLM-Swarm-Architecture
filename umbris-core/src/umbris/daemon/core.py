"""
umbris.daemon.core · the long-running autonomous Custos loop.

Wraps the per-revolution work from `cycle.py` in:
  - scheduling (interval-based, configurable)
  - signal handling (graceful shutdown on SIGINT/SIGTERM)
  - PID locking (single instance per repo)
  - structured logging (one event per revolution)
  - lightweight runtime state inspectable via `custos-status`

Custos is intentionally simple · no threading, no asyncio tasks
beyond what each revolution uses internally. The loop runs revolutions
in serial; the next one starts when the previous one finishes (plus
any remaining sleep).
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import signal
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from ..llm.client import LLMClient
from .cycle import CycleConfig, CycleResult, run_cycle
from .log import CycleEvent, configure_logging, now_iso
from .safety import (
    CostLedger,
    PIDLock,
    PathPolicy,
    parse_interval,
)


# ──────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────


@dataclass
class DaemonConfig:
    """Everything Custos needs to start. Wire one of these in
    from the CLI or a Python script."""

    repo_root: Path
    interval: str = "2h"             # accepts "30m", "2h", "1d", or bare seconds

    dry_run: bool = False
    once: bool = False               # run one revolution then exit
    commit_and_push: bool = True     # set False if you just want to log decisions

    # Gates · disable for repos without pytest / npm, or for fast demos.
    run_tests: bool = True
    run_build_when_web_touched: bool = True

    cost_cap_per_cycle_usd: float = 5.0
    cost_cap_per_day_usd: float = 50.0

    state_dir: Path | None = None    # default: <repo_root>/.umbris-custos/

    remote: str = "origin"
    branch: str = "main"

    # Webhook for revolution events (optional). POSTed as JSON.
    webhook_url: str | None = None


# ──────────────────────────────────────────────────────────────────
# Runtime state (small, observable)
# ──────────────────────────────────────────────────────────────────


@dataclass
class DaemonState:
    started_at: str = field(default_factory=now_iso)
    cycles_completed: int = 0
    last_event: dict | None = None
    last_event_iso: str | None = None
    history: list[dict] = field(default_factory=list)
    halted: bool = False
    halt_reason: str | None = None

    def record(self, event: CycleEvent) -> None:
        d = event.as_dict()
        self.cycles_completed += 1
        self.last_event = d
        self.last_event_iso = now_iso()
        self.history.append(d)
        # Keep the last 50 events in-memory.
        if len(self.history) > 50:
            self.history = self.history[-50:]

    def as_dict(self) -> dict:
        return {
            "started_at": self.started_at,
            "cycles_completed": self.cycles_completed,
            "last_event": self.last_event,
            "last_event_iso": self.last_event_iso,
            "halted": self.halted,
            "halt_reason": self.halt_reason,
        }


# ──────────────────────────────────────────────────────────────────
# Custos · the daemon
# ──────────────────────────────────────────────────────────────────


class Daemon:
    """The autonomous Custos sentinel. Construct, then call
    `.run()` (sync · internally runs an asyncio loop) or `await self.run_async()`."""

    def __init__(
        self,
        *,
        llm: LLMClient,
        config: DaemonConfig,
        policy: PathPolicy | None = None,
    ) -> None:
        self.llm = llm
        self.config = config
        self.policy = policy or PathPolicy()

        self.state_dir = (config.state_dir or (config.repo_root / ".umbris-custos")).resolve()
        self.state_dir.mkdir(parents=True, exist_ok=True)

        self.pid_lock = PIDLock(path=self.state_dir / "custos.pid")
        self.ledger = CostLedger(
            state_path=self.state_dir / "cost-ledger.json",
            cap_per_cycle_usd=config.cost_cap_per_cycle_usd,
            cap_per_day_usd=config.cost_cap_per_day_usd,
        )
        self.state_path = self.state_dir / "custos-state.json"
        self.status_path = self.state_dir / "custos-status.json"

        self.log = configure_logging(log_path=self.state_dir / "custos.log")
        self.state = DaemonState()
        self._stop_requested = False
        self._interval_seconds = parse_interval(config.interval)

    # ── lifecycle ─────────────────────────────────────────────

    def _persist_status(self) -> None:
        try:
            self.status_path.write_text(json.dumps(self.state.as_dict(), indent=2), encoding="utf-8")
        except OSError:
            pass

    def _install_signal_handlers(self) -> None:
        def request_stop(signum: int, frame) -> None:  # noqa: ARG001
            self._stop_requested = True
            self.log.info("custos.stop_requested", signal=signum)
        try:
            signal.signal(signal.SIGINT, request_stop)
            if hasattr(signal, "SIGTERM"):
                signal.signal(signal.SIGTERM, request_stop)
        except (ValueError, OSError):
            # Not always allowed (e.g. in a child thread, in some tests).
            pass

    # ── the loop ──────────────────────────────────────────────

    def run(self) -> int:
        """Synchronous entrypoint used by the CLI. Returns the
        process exit code."""
        return asyncio.run(self.run_async())

    async def run_async(self) -> int:
        if not self.pid_lock.acquire(pid=os.getpid()):
            self.log.error("custos.start_refused", reason="another Custos already running")
            return 1

        self._install_signal_handlers()
        self.log.info(
            "custos.starting",
            repo=str(self.config.repo_root),
            interval_seconds=self._interval_seconds,
            dry_run=self.config.dry_run,
            commit_and_push=self.config.commit_and_push,
            once=self.config.once,
        )
        self._persist_status()

        exit_code = 0
        try:
            cycle_n = 0
            while not self._stop_requested:
                cycle_n += 1
                result = await self._run_one_cycle(cycle_n=cycle_n)
                self.state.record(result.event)
                self._persist_status()

                self.log.info(
                    "custos.cycle_done",
                    cycle=cycle_n,
                    status=result.event.status,
                    reason=result.event.reason,
                    files_changed=result.event.files_changed,
                    commit_hash=result.event.commit_hash,
                    cost_usd=result.event.cost_usd,
                    pushed=result.pushed,
                )
                await self._notify_webhook(result.event)

                if self.config.once:
                    break
                if self._stop_requested:
                    break

                await self._interruptible_sleep(self._interval_seconds)
        except Exception as e:  # noqa: BLE001 · top-level safety net
            self.log.exception("custos.crashed", error=str(e))
            exit_code = 2
        finally:
            self.pid_lock.release()
            self.log.info("custos.stopped",
                          cycles_completed=self.state.cycles_completed,
                          exit_code=exit_code)
            self._close_file_log_handlers()
        return exit_code

    def _close_file_log_handlers(self) -> None:
        """Release Custos's file log handler so the OS unlocks
        ``custos.log``. Necessary on Windows when the same process
        afterwards tries to remove the state directory (tests + smoke
        scripts)."""
        root = logging.getLogger()
        for h in list(root.handlers):
            if isinstance(h, logging.FileHandler):
                try:
                    h_path = Path(h.baseFilename).resolve()
                except (ValueError, OSError):
                    continue
                if str(h_path).startswith(str(self.state_dir)):
                    try:
                        h.close()
                    finally:
                        root.removeHandler(h)

    async def _run_one_cycle(self, *, cycle_n: int) -> CycleResult:
        # A dry-run skips every external side-effect: no commit, no push,
        # no test gate, no build gate. The patch still gets applied so the
        # operator can inspect what the convocation chose to write.
        in_dry_run = self.config.dry_run
        config = CycleConfig(
            repo_root=self.config.repo_root,
            policy=self.policy,
            ledger=self.ledger,
            commit_and_push=(self.config.commit_and_push and not in_dry_run),
            run_tests=(self.config.run_tests and not in_dry_run),
            run_build_when_web_touched=(
                self.config.run_build_when_web_touched and not in_dry_run
            ),
            remote=self.config.remote,
            branch=self.config.branch,
            cycle_number=cycle_n,
        )
        return await run_cycle(llm=self.llm, config=config)

    async def _interruptible_sleep(self, seconds: int) -> None:
        """Sleep that returns early if a stop is requested."""
        slept = 0
        chunk = 1
        while slept < seconds and not self._stop_requested:
            await asyncio.sleep(min(chunk, seconds - slept))
            slept += chunk

    async def _notify_webhook(self, event: CycleEvent) -> None:
        if not self.config.webhook_url:
            return
        try:
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(self.config.webhook_url, json=event.as_dict())
        except Exception as e:  # noqa: BLE001 · webhook is best-effort
            self.log.warning("custos.webhook_failed", error=str(e))


# ──────────────────────────────────────────────────────────────────
# Inspection helpers used by `umbris custos-status`
# ──────────────────────────────────────────────────────────────────


def load_status_snapshot(repo_root: Path) -> dict | None:
    """Read the last custos-status.json written by a running Custos."""
    p = (repo_root / ".umbris-custos" / "custos-status.json").resolve()
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def reset_cost_ledger(repo_root: Path) -> None:
    """Force-reset today's cost cap. Used by `umbris custos-reset`."""
    state_dir = (repo_root / ".umbris-custos").resolve()
    state_dir.mkdir(parents=True, exist_ok=True)
    ledger = CostLedger(state_path=state_dir / "cost-ledger.json")
    ledger.reset_today()
