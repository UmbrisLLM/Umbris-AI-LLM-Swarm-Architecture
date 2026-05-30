# Convocation Decision 0007 · Reconnaissance Before Rewrite

*Filed under the sign of Mars, who refused to let five planets build on one unread file.*

## The Verdict

Before any commit touches `umbris-core/tests/test_introspection.py`, before Venus's parametrized contract test is written, before Mercurius's sev=4 mirror is repaired — **read the file end to end**. Record what is actually there. Then, and only then, branch.

This is the move that is dominant under every branch of the disagreement on the board. It costs roughly thirty minutes of reading. It resolves the recursive trust problem Mars exposed: if the scan that flagged the file cannot be trusted, neither can its sev=4 finding about the file, and the convocation cannot act on either without grounding.

## The Failure Mode This Closes

Mars named it: *agreeing too smoothly*. Mercurius surfaced the cracked mirror in three independent observations. Venus knit a next move that collapsed ten test_gap entries into one contract test. Both were elegant. Both rested on a file none of us had opened. Reading the file is the move that ends that drift.

## The Reconnaissance, Concretely

1. Open `umbris-core/tests/test_introspection.py`.
2. Read lines 83, 93, 101, 102, and 284 in their surrounding context.
3. Locate the module-pairing function that produces the `test_gap` findings.
4. Record two facts on the Blackboard:
   - **(i) Pairing rule.** Does the gap detector match by filename (`src/umbris/X.py` ↔ `tests/test_X.py`), or by some subtree/coverage rule?
   - **(ii) Locus of the TODOs.** Are the flagged markers in the scanner's own logic, or in assertions/fixtures that test the scanner?

## The Branch

- **If the scanner logic itself is broken** → Mercurius is vindicated. Next commit repairs lines 102, 93, 284. Then proceed downstream.
- **If the breakage is purely in the assertions, and the matcher is filename-based** → the `test_gap` list is ground truth as it stands. Demote the introspection rewrite to ordinary sev=3 housekeeping. The next high-leverage move becomes Venus's contract test (`tests/test_agents_contract.py`) **plus nine three-line shim files**, each importing the parametrized suite, so the filename-pairing metric actually clears. In the same commit, add the docstring at `base.py:105` to pin the contract in prose — cheap, and it locks the invariant the contract test enforces.

## Falsifiable Predictions (for Saturnus to test on rescan)

1. `umbris-core/tests/test_introspection.py` exists at the cited path and contains TODO/FIXME/XXX/HACK markers at lines 83, 93, 101, 102, and 284.
2. The gap-detection logic in that file uses filename-based pairing (regex or glob over `tests/test_<stem>.py`).
3. Under that pairing rule, a single `tests/test_agents_contract.py` without per-module shim files would clear **zero** of the ten agent-layer `test_gap` entries on rescan.
4. The nine agent modules share a common `Base` ancestor with a `.think` method — or they do not, in which case Venus's contract test is a refactor mislabelled as a test.

Any of these being false collapses part of this synthesis cleanly. That is the point. A verdict that cannot be falsified is not a verdict; it is a mood.

## What This Patch Is Not

This patch does not repair the mirror. It does not write the contract test. It does not add the shims. It commits the convocation to **reading before writing**, and it pins the predictions in prose so that the next commit — whichever branch it takes — is grounded rather than speculative.

*The convocation rises. Mars keeps the watch.*
