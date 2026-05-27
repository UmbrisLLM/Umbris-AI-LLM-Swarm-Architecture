"""
umbris.daemon.transcript · per-cycle conversation logger.

Every Custos cycle now drops a markdown transcript to
`<repo>/lore/revolutions/auto/<timestamp>_cycle-<n>_<status>.md`
containing the full agent-by-agent deliberation:

  · The repo scan observation that triggered the cycle
  · Every Imago written to the Umbra substrate by every planet
  · The convocation's synthesised verdict
  · The structured patch the Patcher prompt produced (if any)
  · The outcome and reason (committed / skipped / why)

The doctrine says every revolution should be visible in writing.
v1.1 was missing this · this module closes the gap.

Failures here are best-effort · transcript writing never blocks the
cycle from completing.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..blackboard import Blackboard, Record


# ──────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────


async def write_cycle_transcript(
    *,
    repo_root: Path,
    cycle_number: int,
    started_iso: str,
    finished_iso: str,
    wall_seconds: float,
    status: str,                          # "ok" / "skipped" / "halted" / etc.
    reason: str,                          # human-readable outcome
    verdict_text: str | None,             # synthesised verdict from surface_bottlenecks
    verdict_blackboard: Blackboard | None,  # full deliberation on the verdict
    patch_summary: str | None,            # the Patcher prompt's one-liner
    patch_files: list[tuple[str, str]] | None,  # (path, content_snippet)
    raw_patcher_response: str | None,     # for debugging when parse fails
    observations_count: int,
    files_changed: list[str],
    commit_hash: str | None,
    cost_usd: float,
) -> Path | None:
    """Write the cycle to disk as a readable markdown transcript.

    Returns the path written, or None on any error (never raises ·
    transcript failures must not break the daemon loop).
    """
    try:
        ts = _iso_to_filename(started_iso)
        out_dir = repo_root / "lore" / "revolutions" / "auto"
        out_dir.mkdir(parents=True, exist_ok=True)
        slug = f"{ts}_cycle-{cycle_number:04d}_{_slugify(status)}.md"
        out_path = out_dir / slug

        records: list[Record] = []
        if verdict_blackboard is not None:
            try:
                records = list(await verdict_blackboard.read())
            except Exception:
                records = []

        md = _render(
            cycle_number=cycle_number,
            started_iso=started_iso,
            finished_iso=finished_iso,
            wall_seconds=wall_seconds,
            status=status,
            reason=reason,
            verdict_text=verdict_text or "",
            records=records,
            patch_summary=patch_summary,
            patch_files=patch_files or [],
            raw_patcher_response=raw_patcher_response,
            observations_count=observations_count,
            files_changed=files_changed,
            commit_hash=commit_hash,
            cost_usd=cost_usd,
        )
        out_path.write_text(md, encoding="utf-8")
        return out_path
    except Exception:
        # Best-effort · never let transcript writing break the cycle.
        return None


# ──────────────────────────────────────────────────────────────────
# Markdown rendering
# ──────────────────────────────────────────────────────────────────


def _render(
    *,
    cycle_number: int,
    started_iso: str,
    finished_iso: str,
    wall_seconds: float,
    status: str,
    reason: str,
    verdict_text: str,
    records: list[Record],
    patch_summary: str | None,
    patch_files: list[tuple[str, str]],
    raw_patcher_response: str | None,
    observations_count: int,
    files_changed: list[str],
    commit_hash: str | None,
    cost_usd: float,
) -> str:
    lines: list[str] = []

    # ─── Front-matter / Header ───────────────────────────────────────
    lines.append(f"# Revolution · cycle {cycle_number:04d}")
    lines.append("")
    lines.append(f"**Status:** {status}  ")
    lines.append(f"**Started:** {started_iso}  ")
    lines.append(f"**Finished:** {finished_iso}  ")
    lines.append(f"**Wall:** {wall_seconds:.2f}s  ")
    lines.append(f"**Cost:** ${cost_usd:.4f}  ")
    lines.append(f"**Observations scanned:** {observations_count}  ")
    if commit_hash:
        lines.append(f"**Commit:** `{commit_hash}`  ")
    if files_changed:
        lines.append(f"**Files written:** {', '.join(f'`{p}`' for p in files_changed)}  ")
    lines.append("")
    lines.append(f"> {reason}")
    lines.append("")

    # ─── The deliberation · agent by agent ───────────────────────────
    lines.append("## § 1 · The convocation deliberates")
    lines.append("")
    if not records:
        lines.append("_No records on the Umbra substrate for this cycle. The deliberation either did not produce typed records or the blackboard was not preserved past the cycle boundary._")
        lines.append("")
    else:
        for r in records:
            lines.extend(_render_record(r))
            lines.append("")

    # ─── The verdict ─────────────────────────────────────────────────
    lines.append("## § 2 · The verdict")
    lines.append("")
    if verdict_text.strip():
        # Quote the verdict so it reads as the convocation speaking.
        for vline in verdict_text.strip().splitlines():
            lines.append(f"> {vline}")
        lines.append("")
    else:
        lines.append("_No verdict text was synthesised._")
        lines.append("")

    # ─── The patch ───────────────────────────────────────────────────
    lines.append("## § 3 · The proposed patch")
    lines.append("")
    if patch_summary or patch_files:
        if patch_summary:
            lines.append(f"**Patcher one-liner:** {patch_summary}")
            lines.append("")
        if patch_files:
            for path, content in patch_files:
                lines.append(f"### `{path}`")
                lines.append("")
                lines.append("```")
                lines.append(_truncate(content, 1200))
                lines.append("```")
                lines.append("")
        else:
            lines.append("_No files in the patch._")
            lines.append("")
    elif raw_patcher_response:
        lines.append("_The Patcher prompt failed to produce a valid structured patch. Raw response below for debugging._")
        lines.append("")
        lines.append("```")
        lines.append(_truncate(raw_patcher_response, 2000))
        lines.append("```")
        lines.append("")
    else:
        lines.append("_No patch was attempted in this cycle (e.g. cost-cap halt or no observations)._")
        lines.append("")

    # ─── Outcome ─────────────────────────────────────────────────────
    lines.append("## § 4 · Outcome")
    lines.append("")
    lines.append(f"- **Status:** `{status}`")
    lines.append(f"- **Reason:** {reason}")
    if commit_hash:
        lines.append(f"- **Commit hash:** `{commit_hash}`")
    if files_changed:
        lines.append("- **Files written:**")
        for p in files_changed:
            lines.append(f"  - `{p}`")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("_This transcript was written automatically by the Custos sentinel · `umbris-core/src/umbris/daemon/transcript.py`._")
    lines.append("")

    return "\n".join(lines)


def _render_record(r: Record) -> list[str]:
    """One record block · agent + type + content + meta."""
    out: list[str] = []
    glyph = _sigil(str(getattr(r, "agent_role", "")))
    role_name = getattr(r, "agent_role", "?")
    agent_id = getattr(r, "agent_id", "?")
    rec_type = getattr(r, "type", "?")
    confidence = float(getattr(r, "confidence", 0.0) or 0.0)
    model = getattr(r, "model", None) or "?"
    cost = float(getattr(r, "cost_estimate", 0.0) or 0.0)

    out.append(f"### {glyph} {role_name} · `{agent_id}`")
    out.append("")
    out.append(f"_type:_ `{rec_type}` · _confidence:_ `{confidence:.2f}` · _model:_ `{model}` · _cost:_ `${cost:.4f}`")
    out.append("")
    content = getattr(r, "content", "")
    if isinstance(content, dict):
        # Pretty-print JSON contents.
        try:
            content_str = json.dumps(content, indent=2, ensure_ascii=False)
        except Exception:
            content_str = str(content)
        out.append("```json")
        out.append(_truncate(content_str, 1500))
        out.append("```")
    else:
        # Plain prose · quote it so it reads as speech.
        text = _truncate(str(content), 1500)
        for cline in text.splitlines() or [""]:
            out.append(f"> {cline}" if cline else ">")
    return out


# ──────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────


_SIGIL = {
    "MERCURIUS": "☿",
    "VENUS":     "♀",
    "MARS":      "♂",
    "SOL":       "☉",
    "IUPPITER":  "♃",
    "SATURNUS":  "♄",
    "LUNA":      "☽",
    "STELLA":    "✦",
    "UMBRA":     "⬤",
    "mercurius": "☿", "venus": "♀", "mars": "♂", "sol": "☉",
    "iuppiter": "♃", "saturnus": "♄", "luna": "☽", "stella": "✦", "umbra": "⬤",
}


def _sigil(role: str) -> str:
    return _SIGIL.get(role, "·")


def _slugify(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "unknown"


def _iso_to_filename(iso: str) -> str:
    """Turn `2026-05-27T15:30:42+00:00` into `2026-05-27T15-30-42Z`."""
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    except Exception:
        # Fallback · just sanitise the string.
        return _slugify(iso)


def _truncate(s: str, n: int) -> str:
    if len(s) <= n:
        return s
    return s[: n - 1].rstrip() + "…"
