"""
umbris.daemon.apply · turn the convocation's verdict into actual files.

Custos asks the convocation for a strict JSON patch describing the
files it wants to add to the repository. Anything ambiguous, anything
outside the allowlist, anything inside the denylist, or anything
that would overwrite an existing file is rejected before a single
byte hits disk.

v1.1 ships **create-only** · Custos may only ADD new files.
Modifying existing files (with the additional diff context that
requires) is reserved for a later revolution.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

from pydantic import BaseModel, Field, ValidationError

from ..umbra import Umbra
from .safety import PathPolicy

MAX_FILES_PER_PATCH = 5
MAX_FILE_BYTES = 200_000  # 200 KB per file


# ──────────────────────────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────────────────────────


class PatchFile(BaseModel):
    """One file in a structured patch."""

    path: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1)


class StructuredPatch(BaseModel):
    """A complete patch as returned by the Patcher prompt."""

    summary: str = Field(..., min_length=3, max_length=200)
    files: list[PatchFile] = Field(..., min_length=1, max_length=MAX_FILES_PER_PATCH)


@dataclass
class ApplyResult:
    """The outcome of an apply attempt."""

    ok: bool
    reason: str                           # "ok" or short failure reason
    summary: str = ""                     # the convocation's one-line summary, if any
    paths_written: list[str] | None = None

    def __post_init__(self) -> None:
        if self.paths_written is None:
            self.paths_written = []


# ──────────────────────────────────────────────────────────────────
# The patcher prompt
# ──────────────────────────────────────────────────────────────────


PATCHER_SYSTEM_PROMPT = """\
You are the UMBRIS Patcher. The convocation has already deliberated and chosen \
its next move. Your sole job is to convert that verdict into a strict \
JSON patch that adds new files to the repository.

Output rules (absolute):
1. Respond with ONLY valid JSON. No markdown fences. No commentary before \
   or after. No <thinking> tags. Just the JSON object.
2. The patch is CREATE-ONLY. Never propose modifying existing files. \
   Every entry must be a brand-new file that does not yet exist.
3. Maximum {max_files} files per patch. Smaller is better; one is fine.
4. Every `path` must match one of the allowlist globs and must not match \
   any denylist glob. Use repo-relative POSIX paths.
5. Every `content` must be the COMPLETE, FINAL contents of that file. \
   No placeholders, no "...", no TODO comments inviting future work.
6. Stay in the UMBRIS register where appropriate (lore artefacts, docs, \
   convocation-decisions logs).

Allowlist globs:
{allowlist}

Denylist globs (never write here):
{denylist}

The schema you must produce, exactly:

{{
  "summary": "<one-line description of what this patch adds>",
  "files": [
    {{ "path": "<repo-relative path>", "content": "<full file content>" }}
  ]
}}
"""


def _build_patcher_system(policy: PathPolicy) -> str:
    return PATCHER_SYSTEM_PROMPT.format(
        max_files=MAX_FILES_PER_PATCH,
        allowlist="\n".join(f"  - {p}" for p in policy.allowlist),
        denylist="\n".join(f"  - {p}" for p in policy.denylist),
    )


# ──────────────────────────────────────────────────────────────────
# Asking the convocation for a structured patch
# ──────────────────────────────────────────────────────────────────


async def request_patch(
    hive: Umbra,
    *,
    verdict_text: str,
    policy: PathPolicy,
    max_tokens: int = 12_000,
) -> tuple[StructuredPatch | None, str, float]:
    """Ask the convocation's `Umbra` for a structured patch.

    Returns ``(patch, raw_text, cost_usd)``. ``patch`` is None when
    the model output failed to parse / validate.
    """
    system = _build_patcher_system(policy)
    user = (
        "The convocation has decided. Convert this verdict into a strict JSON patch:\n\n"
        "─────────── VERDICT ───────────\n"
        f"{verdict_text}\n"
        "──────────────────────────────\n\n"
        "Respond with ONLY the JSON object. No fences. No commentary."
    )

    # Bypass the multi-planet Umbra: we just want one direct completion
    # from the configured provider here. Reach into the LLMClient.
    result = await hive.llm.complete(
        system=system,
        user=user,
        max_tokens=max_tokens,
        thinking=False,
        cache_system=True,
    )
    return parse_patch(result.text), result.text, float(result.cost_usd or 0.0)


# ──────────────────────────────────────────────────────────────────
# Parsing + validating a patch
# ──────────────────────────────────────────────────────────────────


_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def parse_patch(raw: str) -> StructuredPatch | None:
    """Best-effort parse of the convocation's response into a `StructuredPatch`.

    Strips markdown fences and surrounding prose; returns None if the
    result still isn't valid JSON / valid against the schema.
    """
    if not raw:
        return None
    text = _FENCE_RE.sub("", raw).strip()

    # If the model leaked prose before/after the JSON, try to extract
    # the outermost {...} block.
    if not text.startswith("{"):
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end <= start:
            return None
        text = text[start : end + 1]

    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        return None
    try:
        return StructuredPatch.model_validate(payload)
    except ValidationError:
        return None


# ──────────────────────────────────────────────────────────────────
# Applying a patch to disk (with safety checks)
# ──────────────────────────────────────────────────────────────────


def apply_patch(
    patch: StructuredPatch,
    *,
    repo_root: Path,
    policy: PathPolicy,
) -> ApplyResult:
    """Validate then write the patch's files. Returns a structured
    `ApplyResult` describing what happened. Never overwrites existing
    files; never writes outside the policy; never silently truncates.
    """
    # ── 1. Pre-flight: validate every path before writing any of them ──
    resolved: list[tuple[Path, str]] = []
    for f in patch.files:
        check = policy.check(repo_root, Path(f.path))
        if not check.allowed:
            return ApplyResult(
                ok=False,
                reason=f"path policy rejected {f.path!r}: {check.reason}",
                summary=patch.summary,
            )
        target = (repo_root / f.path).resolve()
        if target.exists():
            return ApplyResult(
                ok=False,
                reason=f"refusing to overwrite existing file: {f.path!r} (v1.1 is create-only)",
                summary=patch.summary,
            )
        if len(f.content.encode("utf-8")) > MAX_FILE_BYTES:
            return ApplyResult(
                ok=False,
                reason=f"file too large (> {MAX_FILE_BYTES} bytes): {f.path!r}",
                summary=patch.summary,
            )
        resolved.append((target, f.content))

    # ── 2. Write everything (atomically per file) ──
    written: list[str] = []
    for target, content in resolved:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        written.append(target.relative_to(repo_root.resolve()).as_posix())

    return ApplyResult(
        ok=True,
        reason="ok",
        summary=patch.summary,
        paths_written=written,
    )
