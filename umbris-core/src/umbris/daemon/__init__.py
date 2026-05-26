"""
umbris.daemon · Custos · the autonomous compositione loop.

Long-running process that operates the UMBRIS convocation without supervision:

    from umbris import LLMClient, auto_provider
    from umbris.daemon import Daemon, DaemonConfig
    from pathlib import Path

    llm = LLMClient(provider=auto_provider())
    daemon = Daemon(
        llm=llm,
        config=DaemonConfig(
            repo_root=Path("."),
            interval="2h",
            commit_and_push=True,
        ),
    )
    daemon.run()

Or from the CLI:

    umbris custos --interval 2h --commit --push

Always start with `--dry-run --once` first. See `docs/custos.md`.
"""

from __future__ import annotations

from .apply import (
    ApplyResult,
    PatchFile,
    StructuredPatch,
    apply_patch,
    parse_patch,
    request_patch,
)
from .core import (
    Daemon,
    DaemonConfig,
    DaemonState,
    load_status_snapshot,
    reset_cost_ledger,
)
from .cycle import CycleConfig, CycleResult, run_cycle
from .log import CycleEvent, configure_logging
from .safety import (
    DEFAULT_ALLOWLIST,
    DEFAULT_DENYLIST,
    CostCheck,
    CostLedger,
    PathCheck,
    PathPolicy,
    PIDLock,
    parse_interval,
)

__all__ = [
    # Top-level
    "Daemon",
    "DaemonConfig",
    "DaemonState",
    # Cycle
    "CycleConfig",
    "CycleResult",
    "CycleEvent",
    "run_cycle",
    # Apply
    "PatchFile",
    "StructuredPatch",
    "ApplyResult",
    "parse_patch",
    "apply_patch",
    "request_patch",
    # Safety
    "PathPolicy",
    "PathCheck",
    "CostLedger",
    "CostCheck",
    "PIDLock",
    "parse_interval",
    "DEFAULT_ALLOWLIST",
    "DEFAULT_DENYLIST",
    # Misc
    "configure_logging",
    "load_status_snapshot",
    "reset_cost_ledger",
]
