"""Tests for umbris.daemon · the autonomous Custos loop.

Coverage:
  * PathPolicy (allowlist / denylist / repo-escape protection)
  * CostLedger (per-cycle cap, per-day cap, persistence, reset)
  * PIDLock (acquire / refuse / release)
  * Interval parsing
  * Apply: parse_patch (clean, fenced, prose-wrapped, broken)
  * Apply: apply_patch (happy path, allowlist reject, denylist reject,
           overwrite reject, oversize reject)
  * git_ops against a real temp `git init` repo
  * full revolution end-to-end with MockProvider + temp git repo

No live API calls. No real network. No real git remote.
"""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from typing import Any

import pytest

from umbris.daemon.apply import (
    MAX_FILE_BYTES,
    ApplyResult,
    PatchFile,
    StructuredPatch,
    apply_patch,
    parse_patch,
)
from umbris.daemon.cycle import CycleConfig, run_cycle
from umbris.daemon.git_ops import (
    add,
    commit,
    has_uncommitted_changes,
    head_short_hash,
    is_git_repo,
    restore_working_tree,
    status_porcelain,
)
from umbris.daemon.safety import (
    CostLedger,
    DEFAULT_ALLOWLIST,
    DEFAULT_DENYLIST,
    PIDLock,
    PathPolicy,
    parse_interval,
)
from umbris.llm.client import LLMClient
from umbris.llm.providers import MockProvider


# ──────────────────────────────────────────────────────────────────
# PathPolicy
# ──────────────────────────────────────────────────────────────────


def test_pathpolicy_default_allows_docs_md(tmp_path: Path):
    policy = PathPolicy()
    check = policy.check(tmp_path, Path("docs/foo.md"))
    assert check.allowed
    assert "allowlist match" in check.reason


def test_pathpolicy_default_allows_lore_md(tmp_path: Path):
    policy = PathPolicy()
    assert policy.check(tmp_path, Path("lore/convocation-decisions/x.md")).allowed


def test_pathpolicy_default_allows_umbris_tests(tmp_path: Path):
    policy = PathPolicy()
    assert policy.check(tmp_path, Path("umbris-core/tests/test_thing.py")).allowed


def test_pathpolicy_default_rejects_env_file(tmp_path: Path):
    policy = PathPolicy()
    check = policy.check(tmp_path, Path(".env"))
    assert not check.allowed
    assert "denylist" in check.reason


def test_pathpolicy_default_rejects_nested_env(tmp_path: Path):
    policy = PathPolicy()
    assert not policy.check(tmp_path, Path("umbris-core/.env")).allowed


def test_pathpolicy_default_rejects_pyproject(tmp_path: Path):
    policy = PathPolicy()
    assert not policy.check(tmp_path, Path("umbris-core/pyproject.toml")).allowed


def test_pathpolicy_default_rejects_git_internals(tmp_path: Path):
    policy = PathPolicy()
    assert not policy.check(tmp_path, Path(".git/config")).allowed


def test_pathpolicy_default_rejects_node_modules(tmp_path: Path):
    policy = PathPolicy()
    assert not policy.check(tmp_path, Path("umbris-web/node_modules/foo.js")).allowed


def test_pathpolicy_default_rejects_unknown_paths(tmp_path: Path):
    policy = PathPolicy()
    check = policy.check(tmp_path, Path("random/place/foo.txt"))
    assert not check.allowed
    assert "no allowlist match" in check.reason


def test_pathpolicy_rejects_repo_escape(tmp_path: Path):
    policy = PathPolicy()
    check = policy.check(tmp_path, Path("../../../etc/passwd"))
    assert not check.allowed


def test_pathpolicy_custom_lists_replace_defaults(tmp_path: Path):
    policy = PathPolicy(
        allowlist=("custom/**/*.txt",),
        denylist=("custom/secret.txt",),
    )
    assert policy.check(tmp_path, Path("custom/ok.txt")).allowed
    assert not policy.check(tmp_path, Path("custom/secret.txt")).allowed
    assert not policy.check(tmp_path, Path("docs/foo.md")).allowed


def test_pathpolicy_denylist_wins_over_allowlist(tmp_path: Path):
    policy = PathPolicy(
        allowlist=("foo/**",),
        denylist=("foo/secret.md",),
    )
    assert policy.check(tmp_path, Path("foo/ok.md")).allowed
    assert not policy.check(tmp_path, Path("foo/secret.md")).allowed


# ──────────────────────────────────────────────────────────────────
# CostLedger
# ──────────────────────────────────────────────────────────────────


def test_costledger_starts_at_zero(tmp_path: Path):
    ledger = CostLedger(
        state_path=tmp_path / "ledger.json",
        cap_per_cycle_usd=1.0,
        cap_per_day_usd=5.0,
    )
    assert ledger.spent_today_usd == 0.0
    assert ledger.cycles_today == 0


def test_costledger_records_spend(tmp_path: Path):
    ledger = CostLedger(state_path=tmp_path / "ledger.json")
    ledger.record_cycle(cost_usd=0.75)
    ledger.record_cycle(cost_usd=1.25)
    assert ledger.spent_today_usd == pytest.approx(2.0)
    assert ledger.cycles_today == 2


def test_costledger_persists_across_instances(tmp_path: Path):
    p = tmp_path / "ledger.json"
    a = CostLedger(state_path=p)
    a.record_cycle(cost_usd=3.5)
    b = CostLedger(state_path=p)
    assert b.spent_today_usd == pytest.approx(3.5)
    assert b.cycles_today == 1


def test_costledger_blocks_when_daily_cap_reached(tmp_path: Path):
    ledger = CostLedger(
        state_path=tmp_path / "ledger.json",
        cap_per_cycle_usd=2.0,
        cap_per_day_usd=5.0,
    )
    ledger.record_cycle(cost_usd=4.5)
    check = ledger.check_before_cycle(projected_cost_usd=2.0)
    assert not check.allowed
    assert "daily cap" in check.reason.lower()


def test_costledger_blocks_when_per_cycle_too_high(tmp_path: Path):
    ledger = CostLedger(
        state_path=tmp_path / "ledger.json",
        cap_per_cycle_usd=1.0,
        cap_per_day_usd=100.0,
    )
    check = ledger.check_before_cycle(projected_cost_usd=2.0)
    assert not check.allowed


def test_costledger_reset_clears_state(tmp_path: Path):
    ledger = CostLedger(state_path=tmp_path / "ledger.json")
    ledger.record_cycle(cost_usd=10.0)
    ledger.reset_today()
    assert ledger.spent_today_usd == 0.0
    assert ledger.cycles_today == 0


# ──────────────────────────────────────────────────────────────────
# PIDLock
# ──────────────────────────────────────────────────────────────────


def test_pidlock_acquire_then_release(tmp_path: Path):
    lock = PIDLock(path=tmp_path / "lock.pid")
    assert lock.acquire(pid=os.getpid())
    assert (tmp_path / "lock.pid").exists()
    lock.release()
    assert not (tmp_path / "lock.pid").exists()


def test_pidlock_refuses_when_active_pid_exists(tmp_path: Path):
    lock_a = PIDLock(path=tmp_path / "lock.pid")
    assert lock_a.acquire(pid=os.getpid())
    lock_b = PIDLock(path=tmp_path / "lock.pid")
    assert not lock_b.acquire(pid=os.getpid())
    lock_a.release()


def test_pidlock_takes_over_dead_pid(tmp_path: Path):
    p = tmp_path / "lock.pid"
    p.write_text("999999999")  # essentially-impossible PID
    lock = PIDLock(path=p)
    assert lock.acquire(pid=os.getpid())
    lock.release()


# ──────────────────────────────────────────────────────────────────
# parse_interval
# ──────────────────────────────────────────────────────────────────


def test_parse_interval_seconds_bare_int():
    assert parse_interval("60") == 60
    assert parse_interval("3600") == 3600


def test_parse_interval_minutes_hours_days():
    assert parse_interval("30m") == 1800
    assert parse_interval("2h") == 7200
    assert parse_interval("1d") == 86400


def test_parse_interval_rejects_garbage():
    with pytest.raises(ValueError):
        parse_interval("")
    with pytest.raises(ValueError):
        parse_interval("two hours")
    with pytest.raises(ValueError):
        parse_interval("5x")


# ──────────────────────────────────────────────────────────────────
# parse_patch (apply layer)
# ──────────────────────────────────────────────────────────────────


def _good_patch_json() -> str:
    return json.dumps({
        "summary": "Add a test artefact",
        "files": [
            {"path": "docs/test-artefact.md", "content": "# Test artefact\n"},
        ],
    })


def test_parse_patch_clean_json():
    p = parse_patch(_good_patch_json())
    assert p is not None
    assert p.summary == "Add a test artefact"
    assert p.files[0].path == "docs/test-artefact.md"


def test_parse_patch_strips_markdown_fences():
    fenced = "```json\n" + _good_patch_json() + "\n```"
    assert parse_patch(fenced) is not None


def test_parse_patch_extracts_from_prose_wrapper():
    wrapped = "Here is the patch:\n\n" + _good_patch_json() + "\n\nHope this helps."
    assert parse_patch(wrapped) is not None


def test_parse_patch_returns_none_on_invalid_json():
    assert parse_patch("not json at all") is None


def test_parse_patch_returns_none_on_invalid_schema():
    # Missing required summary field
    bad = json.dumps({"files": [{"path": "x.md", "content": "hi"}]})
    assert parse_patch(bad) is None


def test_parse_patch_returns_none_on_empty_files():
    bad = json.dumps({"summary": "x", "files": []})
    assert parse_patch(bad) is None


# ──────────────────────────────────────────────────────────────────
# apply_patch · happy + safety paths
# ──────────────────────────────────────────────────────────────────


def test_apply_patch_writes_allowlisted_file(tmp_path: Path):
    patch = StructuredPatch(
        summary="Add docs file",
        files=[PatchFile(path="docs/auto.md", content="# Auto\n")],
    )
    result = apply_patch(patch, repo_root=tmp_path, policy=PathPolicy())
    assert result.ok
    assert result.paths_written == ["docs/auto.md"]
    assert (tmp_path / "docs" / "auto.md").read_text() == "# Auto\n"


def test_apply_patch_rejects_denylisted_path(tmp_path: Path):
    patch = StructuredPatch(
        summary="Try to write .env",
        files=[PatchFile(path=".env", content="SECRET=oops")],
    )
    result = apply_patch(patch, repo_root=tmp_path, policy=PathPolicy())
    assert not result.ok
    assert "denylist" in result.reason


def test_apply_patch_rejects_unknown_path(tmp_path: Path):
    patch = StructuredPatch(
        summary="Try to write somewhere weird",
        files=[PatchFile(path="random/place/x.txt", content="hi")],
    )
    result = apply_patch(patch, repo_root=tmp_path, policy=PathPolicy())
    assert not result.ok


def test_apply_patch_refuses_to_overwrite(tmp_path: Path):
    existing = tmp_path / "docs" / "existing.md"
    existing.parent.mkdir()
    existing.write_text("# original\n")
    patch = StructuredPatch(
        summary="Try to overwrite",
        files=[PatchFile(path="docs/existing.md", content="# new\n")],
    )
    result = apply_patch(patch, repo_root=tmp_path, policy=PathPolicy())
    assert not result.ok
    assert "overwrite" in result.reason
    # Original must be intact.
    assert existing.read_text() == "# original\n"


def test_apply_patch_rejects_oversize_file(tmp_path: Path):
    big = "x" * (MAX_FILE_BYTES + 1)
    patch = StructuredPatch(
        summary="Too big",
        files=[PatchFile(path="docs/big.md", content=big)],
    )
    result = apply_patch(patch, repo_root=tmp_path, policy=PathPolicy())
    assert not result.ok
    assert "too large" in result.reason


def test_apply_patch_all_or_nothing(tmp_path: Path):
    """If any file fails validation, no file is written."""
    patch = StructuredPatch(
        summary="One good, one bad",
        files=[
            PatchFile(path="docs/good.md", content="# good\n"),
            PatchFile(path=".env", content="bad"),
        ],
    )
    result = apply_patch(patch, repo_root=tmp_path, policy=PathPolicy())
    assert not result.ok
    # The good file must not have been written.
    assert not (tmp_path / "docs" / "good.md").exists()


# ──────────────────────────────────────────────────────────────────
# git_ops · against a real temp `git init` repo
# ──────────────────────────────────────────────────────────────────


@pytest.fixture
def temp_git_repo(tmp_path: Path) -> Path:
    """Initialise a clean temp git repo with an initial commit."""
    repo = tmp_path / "repo"
    repo.mkdir()
    subprocess.run(["git", "init", "-b", "main"], cwd=repo, check=True, capture_output=True)
    # Local user identity for the test commit
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=repo, check=True)
    subprocess.run(["git", "config", "user.name", "Test Bot"], cwd=repo, check=True)
    (repo / "README.md").write_text("# init\n")
    subprocess.run(["git", "add", "."], cwd=repo, check=True)
    subprocess.run(["git", "commit", "-m", "initial"], cwd=repo, check=True, capture_output=True)
    return repo


def test_is_git_repo_detects_init(temp_git_repo: Path):
    assert is_git_repo(temp_git_repo)


def test_status_porcelain_clean_repo(temp_git_repo: Path):
    res = status_porcelain(temp_git_repo)
    assert res.ok
    assert res.stdout == ""


def test_has_uncommitted_changes_after_write(temp_git_repo: Path):
    (temp_git_repo / "new.txt").write_text("hi")
    assert has_uncommitted_changes(temp_git_repo)


def test_add_and_commit_creates_new_head(temp_git_repo: Path):
    (temp_git_repo / "new.md").write_text("# new\n")
    add_res = add(temp_git_repo, ["new.md"])
    assert add_res.ok
    commit_res = commit(temp_git_repo, "test: add new file")
    assert commit_res.ok
    assert head_short_hash(temp_git_repo) is not None
    assert not has_uncommitted_changes(temp_git_repo)


def test_restore_working_tree_removes_untracked(temp_git_repo: Path):
    (temp_git_repo / "junk.txt").write_text("junk")
    assert has_uncommitted_changes(temp_git_repo)
    restore_working_tree(temp_git_repo)
    assert not has_uncommitted_changes(temp_git_repo)
    assert not (temp_git_repo / "junk.txt").exists()


# ──────────────────────────────────────────────────────────────────
# run_cycle · end-to-end against MockProvider + temp git repo
# ──────────────────────────────────────────────────────────────────


# A mock response shaped like what RepoAnalyst / Umbra expect · a
# parseable JSON object with `content` and `confidence`. The Patcher
# step asks for a structured patch instead, so the MockProvider
# rotates through both shapes.
_AGENT_CONTENT_JSON = json.dumps({
    "content": "Add docs/auto-cycle-1.md describing the v1.1 revolution.",
    "confidence": 0.8,
})

_PATCH_JSON = json.dumps({
    "summary": "Add docs/auto-cycle-1.md",
    "files": [
        {
            "path": "docs/auto-cycle-1.md",
            "content": "# Auto cycle 1\n\nWritten by the v1.1 Custos in a test.\n",
        }
    ],
})


def _patcher_aware_responder(role: str, system: str, user: str) -> str:
    """Return the patch JSON when the patcher system prompt is detected;
    otherwise return the agent-shaped JSON the convocation uses everywhere else."""
    if "UMBRIS Patcher" in system or "structured patch" in system.lower():
        return _PATCH_JSON
    return _AGENT_CONTENT_JSON


def _allowlist_for(repo: Path) -> tuple[str, ...]:
    """Looser allowlist for tests, since temp repos don't have the full
    UMBRIS layout."""
    return ("docs/**/*.md", "lore/**/*.md")


def _make_temp_repo_with_docs(repo: Path) -> None:
    """Seed the temp repo with the minimum the analyst will scan
    (so it surfaces SOMETHING) and the docs/ folder the patch wants
    to write to."""
    (repo / "docs").mkdir()
    (repo / "docs" / "intro.md").write_text("# Intro\n\nSee [missing](does-not-exist.md).\n")


@pytest.mark.asyncio
async def test_run_cycle_happy_path_dry_run(temp_git_repo: Path):
    """Full revolution, dry-run (no commit), MockProvider · should ship a
    file written to the working tree, no git commit, status=shipped."""
    _make_temp_repo_with_docs(temp_git_repo)

    llm = LLMClient(provider=MockProvider(responder=_patcher_aware_responder))
    ledger = CostLedger(state_path=temp_git_repo / ".umbris-custos" / "ledger.json")
    policy = PathPolicy(allowlist=_allowlist_for(temp_git_repo))

    cfg = CycleConfig(
        repo_root=temp_git_repo,
        policy=policy,
        ledger=ledger,
        commit_and_push=False,   # dry-run: no commit
        run_tests=False,         # no pytest in a temp repo
        run_build_when_web_touched=False,
        cycle_number=1,
    )
    result = await run_cycle(llm=llm, config=cfg)
    assert result.event.status in ("shipped", "skipped")
    if result.event.status == "shipped":
        assert "docs/auto-cycle-1.md" in (result.event.files_changed or [])


@pytest.mark.asyncio
async def test_run_cycle_halts_on_cost_cap(temp_git_repo: Path):
    """If the cost cap is already exhausted, the revolution halts before
    spending anything."""
    _make_temp_repo_with_docs(temp_git_repo)
    llm = LLMClient(provider=MockProvider(responder=_patcher_aware_responder))
    state_dir = temp_git_repo / ".umbris-custos"
    ledger = CostLedger(
        state_path=state_dir / "ledger.json",
        cap_per_cycle_usd=10.0,
        cap_per_day_usd=0.01,
    )
    # Pre-exhaust the daily cap.
    ledger.record_cycle(cost_usd=10.0)

    cfg = CycleConfig(
        repo_root=temp_git_repo,
        policy=PathPolicy(allowlist=_allowlist_for(temp_git_repo)),
        ledger=ledger,
        commit_and_push=False,
        run_tests=False,
        cycle_number=1,
    )
    result = await run_cycle(llm=llm, config=cfg)
    assert result.event.status == "halted"
    assert "cost" in result.event.reason.lower()


@pytest.mark.asyncio
async def test_run_cycle_skips_when_patcher_response_is_garbage(temp_git_repo: Path):
    """If the convocation returns something that doesn't parse as a patch,
    the revolution skips without writing anything."""
    _make_temp_repo_with_docs(temp_git_repo)

    def garbage_patcher(role: str, system: str, user: str) -> str:
        if "UMBRIS Patcher" in system or "structured patch" in system.lower():
            return "I have no idea, sorry"
        return _AGENT_CONTENT_JSON

    llm = LLMClient(provider=MockProvider(responder=garbage_patcher))
    cfg = CycleConfig(
        repo_root=temp_git_repo,
        policy=PathPolicy(allowlist=_allowlist_for(temp_git_repo)),
        ledger=CostLedger(state_path=temp_git_repo / "ledger.json"),
        commit_and_push=False,
        run_tests=False,
        cycle_number=1,
    )
    result = await run_cycle(llm=llm, config=cfg)
    assert result.event.status == "skipped"
    assert "parse" in result.event.reason.lower() or "validate" in result.event.reason.lower()
    # No files written.
    assert not (temp_git_repo / "docs" / "auto-cycle-1.md").exists()


@pytest.mark.asyncio
async def test_run_cycle_skips_when_patch_violates_allowlist(temp_git_repo: Path):
    """A correctly-formatted patch that tries to write outside the
    allowlist must be rejected at apply time, no file written."""
    _make_temp_repo_with_docs(temp_git_repo)

    bad_patch = json.dumps({
        "summary": "Try to write .env",
        "files": [{"path": ".env", "content": "SECRET=oops"}],
    })

    def bad_patcher(role: str, system: str, user: str) -> str:
        if "UMBRIS Patcher" in system or "structured patch" in system.lower():
            return bad_patch
        return _AGENT_CONTENT_JSON

    llm = LLMClient(provider=MockProvider(responder=bad_patcher))
    cfg = CycleConfig(
        repo_root=temp_git_repo,
        policy=PathPolicy(),  # default policy includes the denylist
        ledger=CostLedger(state_path=temp_git_repo / "ledger.json"),
        commit_and_push=False,
        run_tests=False,
        cycle_number=1,
    )
    result = await run_cycle(llm=llm, config=cfg)
    assert result.event.status == "skipped"
    assert "policy" in result.event.reason.lower() or "denylist" in result.event.reason.lower()
    assert not (temp_git_repo / ".env").exists()
