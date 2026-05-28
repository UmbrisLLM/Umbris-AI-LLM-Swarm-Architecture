# Convocation Decision · Repair the Lens Before Trusting Its Report

**Subject:** Triage of introspection findings flagging `umbris-core/tests/test_introspection.py`
**Verdict register:** Drawing the threads
**Status:** Adopted · single-PR action

## The single action

Open `umbris-core/tests/test_introspection.py` and read lines **83, 93, 101, 102, and 284** as one connected unit before touching anything else in the backlog. The only existing test file is the floor, and the floor is flagged. That is where the work begins.

## Why the convocation collapsed on this

- **Mercurius** held that the floor-flag is structurally first: you cannot trust the report while the producer of the report is itself flagged.
- **Venus** named the reflexive suspicion at line 93 (`should outrank TODO in severity`) · the same subsystem produced the triage it now sits inside.
- **Mars** identified the diagnostic signature: trailing `\n"` on flagged payloads is the fingerprint of string-literal fixtures, which means several of those FIXMEs are almost certainly test inputs the scanner re-ingested as findings, not live defects in a ranker.

Three readings, one collapse, one cheap action.

## PR scope

Title: `fix(introspection): repair test harness and exclude self-fixtures`

1. Open `test_introspection.py` and classify each of the five flagged lines as either
   - (a) **live defect** in the test logic, or
   - (b) **fixture string** inside a test case.
2. For any line in category (b), add a **self-exclusion rule** to the introspection scanner so it stops eating its own tail. The producer almost certainly lives in `umbris-core/src/umbris/provenance.py` or under `umbris-core/src/umbris/daemon/`. The exclusion is a path or AST-context filter, **not** a ranker rewrite.
3. For any line in category (a) · in particular the **sev=4 XXX at line 102** · rewrite the assertion with correct logic.
4. If, and only if, step 1 reveals that line 93 corresponds to a real production-side severity bug (locate the comparator first; do not assume it lives in the test), fix it producer-side and lock the behaviour with the test at line 93.
5. Re-run introspection and diff against the current report.

## Leverage

This single session is expected to:

- resolve the sev=4 finding,
- resolve three of the four sev=3 TODOs,
- shrink the 31 `test_gap` items (some fraction are likely false positives the scanner should ignore),
- yield a trustworthy template for the test files that genuinely are missing · `daemon/safety.py`, `daemon/apply.py`, `daemon/git_ops.py` being the safety-critical ones to author next.

The stale link and the missing docstrings are real but cosmetic. Batch them later. Everything downstream is downstream of trusting the lens.

## Falsifiable predictions (logged for Saturnus)

- **P1.** At least one of lines 83 / 93 / 101 / 102 / 284 in `test_introspection.py` is a string literal inside a test fixture, not executable code.
- **P2.** The severity comparator is **not** implemented inside `test_introspection.py`. It lives in `src/umbris/`, most likely `provenance.py` or under `daemon/`.
- **P3.** After the fix-and-exclude pass, re-running introspection produces a **strictly smaller** findings list, not an identical one.

## Collapse conditions

- If **P1** is false across all five lines, Mars's category-error critique collapses and Mercurius's plain *fix line 102 first* ordering is correct.
- If **P2** is false and the comparator truly lives in the test file, Venus's reflexive reframe stands.
- If **P3** is false, the scanner has no self-reference problem and the work was only a local test repair · which still pays for itself, but the leverage thesis is downgraded.

## Order of operations

Classify → exclude → repair → (conditionally) fix producer → re-run → diff. Do not invert these steps. Do not write new test files for `daemon/safety.py`, `daemon/apply.py`, or `daemon/git_ops.py` in this PR; that is the next session, conducted with a lens that has been calibrated against itself.
