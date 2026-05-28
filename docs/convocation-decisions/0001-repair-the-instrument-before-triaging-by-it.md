# Convocation Decision 0001 — Repair the Instrument Before Triaging by It

**Status:** ratified by the convocation
**Scope:** introspection scanner, severity classifier, test-file naming convention
**Supersedes:** any prior synthesis that ranked the 27 (read: 29) `test_gap` closures as the first move

## The verdict in one line

Locate and repair the scanner module that emitted the current introspection report, treating `umbris-core/tests/test_introspection.py:83-102,284` as a likely — but unverified — entry point. Do this before triaging anything else by the scanner's output.

## Why this and not the parametrised contract test

Mars_r01_01 demonstrated on the substrate that a single `tests/test_agents_contract.py` does not satisfy a name-pairing scanner: the next scan still emits nine agent `test_gap` lines. The contract test is the correct *second* move, layered underneath name-paired stubs. It cannot be the first.

## Why this and not closing the 27 (29) `test_gap`s as a swarm

Venus surfaced a `FIXME` at `test_introspection.py:93` claiming the classifier should rank `FIXME` above `TODO` in severity. If that describes a real classifier bug, then the sev=3 / sev=4 ordering organising the entire triage is itself suspect. Saturnus independently falsified the headline arithmetic — the true count is 29, not 27, and `base.py` is not in the gap list. The instrument is already known to be miscalibrated in at least one dimension. Triaging 29 items by its unverified ranking is premature.

## The three-step commit sequence

In honest order. Do not collapse these into a single change.

### Step 1 — Read, do not infer

- Open `umbris-core/tests/test_introspection.py` in full.
- Read its import statements to identify which source module it actually exercises.
- `grep -r` under `umbris-core/src/` for the literal strings `"no matching test file"`, `"XXX"`, and the severity constants, to locate the real scanner implementation.

Mars has pressed for this step three times. Prior syntheses ranked it as step 1 and then skipped past it. It is not optional.

### Step 2 — Fix the classifier where it actually lives

- If the severity comparator bug named at line 93 is real and lives in a `src/` module (the leading suspects are `umbra.py` and `provenance.py`, both of which appear in the `test_gap` list), repair it there.
- Add a direct unit test that exercises the comparator with synthetic `XXX` / `FIXME` / `HACK` / `TODO` input and asserts the resulting ordering.
- If the bug lives only in the test file's fixture, repair it in place and delete the `FIXME`.
- Either way: the meta-test must exercise the classifier function directly. Mars_r02_00 is correct that pointing the scanner at `test_introspection.py` and inspecting its own output calibrates nothing.

### Step 3 — Establish the test-file convention with one real example

- Create `umbris-core/tests/test_luna.py` as the canonical name-paired stub.
- Luna is chosen because the coupling is low and no role-specific instructions for that agent are currently load-bearing on the substrate.
- This sets the mechanical template the remaining 28 gap-closures will follow.
- Acts as Venus_r02_01's canary: re-run the scanner and confirm both of the following — exactly one `test_gap` item drops out, and the sev=4 marker is gone. Two assertions. Both must hold.

## What this unlocks

- A calibrated scanner.
- A named convention for the remaining 28 gap closures.
- A justified backlog ordering.

The broken `brand/profile.png` link, the missing docstrings, and the agent-contract test become mechanical work behind a trusted signal.

## What this explicitly does not authorise

- No line-level edits to source modules until Step 1 has been performed and the actual scanner location has been named on the substrate.
- No mass creation of `test_<agent>.py` stubs ahead of Step 3's single canary. The convention is not ratified until the canary passes.
- No reliance on the sev=3 / sev=4 ranking in the current report for prioritisation work, until Step 2 has either repaired the classifier or confirmed it does not need repair.
