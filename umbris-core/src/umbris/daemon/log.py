"""
umbris.daemon.log · structured logging for the autonomous Custos loop.

Every revolution emits one structured event a human (or another agent)
can scan to see exactly what the convocation did. Uses structlog so the
output is JSON-on-disk + pretty-on-console when Custos is attached to
a terminal.
"""

from __future__ import annotations

import logging
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import structlog


@dataclass
class CycleEvent:
    """One full revolution's worth of structured outcome.

    Designed to be one row in a `custos-status` table. Every field is
    JSON-serialisable so the same event can be written to disk, sent
    to a webhook, or printed to the console.
    """

    cycle: int
    started_at: str
    finished_at: str
    wall_seconds: float
    status: str               # "shipped" | "skipped" | "failed" | "halted"
    reason: str               # short human-readable explanation
    observations_count: int
    verdict_summary: str | None
    files_changed: list[str] = field(default_factory=list)
    commit_hash: str | None = None
    cost_usd: float = 0.0

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def configure_logging(log_path: Path | None = None, *, level: str = "INFO") -> structlog.BoundLogger:
    """Set up structlog. Writes JSON to ``log_path`` if given, plus a
    pretty stream to stdout. Idempotent."""
    handlers: list[logging.Handler] = [logging.StreamHandler()]
    if log_path is not None:
        log_path.parent.mkdir(parents=True, exist_ok=True)
        handlers.append(logging.FileHandler(log_path, encoding="utf-8"))

    logging.basicConfig(
        format="%(message)s",
        level=getattr(logging, level.upper(), logging.INFO),
        handlers=handlers,
        force=True,
    )

    structlog.configure(
        processors=[
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(getattr(logging, level.upper(), logging.INFO)),
        cache_logger_on_first_use=True,
    )
    return structlog.get_logger("umbris.custos")
