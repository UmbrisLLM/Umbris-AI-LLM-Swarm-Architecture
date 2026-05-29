# Safety Gate Audit Template

This template is the scaffold for auditing `umbris-core/src/umbris/daemon/safety.py` before `umbris-core/tests/test_safety.py` is committed.

> **Rule of the audit:** if a guard is absent, the absence *is* the bug. Surface it as a finding here before writing a test that would paper over it.

## Step 1 · Enumerate Public Predicates

Open `umbris-core/src/umbris/daemon/safety.py` and list every public function answering the question *"is this patch allowed?"*. Record one row per predicate.

| Predicate | Inputs | Returns | Caller(s) | Notes |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Step 2 · Required Test Classes

`umbris-core/tests/test_safety.py` must contain three classes.

### Class A · Allow-Cases (must remain allowed)

- No-op diffs.
- Docstring additions inside the repo root.
- Additions to allowlisted directories under `docs/`, `lore/`, `umbris-core/tests/`.

### Class B · Deny-Cases (must remain denied)

- Writes outside the repo root.
- Edits to `.git/**`.
- Edits to `safety.py` itself (the self-edit guard).
- Edits to `test_safety.py` itself (the guard's guard).
- Edits to `.env`, `.env.*`, `secrets/**`, `wallets/**`, `*.key`, `*.pem`.

### Class C · Boundary-Cases

- Symlink traversal (a path that resolves outside the repo root after following links).
- Path normalisation tricks (`../`, `./`, repeated separators, unicode lookalikes).
- Binary blobs (non-text payloads in `content`).
- Oversized diffs (above whatever cap exists, or surface the absence of a cap).
- Empty `files` array.
- Duplicate `path` entries within a single patch.

## Step 3 · Findings Log

If any of the following guards are missing from `safety.py`, file the finding here **before** committing the test, so the test does not lock in the gap.

| Guard | Present? | Finding |
| --- | --- | --- |
| Self-edit guard (safety.py cannot patch itself) | ? |  |
| Guard's-guard (test_safety.py cannot be patched) | ? |  |
| Path-traversal guard (resolved path stays inside repo root) | ? |  |
| Symlink resolution before allow/deny check | ? |  |
| Denylist enforced for `.env*`, `secrets/**`, `wallets/**`, key/pem files | ? |  |
| `.git/**` denied | ? |  |
| Per-file size cap | ? |  |
| Per-patch file-count cap | ? |  |
| Duplicate-path rejection | ? |  |

## Step 4 · Commit

Once the table above is filled and any findings are filed:

```
test daemon.safety · gate the write path before the daemon drives
```

## Step 5 · Aftermath

After the test lands:

- Re-run the convocation against the introspector to confirm `safety.py` has moved from the untested-module list to the tested-module list.
- Promote Mercurius's `test_introspection.py` repair to the next decision.
- Schedule Venus's `base.think` contract as the parametrised follow-up across the eight planet modules.
