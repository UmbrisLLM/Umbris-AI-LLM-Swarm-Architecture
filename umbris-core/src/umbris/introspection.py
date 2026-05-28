"""
umbris.introspection · the convocation reading itself.

The functional bridge between UMBRIS and its own repository. Tools that
let the compositione loop *see* the project it is working on: scan the
filesystem, identify gaps, surface candidate bottlenecks, and feed
them back into the Umbra so the convocation can deliberate over what to
work on next.

The pattern is the one a careful human uses to audit their own code:
walk the tree, ask "what's missing here?", surface a punch list. The
difference is that here the punch list does not go into a Notion
doc · it goes back into the convocation, and the convocation decides which
item is the highest-conviction next move.

Typical use, alongside `CompositioneLoop`:

    >>> from pathlib import Path
    >>> from umbris import Umbra, LLMClient, CompositioneLoop
    >>> from umbris.introspection import RepoAnalyst, surface_bottlenecks
    >>>
    >>> analyst = RepoAnalyst(repo_root=Path("."))
    >>> observations = analyst.scan()
    >>> print(f"surfaced {len(observations)} observations from the repo")
    >>>
    >>> # Feed them into the convocation to pick what to work on next.
    >>> verdict = await surface_bottlenecks(umbra, observations, n=3)
    >>>
    >>> # The verdict text can become the goal for a CompositioneLoop.
    >>> loop = CompositioneLoop(hive=umbra, goal=str(verdict.answer))
    >>> await loop.run(max_iterations=3, commit_handler=apply)

No external dependencies. Walks plain text and Python AST only. Safe
to run against any repository.
"""

from __future__ import annotations

import ast
import logging
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Iterator, Optional

from .agents.base import Budget
from .umbra import Umbra

__all__ = [
    "Observation",
    "RepoAnalyst",
    "surface_bottlenecks",
]

log = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────
# Types
# ──────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class Observation:
    """One finding from a repository scan.

    Severity is 1 to 5; higher means more likely to be worth addressing.
    The convocation reads these as structured context when surfacing the
    next bottleneck.
    """

    kind: str           # "todo" | "stale_link" | "missing_docstring" | "test_gap"
    location: str       # "path:line" or just "path"
    summary: str        # one-line description
    severity: int = 1   # 1 (minor) to 5 (urgent)

    def as_line(self) -> str:
        return f"[{self.kind} sev={self.severity}] {self.location}: {self.summary}"


# ──────────────────────────────────────────────────────────────────
# The Analyst
# ──────────────────────────────────────────────────────────────────


class RepoAnalyst:
    """Walks a repository surfacing things the convocation might want to fix.

    Four scanners ship out of the box. Each one is small, transparent,
    and easy to extend:

      * find_todos               · TODO / FIXME / HACK comments
      * find_stale_links         · markdown links to files that do not exist
      * find_missing_docstrings  · Python functions / classes with no docstring
      * find_test_gaps           · source modules with no matching test file

    All four are also run together by `scan()`.

    The analyst respects a reasonable default ignore list (`.git`,
    `node_modules`, `.venv`, `__pycache__`, build outputs, etc.). Pass
    a custom set if your repository needs different exclusions.
    """

    DEFAULT_IGNORE: frozenset[str] = frozenset({
        ".git", ".github", "node_modules", ".venv", "venv",
        "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache",
        ".next", "out", "dist", "build", ".turbo", ".vercel",
    })

    DEFAULT_TEXT_EXTS: frozenset[str] = frozenset({
        ".py", ".ts", ".tsx", ".js", ".jsx", ".md", ".mdx", ".rst",
        ".yml", ".yaml", ".toml",
    })

    TODO_PATTERN = re.compile(
        r"(?:#|//|<!--)\s*(TODO|FIXME|HACK|XXX)[:\s]+(.+?)(?:-->|$)",
        re.IGNORECASE,
    )

    # Matches `[text](path)` markdown links where path is not a URL,
    # not an anchor, and not an email.
    MD_LINK_PATTERN = re.compile(
        r"\[([^\]]+)\]\(((?!https?://|mailto:|#)[^)]+)\)",
    )

    def __init__(
        self,
        repo_root: Path,
        *,
        ignore: Optional[Iterable[str]] = None,
        text_extensions: Optional[Iterable[str]] = None,
    ) -> None:
        self.repo_root = Path(repo_root).resolve()
        self.ignore = frozenset(ignore) if ignore is not None else self.DEFAULT_IGNORE
        self.text_extensions = (
            frozenset(text_extensions) if text_extensions is not None
            else self.DEFAULT_TEXT_EXTS
        )

    # ── orchestration ────────────────────────────────────────────

    def scan(self) -> list[Observation]:
        """Run every scanner and return the merged, severity-sorted list."""
        observations: list[Observation] = []
        observations.extend(self.find_todos())
        observations.extend(self.find_stale_links())
        observations.extend(self.find_missing_docstrings())
        observations.extend(self.find_test_gaps())
        # Sort by severity (descending) so the most urgent surface first.
        observations.sort(key=lambda o: (-o.severity, o.location))
        log.info("repo scan complete: %d observations", len(observations))
        return observations

    # ── individual scanners ──────────────────────────────────────

    def find_todos(self) -> list[Observation]:
        """TODO / FIXME / HACK / XXX comments across the codebase."""
        out: list[Observation] = []
        severity_map = {"TODO": 2, "FIXME": 3, "HACK": 3, "XXX": 4}
        for path in self._walk_files(self.text_extensions):
            try:
                lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
            except OSError:
                continue
            for lineno, line in enumerate(lines, start=1):
                m = self.TODO_PATTERN.search(line)
                if not m:
                    continue
                tag = m.group(1).upper()
                text = m.group(2).strip().rstrip("-").strip()
                rel = path.relative_to(self.repo_root).as_posix()
                out.append(Observation(
                    kind="todo",
                    location=f"{rel}:{lineno}",
                    summary=f"{tag}: {text}",
                    severity=severity_map.get(tag, 2),
                ))
        return out

    def find_stale_links(self) -> list[Observation]:
        """Markdown links pointing at files that do not exist on disk."""
        out: list[Observation] = []
        for path in self._walk_files(frozenset({".md", ".mdx"})):
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            for m in self.MD_LINK_PATTERN.finditer(text):
                target = m.group(2).split("#")[0].split("?")[0].strip()
                if not target or target.startswith("data:"):
                    continue
                target_path = (path.parent / target).resolve()
                if target_path.exists():
                    continue
                rel = path.relative_to(self.repo_root).as_posix()
                out.append(Observation(
                    kind="stale_link",
                    location=rel,
                    summary=f'broken link → "{target}"',
                    severity=3,
                ))
        return out

    def find_missing_docstrings(self) -> list[Observation]:
        """Public Python functions and classes that lack a docstring."""
        out: list[Observation] = []
        for path in self._walk_files(frozenset({".py"})):
            try:
                source = path.read_text(encoding="utf-8", errors="replace")
                tree = ast.parse(source)
            except (OSError, SyntaxError):
                continue
            rel = path.relative_to(self.repo_root).as_posix()
            for node in ast.walk(tree):
                if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                    continue
                if node.name.startswith("_"):
                    continue  # skip private
                if ast.get_docstring(node):
                    continue
                kind_label = "class" if isinstance(node, ast.ClassDef) else "function"
                out.append(Observation(
                    kind="missing_docstring",
                    location=f"{rel}:{node.lineno}",
                    summary=f"public {kind_label} `{node.name}` has no docstring",
                    severity=2,
                ))
        return out

    def find_test_gaps(self) -> list[Observation]:
        """Source modules under src/ without a corresponding tests/ file."""
        out: list[Observation] = []
        # Look for a conventional src/<pkg>/ layout.
        for src_root in self.repo_root.glob("**/src"):
            if not src_root.is_dir() or self._is_ignored(src_root):
                continue
            tests_root = src_root.parent / "tests"
            if not tests_root.is_dir():
                continue
            for source_file in src_root.rglob("*.py"):
                if source_file.name in ("__init__.py", "__main__.py"):
                    continue
                if self._is_ignored(source_file):
                    continue
                stem = source_file.stem
                # Accept either tests/test_<name>.py or tests/<name>_test.py
                expected = [
                    tests_root / f"test_{stem}.py",
                    tests_root / f"{stem}_test.py",
                    tests_root.joinpath(*source_file.relative_to(src_root).parent.parts) / f"test_{stem}.py",
                ]
                if any(p.exists() for p in expected):
                    continue
                rel = source_file.relative_to(self.repo_root).as_posix()
                out.append(Observation(
                    kind="test_gap",
                    location=rel,
                    summary=f"module `{stem}` has no matching test file",
                    severity=3,
                ))
        return out

    # ── helpers ──────────────────────────────────────────────────

    def _walk_files(self, extensions: Iterable[str]) -> Iterator[Path]:
        """Yield every file under the repo root matching `extensions`,
        respecting the ignore list."""
        exts = frozenset(extensions)
        for path in self.repo_root.rglob("*"):
            if not path.is_file():
                continue
            if path.suffix not in exts:
                continue
            if self._is_ignored(path):
                continue
            yield path

    def _is_ignored(self, path: Path) -> bool:
        return any(part in self.ignore for part in path.parts)


# ──────────────────────────────────────────────────────────────────
# Surfacing the next bottleneck to the convocation
# ──────────────────────────────────────────────────────────────────


async def surface_bottlenecks(
    hive: Umbra,
    observations: list[Observation],
    *,
    n: int = 3,
    budget: Optional[Budget] = None,
    max_observations: int = 50,
    blackboard: Optional["Blackboard"] = None,  # noqa: F821 · forward ref to blackboard
):
    """Hand the analyst's observations to the convocation for a verdict.

    The convocation reads the structured observations as context, deliberates,
    and returns its verdict on which `n` are the highest-conviction next
    moves. The verdict text is suitable to use as the goal for a
    `CompositioneLoop`.

    If `observations` is empty, the convocation is asked to propose a goal
    from scratch instead. Either way, the run produces a `RunResult`
    with full provenance and an honest cost.

    Parameters
    ----------
    hive
        A configured `Umbra`.
    observations
        The output of `RepoAnalyst.scan()`. Will be capped at
        `max_observations` before being sent to the convocation to keep
        context lengths reasonable.
    n
        How many top candidates the convocation should return.
    budget
        Optional `Budget` cap for this deliberation.
    max_observations
        Truncation cap. Observations are already severity-sorted, so
        the top N stay.
    """
    if not observations:
        return await hive.run(
            "The repository has no surfaced gaps from the standard scanners. "
            "Propose the next highest-conviction move for the project, with "
            "reasoning and a concrete first change.",
            budget=budget or Budget(),
            blackboard=blackboard,
        )

    truncated = observations[:max_observations]
    summary = "\n".join(f"  - {o.as_line()}" for o in truncated)

    query = (
        "The convocation just scanned its own repository and surfaced the following "
        "observations (severity 1 = minor, 5 = urgent):\n\n"
        f"{summary}\n\n"
        f"Given these observations, which {n} are the highest-conviction next "
        "moves for the project? For each, explain why it matters and what the "
        "concrete first change would look like. Be ruthless about prioritising "
        "what would unlock the most leverage soonest."
    )

    return await hive.run(query, budget=budget or Budget(), blackboard=blackboard)
