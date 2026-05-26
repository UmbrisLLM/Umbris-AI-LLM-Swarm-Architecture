"""
umbris.daemon.git_ops · safe subprocess wrappers around the git CLI.

Custos never invokes shell · every git call is built as an argv
list and passed to ``subprocess.run`` directly. The user's existing
git credentials (whatever they are · ssh key, credential helper, gh
auth, etc.) handle authentication.

Every function returns a small dataclass with the captured output so
callers can log it rather than re-running git to find out what just
happened.
"""

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class GitResult:
    ok: bool
    stdout: str
    stderr: str
    returncode: int


def _run(args: list[str], cwd: Path, *, timeout: int = 60) -> GitResult:
    try:
        proc = subprocess.run(
            args,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
    except subprocess.TimeoutExpired as e:
        return GitResult(False, "", f"timeout: {e}", -1)
    except FileNotFoundError:
        return GitResult(False, "", "git binary not found on PATH", -1)
    return GitResult(
        ok=(proc.returncode == 0),
        stdout=(proc.stdout or "").strip(),
        stderr=(proc.stderr or "").strip(),
        returncode=proc.returncode,
    )


# ── status + diff ─────────────────────────────────────────────────


def status_porcelain(repo: Path) -> GitResult:
    return _run(["git", "status", "--porcelain"], cwd=repo)


def has_uncommitted_changes(repo: Path) -> bool:
    return bool(status_porcelain(repo).stdout.strip())


def diff_stat(repo: Path) -> GitResult:
    return _run(["git", "diff", "--stat"], cwd=repo)


def changed_files(repo: Path) -> list[str]:
    """Files modified relative to HEAD (staged + unstaged + untracked)."""
    res = status_porcelain(repo)
    if not res.ok:
        return []
    out: list[str] = []
    for line in res.stdout.splitlines():
        if len(line) > 3:
            out.append(line[3:].strip())
    return out


# ── staging + committing ──────────────────────────────────────────


def add(repo: Path, paths: list[str]) -> GitResult:
    if not paths:
        return GitResult(True, "", "", 0)
    return _run(["git", "add", "--", *paths], cwd=repo)


def commit(repo: Path, message: str) -> GitResult:
    """Commit with the given multi-line message. Returns failed result
    if there's nothing to commit (which is the most common failure)."""
    return _run(["git", "commit", "-m", message], cwd=repo, timeout=60)


def head_short_hash(repo: Path) -> str | None:
    res = _run(["git", "rev-parse", "--short", "HEAD"], cwd=repo)
    return res.stdout if res.ok else None


# ── push (with one pull --rebase retry) ───────────────────────────


def push(repo: Path, *, remote: str = "origin", branch: str = "main") -> GitResult:
    res = _run(["git", "push", remote, branch], cwd=repo, timeout=180)
    if res.ok:
        return res
    # Attempt a single rebase + retry. Never force-push.
    rebase = _run(["git", "pull", "--rebase", remote, branch], cwd=repo, timeout=180)
    if not rebase.ok:
        return GitResult(False, rebase.stdout,
                         f"push failed, rebase also failed: {res.stderr} | {rebase.stderr}",
                         res.returncode or rebase.returncode)
    return _run(["git", "push", remote, branch], cwd=repo, timeout=180)


# ── rollback ──────────────────────────────────────────────────────


def restore_working_tree(repo: Path) -> GitResult:
    """Discard *unstaged* changes and remove untracked files. Used
    when a revolution fails its test gate and we need to roll back any
    files Custos just wrote."""
    # 1. Revert tracked-file modifications
    r1 = _run(["git", "checkout", "--", "."], cwd=repo)
    # 2. Remove untracked files + directories (the new files Custos
    #    may have just created)
    r2 = _run(["git", "clean", "-fd"], cwd=repo)
    ok = r1.ok and r2.ok
    return GitResult(
        ok=ok,
        stdout=(r1.stdout + "\n" + r2.stdout).strip(),
        stderr=(r1.stderr + "\n" + r2.stderr).strip(),
        returncode=r1.returncode or r2.returncode,
    )


# ── repo sanity ───────────────────────────────────────────────────


def is_git_repo(path: Path) -> bool:
    return (path / ".git").exists() or _run(
        ["git", "rev-parse", "--is-inside-work-tree"], cwd=path
    ).ok


def current_branch(repo: Path) -> str | None:
    res = _run(["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=repo)
    return res.stdout if res.ok else None
