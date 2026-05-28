"""
umbris.daemon.safety · allowlist, denylist, cost caps.

Three independent gates that any autonomous change must pass before
hitting disk or the wallet. None of these gates can be bypassed by
the convocation itself · they're enforced by Custos outside the loop.

Design rules:
  1. Allowlist is positive ("only these paths"). Denylist is
     negative ("never these paths"), checked even when the path
     would otherwise pass the allowlist. Denylist always wins.
  2. Cost caps are tracked per-revolution and per-day. A cap that has
     been breached prevents new revolutions from starting; Custos
     does not "spend a little extra" past the cap.
  3. Every safety check returns a structured result so the caller
     can log it, not a bare bool.
"""

from __future__ import annotations

import fnmatch
import json
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from pathlib import Path


def _glob_match(pattern: str, path: str) -> bool:
    """Match a POSIX-style path against a glob pattern, with `**` as a
    recursive wildcard that consumes zero or more path segments.

    Python's stdlib `fnmatch` does not give `**` recursive semantics
    (it behaves identically to `*`), and `PurePath.match` doesn't
    recurse either before 3.13. This implementation walks segment by
    segment so the allowlist / denylist behave the way the patterns
    read."""
    return _match_segments(pattern.split("/"), path.split("/"))


def _match_segments(pat: list[str], path: list[str]) -> bool:
    if not pat:
        return not path
    if pat[0] == "**":
        rest = pat[1:]
        if not rest:
            return True  # `**` at the end matches every remaining suffix.
        for i in range(len(path) + 1):
            if _match_segments(rest, path[i:]):
                return True
        return False
    if not path:
        return False
    if fnmatch.fnmatchcase(path[0], pat[0]):
        return _match_segments(pat[1:], path[1:])
    return False

# ──────────────────────────────────────────────────────────────────
# Default path policies · conservative enough to ship without flags
# ──────────────────────────────────────────────────────────────────

DEFAULT_ALLOWLIST: tuple[str, ...] = (
    # ─── Long-form lore + docs ─────────────────────────────────
    "docs/**/*.md",
    "lore/**/*.md",
    "lore/**/*.svg",
    "treasury-log.md",
    # ─── Existing single-file data the daemon may rewrite via create-only ─
    "umbris-web/src/data/convocationNow.ts",
    # ─── v1.1.1 · the daemon's visible website channel ─────────
    # Anything dropped here is auto-rendered by <DaemonShowcase />
    # on the homepage. Append-only (create-only safety still applies).
    "umbris-web/src/data/auto-*.json",
    "umbris-web/src/data/auto-*.md",
    # ─── Engine code the daemon may extend (still create-only) ─
    "umbris-core/src/umbris/**/*.py",
    "umbris-core/tests/**/*.py",
    "umbris-core/examples/**/*.py",
    # ─── Top-level README + changelog ──────────────────────────
    "README.md",
    "CHANGELOG.md",
    "umbris-core/README.md",
)

#: Files Custos must NEVER write · even if the allowlist would otherwise allow it.
DEFAULT_DENYLIST: tuple[str, ...] = (
    ".env",
    ".env.*",
    "**/.env",
    "**/.env.*",
    "secrets/**",
    "**/secrets/**",
    "**/*.key",
    "**/*.pem",
    "wallets/**",
    "**/wallets/**",
    ".git/**",
    "**/.git/**",
    "node_modules/**",
    "**/node_modules/**",
    ".venv/**",
    "**/.venv/**",
    "package.json",
    "package-lock.json",
    "**/package.json",
    "**/package-lock.json",
    "pyproject.toml",       # version bumps are explicit, not compositione-driven
    "**/pyproject.toml",
)


# ──────────────────────────────────────────────────────────────────
# Path policy
# ──────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class PathCheck:
    allowed: bool
    reason: str


class PathPolicy:
    """Enforces the allowlist + denylist for any path Custos
    might want to write. Paths are tested as POSIX strings relative
    to the repo root."""

    def __init__(
        self,
        *,
        allowlist: tuple[str, ...] | None = None,
        denylist: tuple[str, ...] | None = None,
    ) -> None:
        self.allowlist = allowlist if allowlist is not None else DEFAULT_ALLOWLIST
        self.denylist = denylist if denylist is not None else DEFAULT_DENYLIST

    def check(self, repo_root: Path, target: Path) -> PathCheck:
        """Verify a single path against both lists.

        Returns ``PathCheck(allowed=True, reason="ok")`` only when the
        path:
          * resolves inside repo_root (no `..` escapes)
          * matches at least one allowlist glob
          * matches zero denylist globs
        """
        try:
            target_abs = (repo_root / target).resolve()
            target_abs.relative_to(repo_root.resolve())
        except (ValueError, OSError):
            return PathCheck(allowed=False, reason="path escapes repo root")

        rel = target_abs.relative_to(repo_root.resolve()).as_posix()

        # Denylist always wins.
        for pattern in self.denylist:
            if _glob_match(pattern, rel):
                return PathCheck(allowed=False, reason=f"denylist match: {pattern!r}")

        # Then the allowlist must include it.
        for pattern in self.allowlist:
            if _glob_match(pattern, rel):
                return PathCheck(allowed=True, reason=f"allowlist match: {pattern!r}")

        return PathCheck(allowed=False, reason="no allowlist match")


# ──────────────────────────────────────────────────────────────────
# Cost ledger · per-revolution + per-day caps
# ──────────────────────────────────────────────────────────────────


@dataclass
class CostCheck:
    allowed: bool
    reason: str
    spent_today_usd: float
    cap_per_cycle_usd: float
    cap_per_day_usd: float


@dataclass
class CostLedger:
    """Tracks Custos's spend across revolutions, persisted to disk so
    the cap survives restarts.

    File layout (JSON):

        {
          "date": "2026-05-19",
          "spent_usd": 12.3456,
          "cycles": 7
        }

    Resets automatically when the UTC date changes.
    """

    state_path: Path
    cap_per_cycle_usd: float = 5.00
    cap_per_day_usd: float = 50.00

    _state: dict[str, float | str | int] = field(default_factory=dict)

    def __post_init__(self) -> None:
        self._load()

    def _load(self) -> None:
        if self.state_path.exists():
            try:
                self._state = json.loads(self.state_path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                self._state = {}
        else:
            self._state = {}
        self._rotate_if_new_day()

    def _save(self) -> None:
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        self.state_path.write_text(json.dumps(self._state, indent=2), encoding="utf-8")

    def _rotate_if_new_day(self) -> None:
        today = date.today().isoformat()
        if self._state.get("date") != today:
            self._state = {"date": today, "spent_usd": 0.0, "cycles": 0}
            self._save()

    @property
    def spent_today_usd(self) -> float:
        self._rotate_if_new_day()
        return float(self._state.get("spent_usd", 0.0))

    @property
    def cycles_today(self) -> int:
        self._rotate_if_new_day()
        return int(self._state.get("cycles", 0))

    def check_before_cycle(self, *, projected_cost_usd: float = 0.0) -> CostCheck:
        """Decide whether a new revolution may start.

        ``projected_cost_usd`` is the *budget* Custos is willing to
        spend on the upcoming revolution; defaults to the per-cycle cap.
        """
        projected = projected_cost_usd or self.cap_per_cycle_usd
        spent = self.spent_today_usd
        if projected > self.cap_per_cycle_usd + 1e-9:
            return CostCheck(False, "per-cycle cap exceeds policy",
                             spent, self.cap_per_cycle_usd, self.cap_per_day_usd)
        if spent >= self.cap_per_day_usd:
            return CostCheck(False, "daily cap reached",
                             spent, self.cap_per_cycle_usd, self.cap_per_day_usd)
        if spent + projected > self.cap_per_day_usd + 1e-9:
            return CostCheck(False, "next cycle would breach daily cap",
                             spent, self.cap_per_cycle_usd, self.cap_per_day_usd)
        return CostCheck(True, "ok",
                         spent, self.cap_per_cycle_usd, self.cap_per_day_usd)

    def record_cycle(self, *, cost_usd: float) -> None:
        """Add ``cost_usd`` to today's running total. Persists immediately."""
        self._rotate_if_new_day()
        self._state["spent_usd"] = float(self._state.get("spent_usd", 0.0)) + max(0.0, cost_usd)
        self._state["cycles"] = int(self._state.get("cycles", 0)) + 1
        self._save()

    def reset_today(self) -> None:
        """Manual reset · used by `umbris custos-reset`."""
        self._state = {"date": date.today().isoformat(), "spent_usd": 0.0, "cycles": 0}
        self._save()


# ──────────────────────────────────────────────────────────────────
# PID file · single-instance enforcement
# ──────────────────────────────────────────────────────────────────


@dataclass
class PIDLock:
    """Lightweight single-instance lock backed by a PID file.

    Not bulletproof against every race, but enough to stop a user
    from accidentally starting two Custos instances against the same repo.
    """

    path: Path

    def acquire(self, *, pid: int) -> bool:
        if self.path.exists():
            try:
                existing = int(self.path.read_text().strip())
            except (OSError, ValueError):
                existing = 0
            # If the previous process is dead, take over.
            if existing > 0 and _pid_is_alive(existing):
                return False
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(str(pid), encoding="utf-8")
        return True

    def release(self) -> None:
        try:
            self.path.unlink()
        except OSError:
            pass


def _pid_is_alive(pid: int) -> bool:
    """Cross-platform best-effort check that a PID is still running."""
    if pid <= 0:
        return False
    try:
        import os
        os.kill(pid, 0)
        return True
    except (OSError, ProcessLookupError):
        return False


# ──────────────────────────────────────────────────────────────────
# Interval parsing · accept "30m" / "2h" / "1d" forms
# ──────────────────────────────────────────────────────────────────


def parse_interval(s: str) -> int:
    """Parse an interval like '30m', '2h', '1d', or a bare integer
    (seconds). Returns seconds. Raises ValueError on bad input."""
    s = s.strip().lower()
    if not s:
        raise ValueError("empty interval")
    if s.isdigit():
        return int(s)
    unit = s[-1]
    n = s[:-1]
    if not n or not n.replace(".", "").isdigit():
        raise ValueError(f"unparseable interval: {s!r}")
    multipliers = {"s": 1, "m": 60, "h": 3600, "d": 86400}
    if unit not in multipliers:
        raise ValueError(f"unknown unit {unit!r}; use s/m/h/d")
    return int(float(n) * multipliers[unit])
