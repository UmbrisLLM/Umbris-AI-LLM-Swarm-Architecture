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

In addition to the per-cycle markdown, this module maintains a rolling
`manifest.json` alongside the transcripts. The manifest is what
umbrisai.com/convocation polls every 20s (via a Vercel edge proxy that
bypasses GitHub raw's 5-minute CDN cache) to render the live feed. It
exposes the latest cycle's voices plus a rolling tail of every recent
cycle (cycle number, status, verdict, cost, commit hash) so the
sidebar on the live page can render the full cycle log.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..blackboard import Blackboard, Record


# Public URL where the live, public-facing transcript lives.
LIVE_FEED_URL = "https://umbrisai.com/convocation"

# How many recent cycles to keep in the manifest's `recent` tail.
MANIFEST_RECENT_LIMIT = 50


# ──────────────────────────────────────────────────────────────────
# Personality lookup
# ──────────────────────────────────────────────────────────────────


_PERSONALITY_DISPLAY: dict[str, dict[str, str]] = {
    "MERCURIUS": {"sigil": "☿", "name": "Mercurius", "descriptor": "the swift"},
    "VENUS":     {"sigil": "♀", "name": "Venus",     "descriptor": "the gatherer of harmony"},
    "MARS":      {"sigil": "♂", "name": "Mars",      "descriptor": "the challenger"},
    "SOL":       {"sigil": "☉", "name": "Sol",       "descriptor": "the radiant"},
    "IUPPITER":  {"sigil": "♃", "name": "Iuppiter",  "descriptor": "the discerner"},
    "SATURNUS":  {"sigil": "♄", "name": "Saturnus",  "descriptor": "the falsifier"},
    "LUNA":      {"sigil": "☽", "name": "Luna",      "descriptor": "the path-mapper"},
    "STELLA":    {"sigil": "✦", "name": "Stella",    "descriptor": "the fixed star"},
    "UMBRA":     {"sigil": "⬤", "name": "Umbra",     "descriptor": "the substrate"},
}


def _personality(role: str) -> dict[str, str]:
    """Return display info (sigil, name, descriptor) for a role string."""
    if not role:
        return {"sigil": "·", "name": "?", "descriptor": ""}
    key = str(role).upper()
    return _PERSONALITY_DISPLAY.get(
        key, {"sigil": "·", "name": str(role), "descriptor": ""}
    )


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

    Also updates `lore/revolutions/auto/manifest.json` so the live
    convocation feed on umbrisai.com can pick this cycle up.

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

        # ─── Update the rolling manifest · best-effort ─────────────
        try:
            _update_manifest(
                out_dir=out_dir,
                transcript_file=out_path.name,
                cycle_number=cycle_number,
                started_iso=started_iso,
                finished_iso=finished_iso,
                status=status,
                reason=reason,
                verdict_text=verdict_text or "",
                records=records,
                files_changed=files_changed,
                commit_hash=commit_hash,
                cost_usd=cost_usd,
            )
        except Exception:
            # Manifest writing failure must not break the cycle.
            pass

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

    # ─── Live-feed pointer ───────────────────────────────────────────
    # First line of every transcript points to the public live page so
    # anyone reading the raw markdown on GitHub knows where the
    # animated version lives.
    lines.append(f"<!-- live version · {LIVE_FEED_URL} -->")
    lines.append("")

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
    lines.append(
        "_This transcript was written automatically by the Custos sentinel · "
        "`umbris-core/src/umbris/daemon/transcript.py`._"
    )
    lines.append(
        f"_The live, animated version lives at [{LIVE_FEED_URL}]({LIVE_FEED_URL})._"
    )
    lines.append("")

    return "\n".join(lines)


def _render_record(r: Record) -> list[str]:
    """One record block · personality headline + voice (if any) + structured payload."""
    out: list[str] = []
    role_raw = str(getattr(r, "agent_role", ""))
    p = _personality(role_raw)
    glyph = p["sigil"]
    name = p["name"]
    descriptor = p["descriptor"]
    agent_id = getattr(r, "agent_id", "?")
    rec_type = getattr(r, "type", "?")
    confidence = float(getattr(r, "confidence", 0.0) or 0.0)
    model = getattr(r, "model", None) or "?"
    cost = float(getattr(r, "cost_estimate", 0.0) or 0.0)

    if descriptor:
        out.append(f"### {glyph} {name} · {descriptor} · says:")
    else:
        out.append(f"### {glyph} {name} · says:")
    out.append("")
    out.append(
        f"_agent:_ `{agent_id}` · _type:_ `{rec_type}` · "
        f"_confidence:_ `{confidence:.2f}` · _model:_ `{model}` · _cost:_ `${cost:.4f}`"
    )
    out.append("")

    content = getattr(r, "content", "")
    voice = _extract_voice(content)

    if voice:
        # Voice is the headline · render it as a blockquote in italics.
        for vline in str(voice).splitlines() or [""]:
            out.append(f"> _{vline}_" if vline else ">")
        out.append("")
        # Render the rest of the content as the structured payload.
        rest = _content_without_voice(content)
        if rest is not None and rest != {} and rest != "":
            out.append("_structured payload:_")
            out.append("")
            out.append("```json")
            out.append(_truncate(_pretty_json(rest), 1200))
            out.append("```")
    elif isinstance(content, dict):
        # No voice key · pretty-print the dict as before.
        out.append("```json")
        out.append(_truncate(_pretty_json(content), 1500))
        out.append("```")
    else:
        # Plain prose · quote it so it reads as speech.
        text = _truncate(str(content), 1500)
        for cline in text.splitlines() or [""]:
            out.append(f"> {cline}" if cline else ">")
    return out


# ──────────────────────────────────────────────────────────────────
# Manifest writer
# ──────────────────────────────────────────────────────────────────


def _update_manifest(
    *,
    out_dir: Path,
    transcript_file: str,
    cycle_number: int,
    started_iso: str,
    finished_iso: str,
    status: str,
    reason: str,
    verdict_text: str,
    records: list[Record],
    files_changed: list[str],
    commit_hash: str | None,
    cost_usd: float,
) -> None:
    """Rewrite `manifest.json` to reflect this cycle as the latest.

    The manifest is the contract with umbrisai.com/convocation · keep
    the schema stable. If you change it, also update the page reader.
    """
    manifest_path = out_dir / "manifest.json"

    voices = [_voice_entry(r) for r in records]
    voices = [v for v in voices if v is not None]

    latest_summary = {
        "file": transcript_file,
        "cycle": cycle_number,
        "started_at": started_iso,
        "finished_at": finished_iso,
        "status": status,
        "reason": reason,
        "verdict": (verdict_text or "").strip(),
        "cost_usd": float(cost_usd or 0.0),
        "files_changed": list(files_changed or []),
        "commit_hash": commit_hash,
        "voices": voices,
    }

    # The recent entry carries enough metadata that the sidebar on
    # umbrisai.com/convocation can render every finished cycle with
    # status, cost, finish time and a click-through to the commit ·
    # without us having to load each transcript file.
    recent_entry = {
        "file": transcript_file,
        "cycle": cycle_number,
        "status": status,
        "started_at": started_iso,
        "finished_at": finished_iso,
        "verdict": _truncate((verdict_text or "").strip(), 280),
        "cost_usd": float(cost_usd or 0.0),
        "commit_hash": commit_hash,
    }

    # Load any existing manifest so we can append to `recent`.
    existing: dict[str, Any] = {}
    if manifest_path.exists():
        try:
            existing = json.loads(manifest_path.read_text(encoding="utf-8"))
            if not isinstance(existing, dict):
                existing = {}
        except Exception:
            existing = {}

    recent: list[dict[str, Any]] = []
    raw_recent = existing.get("recent", [])
    if isinstance(raw_recent, list):
        # Drop any previous entry for this cycle number · we are
        # rewriting it (re-runs / status changes).
        recent = [
            e
            for e in raw_recent
            if isinstance(e, dict) and e.get("cycle") != cycle_number
        ]
    recent.insert(0, recent_entry)
    recent = recent[:MANIFEST_RECENT_LIMIT]

    manifest = {
        "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "latest": latest_summary,
        "recent": recent,
    }

    # Atomic-ish write · write to a temp file then replace.
    tmp_path = manifest_path.with_suffix(".json.tmp")
    tmp_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    tmp_path.replace(manifest_path)


def _voice_entry(r: Record) -> dict[str, Any] | None:
    """Build the per-record entry for `manifest.latest.voices`.

    Returns None if there is nothing to show (e.g. no voice, no
    salvageable prose). Records without a voice but with prose content
    still surface · we just fall back to the prose itself.
    """
    role_raw = str(getattr(r, "agent_role", "") or "")
    p = _personality(role_raw)
    content = getattr(r, "content", "")
    voice = _extract_voice(content)

    if not voice:
        if isinstance(content, str) and content.strip():
            voice = _truncate(content.strip(), 400)
        elif isinstance(content, dict):
            # Try common fallback fields · keeps something to show.
            for key in ("summary", "headline", "answer", "observation", "content"):
                v = content.get(key)
                if isinstance(v, str) and v.strip():
                    voice = _truncate(v.strip(), 400)
                    break

    if not voice:
        return None

    return {
        "role": role_raw.upper(),
        "sigil": p["sigil"],
        "name": p["name"],
        "descriptor": p["descriptor"],
        "agent_id": getattr(r, "agent_id", ""),
        "type": str(getattr(r, "type", "")),
        "confidence": float(getattr(r, "confidence", 0.0) or 0.0),
        "model": getattr(r, "model", None),
        "cost_usd": float(getattr(r, "cost_estimate", 0.0) or 0.0),
        "voice": voice,
        "timestamp": _iso_ts(getattr(r, "timestamp", None)),
    }


# ──────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────


def _extract_voice(content: Any) -> str | None:
    """Pull the `voice` field out of a record's content, if present."""
    if isinstance(content, dict):
        v = content.get("voice")
        if isinstance(v, str) and v.strip():
            return v.strip()
    return None


def _content_without_voice(content: Any) -> Any:
    """Return the structured content sans the `voice` key, or None if empty."""
    if isinstance(content, dict):
        rest = {k: v for k, v in content.items() if k != "voice"}
        return rest if rest else None
    return content


def _pretty_json(value: Any) -> str:
    try:
        return json.dumps(value, indent=2, ensure_ascii=False, default=str)
    except Exception:
        return str(value)


def _iso_ts(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        try:
            return value.astimezone(timezone.utc).isoformat(timespec="seconds")
        except Exception:
            return value.isoformat()
    return str(value)


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
