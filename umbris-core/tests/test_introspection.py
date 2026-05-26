"""Tests for umbris.introspection · Observation, RepoAnalyst, surface_bottlenecks.

These tests use pytest's `tmp_path` fixture to construct controlled mini-
repositories so each scanner is exercised in isolation against known
inputs. No network, no live API, no Anthropic key needed; the
`surface_bottlenecks` async helper is tested against a stub Umbra that
records its inputs and returns a controlled result.
"""

from __future__ import annotations

from dataclasses import FrozenInstanceError
from pathlib import Path
from typing import Any

import pytest

from umbris.introspection import (
    Observation,
    RepoAnalyst,
    surface_bottlenecks,
)


# ──────────────────────────────────────────────────────────────────
# Observation
# ──────────────────────────────────────────────────────────────────


def test_observation_defaults():
    obs = Observation(
        kind="todo",
        location="foo.py:42",
        summary="needs cleanup",
    )
    assert obs.kind == "todo"
    assert obs.location == "foo.py:42"
    assert obs.summary == "needs cleanup"
    assert obs.severity == 1


def test_observation_severity_override():
    obs = Observation(
        kind="stale_link",
        location="README.md",
        summary='broken link → "docs/missing.md"',
        severity=4,
    )
    assert obs.severity == 4


def test_observation_as_line_format():
    obs = Observation(
        kind="todo",
        location="foo.py:42",
        summary="needs cleanup",
        severity=3,
    )
    line = obs.as_line()
    assert "[todo sev=3]" in line
    assert "foo.py:42" in line
    assert "needs cleanup" in line


def test_observation_is_frozen():
    obs = Observation(kind="todo", location="x", summary="x")
    with pytest.raises(FrozenInstanceError):
        obs.kind = "other"  # type: ignore[misc]


# ──────────────────────────────────────────────────────────────────
# RepoAnalyst · find_todos
# ──────────────────────────────────────────────────────────────────


def test_find_todos_python_comments(tmp_path: Path):
    (tmp_path / "main.py").write_text(
        "def foo():\n"
        "    # TODO: implement this\n"
        "    pass\n"
        "\n"
        "def bar():\n"
        "    # FIXME: broken edge case\n"
        "    pass\n"
    )
    analyst = RepoAnalyst(repo_root=tmp_path)
    todos = analyst.find_todos()
    assert len(todos) == 2
    summaries = " | ".join(t.summary for t in todos)
    assert "implement this" in summaries
    assert "broken edge case" in summaries
    assert all(t.kind == "todo" for t in todos)
    # FIXME should outrank TODO in severity
    by_loc = {t.location.split(":")[1]: t for t in todos}
    todo_line = by_loc["2"]
    fixme_line = by_loc["6"]
    assert fixme_line.severity > todo_line.severity


def test_find_todos_js_and_markdown(tmp_path: Path):
    (tmp_path / "app.ts").write_text("// HACK: temporary workaround\n")
    (tmp_path / "notes.md").write_text("<!-- XXX: urgent rewrite -->\n")
    analyst = RepoAnalyst(repo_root=tmp_path)
    todos = analyst.find_todos()
    assert len(todos) == 2
    tags = " ".join(t.summary for t in todos)
    assert "HACK" in tags
    assert "XXX" in tags


def test_find_todos_records_path_and_line(tmp_path: Path):
    (tmp_path / "src.py").write_text(
        "x = 1\n"
        "y = 2\n"
        "# TODO: fix this\n"
    )
    analyst = RepoAnalyst(repo_root=tmp_path)
    todos = analyst.find_todos()
    assert len(todos) == 1
    assert todos[0].location == "src.py:3"


def test_find_todos_handles_no_matches(tmp_path: Path):
    (tmp_path / "clean.py").write_text("x = 1\ny = 2\n")
    analyst = RepoAnalyst(repo_root=tmp_path)
    assert analyst.find_todos() == []


# ──────────────────────────────────────────────────────────────────
# RepoAnalyst · find_stale_links
# ──────────────────────────────────────────────────────────────────


def test_find_stale_links_flags_missing(tmp_path: Path):
    (tmp_path / "README.md").write_text(
        "See [docs](docs/missing.md) for more.\n"
        "Also [the spec](spec.md).\n"
    )
    analyst = RepoAnalyst(repo_root=tmp_path)
    stale = analyst.find_stale_links()
    assert len(stale) == 2
    targets = " ".join(s.summary for s in stale)
    assert "docs/missing.md" in targets
    assert "spec.md" in targets


def test_find_stale_links_skips_existing(tmp_path: Path):
    (tmp_path / "spec.md").write_text("# Spec\n")
    (tmp_path / "README.md").write_text("See [spec](spec.md).\n")
    analyst = RepoAnalyst(repo_root=tmp_path)
    assert len(analyst.find_stale_links()) == 0


def test_find_stale_links_ignores_external_urls(tmp_path: Path):
    (tmp_path / "README.md").write_text(
        "Visit [our site](https://example.com).\n"
        "Email [us](mailto:hi@example.com).\n"
        "See [section](#anchor).\n"
    )
    analyst = RepoAnalyst(repo_root=tmp_path)
    assert analyst.find_stale_links() == []


def test_find_stale_links_handles_anchors(tmp_path: Path):
    """A link with an anchor (file.md#section) should check just the file."""
    (tmp_path / "spec.md").write_text("# Spec\n")
    (tmp_path / "README.md").write_text("See [Section A](spec.md#section-a).\n")
    analyst = RepoAnalyst(repo_root=tmp_path)
    assert analyst.find_stale_links() == []


# ──────────────────────────────────────────────────────────────────
# RepoAnalyst · find_missing_docstrings
# ──────────────────────────────────────────────────────────────────


def test_find_missing_docstrings_flags_public(tmp_path: Path):
    (tmp_path / "mod.py").write_text(
        "def public_no_doc():\n"
        "    pass\n"
        "\n"
        "def public_with_doc():\n"
        "    '''has docs'''\n"
        "    pass\n"
        "\n"
        "def _private_no_doc():\n"
        "    pass\n"
        "\n"
        "class PublicClass:\n"
        "    pass\n"
    )
    analyst = RepoAnalyst(repo_root=tmp_path)
    missing = analyst.find_missing_docstrings()
    names = " ".join(m.summary for m in missing)
    assert "public_no_doc" in names
    assert "PublicClass" in names
    assert "_private_no_doc" not in names
    assert "public_with_doc" not in names


def test_find_missing_docstrings_handles_async_functions(tmp_path: Path):
    (tmp_path / "asyncmod.py").write_text(
        "async def public_async():\n"
        "    pass\n"
    )
    analyst = RepoAnalyst(repo_root=tmp_path)
    missing = analyst.find_missing_docstrings()
    assert len(missing) == 1
    assert "public_async" in missing[0].summary


def test_find_missing_docstrings_survives_syntax_errors(tmp_path: Path):
    """Broken Python files should be skipped silently rather than crash the scan."""
    (tmp_path / "broken.py").write_text("def syntax error here\n")
    (tmp_path / "good.py").write_text("def public():\n    pass\n")
    analyst = RepoAnalyst(repo_root=tmp_path)
    missing = analyst.find_missing_docstrings()
    # The good file should still be scanned even though broken.py is malformed.
    assert any("public" in m.summary for m in missing)


# ──────────────────────────────────────────────────────────────────
# RepoAnalyst · find_test_gaps
# ──────────────────────────────────────────────────────────────────


def test_find_test_gaps_flags_missing_test(tmp_path: Path):
    src = tmp_path / "src" / "mypkg"
    src.mkdir(parents=True)
    (src / "foo.py").write_text("def hello(): pass\n")
    (tmp_path / "tests").mkdir()
    # No test_foo.py · should be flagged.
    analyst = RepoAnalyst(repo_root=tmp_path)
    gaps = analyst.find_test_gaps()
    assert len(gaps) == 1
    assert "foo" in gaps[0].summary


def test_find_test_gaps_skips_when_test_exists(tmp_path: Path):
    src = tmp_path / "src" / "mypkg"
    src.mkdir(parents=True)
    (src / "foo.py").write_text("def hello(): pass\n")
    (tmp_path / "tests").mkdir()
    (tmp_path / "tests" / "test_foo.py").write_text("def test_foo(): pass\n")
    analyst = RepoAnalyst(repo_root=tmp_path)
    assert analyst.find_test_gaps() == []


def test_find_test_gaps_ignores_init_and_main(tmp_path: Path):
    """__init__.py and __main__.py should never be flagged as needing tests."""
    src = tmp_path / "src" / "mypkg"
    src.mkdir(parents=True)
    (src / "__init__.py").write_text("")
    (src / "__main__.py").write_text("pass\n")
    (tmp_path / "tests").mkdir()
    analyst = RepoAnalyst(repo_root=tmp_path)
    assert analyst.find_test_gaps() == []


# ──────────────────────────────────────────────────────────────────
# RepoAnalyst · orchestration
# ──────────────────────────────────────────────────────────────────


def test_scan_merges_all_scanners(tmp_path: Path):
    """scan() should return findings from every scanner combined."""
    (tmp_path / "mod.py").write_text(
        "def needs_doc():\n"
        "    # TODO: explain me\n"
        "    pass\n"
    )
    (tmp_path / "README.md").write_text("See [docs](missing.md).\n")
    analyst = RepoAnalyst(repo_root=tmp_path)
    observations = analyst.scan()
    kinds = {o.kind for o in observations}
    assert "todo" in kinds
    assert "missing_docstring" in kinds
    assert "stale_link" in kinds


def test_scan_sorts_by_severity_descending(tmp_path: Path):
    (tmp_path / "mod.py").write_text(
        "# TODO: minor\n"
        "# FIXME: critical\n"
    )
    analyst = RepoAnalyst(repo_root=tmp_path)
    observations = analyst.scan()
    severities = [o.severity for o in observations]
    assert severities == sorted(severities, reverse=True)


def test_scan_handles_empty_repo(tmp_path: Path):
    analyst = RepoAnalyst(repo_root=tmp_path)
    assert analyst.scan() == []


def test_ignore_list_excludes_paths(tmp_path: Path):
    """Files inside ignored directories should not be scanned."""
    (tmp_path / ".git").mkdir()
    (tmp_path / ".git" / "internal.py").write_text("# TODO: skip me\n")
    (tmp_path / "real.py").write_text("# TODO: find me\n")
    analyst = RepoAnalyst(repo_root=tmp_path)
    todos = analyst.find_todos()
    assert len(todos) == 1
    assert "find me" in todos[0].summary


def test_custom_ignore_set_overrides_default(tmp_path: Path):
    """A user-supplied ignore set replaces the default."""
    (tmp_path / "custom_skip").mkdir()
    (tmp_path / "custom_skip" / "x.py").write_text("# TODO: skip me\n")
    (tmp_path / "real.py").write_text("# TODO: find me\n")
    analyst = RepoAnalyst(repo_root=tmp_path, ignore={"custom_skip"})
    todos = analyst.find_todos()
    summaries = " ".join(t.summary for t in todos)
    assert "find me" in summaries
    assert "skip me" not in summaries


def test_custom_extensions_filter_walk(tmp_path: Path):
    """Restricting text_extensions should limit which files are scanned."""
    (tmp_path / "code.py").write_text("# TODO: in py\n")
    (tmp_path / "code.ts").write_text("// TODO: in ts\n")
    analyst = RepoAnalyst(repo_root=tmp_path, text_extensions={".py"})
    todos = analyst.find_todos()
    summaries = " ".join(t.summary for t in todos)
    assert "in py" in summaries
    assert "in ts" not in summaries


# ──────────────────────────────────────────────────────────────────
# surface_bottlenecks · async, stubbed Umbra
# ──────────────────────────────────────────────────────────────────


class _StubSummary:
    """Minimal stand-in for ProvenanceSummary used by RunResult."""
    total_cost_usd: float = 0.0


class _StubRunResult:
    """Minimal stand-in for RunResult."""
    def __init__(self, answer: str = "stub verdict") -> None:
        self.answer = answer
        self.accepted = True
        self.summary = _StubSummary()


class _StubUmbra:
    """Records queries handed to it; returns a controlled stub result.

    Lets us exercise surface_bottlenecks without spending an API dollar
    or needing a live key.
    """
    def __init__(self) -> None:
        self.received_queries: list[str] = []

    async def run(self, query: str, *, budget: Any = None) -> _StubRunResult:
        self.received_queries.append(query)
        return _StubRunResult(answer="stub verdict")


@pytest.mark.asyncio
async def test_surface_bottlenecks_with_observations():
    umbra = _StubUmbra()
    obs = [
        Observation(kind="todo", location="x.py:1", summary="A", severity=2),
        Observation(kind="stale_link", location="y.md", summary="B", severity=3),
    ]
    result = await surface_bottlenecks(umbra, obs, n=2)  # type: ignore[arg-type]
    assert result.answer == "stub verdict"
    assert len(umbra.received_queries) == 1
    query = umbra.received_queries[0]
    # The query should include the observations and the requested n.
    assert "[todo sev=2] x.py:1: A" in query
    assert "[stale_link sev=3] y.md: B" in query
    assert "which 2" in query


@pytest.mark.asyncio
async def test_surface_bottlenecks_empty_observations_asks_from_scratch():
    """Empty observations should trigger the from-scratch prompt path."""
    umbra = _StubUmbra()
    result = await surface_bottlenecks(umbra, [], n=3)  # type: ignore[arg-type]
    assert result.answer == "stub verdict"
    assert len(umbra.received_queries) == 1
    # The from-scratch prompt should NOT include the structured-observations text.
    assert "no surfaced gaps" in umbra.received_queries[0]


@pytest.mark.asyncio
async def test_surface_bottlenecks_caps_observation_count():
    """Should truncate to max_observations to keep context lengths sane."""
    umbra = _StubUmbra()
    many = [
        Observation(kind="todo", location=f"f{i}.py:1", summary=f"item {i}")
        for i in range(100)
    ]
    await surface_bottlenecks(umbra, many, n=3, max_observations=5)  # type: ignore[arg-type]
    query = umbra.received_queries[0]
    # The first 5 should appear; the 99th should not.
    assert "f0.py:1" in query
    assert "f4.py:1" in query
    assert "f99.py:1" not in query
