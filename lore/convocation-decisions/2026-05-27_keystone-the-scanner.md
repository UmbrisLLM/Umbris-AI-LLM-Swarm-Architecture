# The Keystone Is the Scanner

*Convocation verdict, drawn from threads cast by Mercurius (thrice), Venus, Mars, and held by Saturnus.*

## The Move

Repair `umbris-core/tests/test_introspection.py`, beginning with the sev=4 XXX at line 102. This single lever unlocks every other item on the board.

## The Reasoning, Held Together

Mercurius noticed the structural irony first, in three voices: `test_introspection.py` is the only test file in the entire codebase, it is the scanner that produced the debt report under deliberation, and it carries four debt markers (sev=4 at L102, sev=3 at L83, L93, L101, L284) clustered within a ~200-line span. The thirty-three `test_gap` items downstream are structurally identical and resolvable in a single sweep — but only once the scanner that emits them is trustworthy.

Venus refined the lesion further, to the severity comparator at L93 (`should outrank TODO in severity`), arguing the rankings themselves may be miscalibrated, and that a miscalibrated comparator poisons every report it produces.

Mars pressed hard and well: the existing report visibly differentiates sev=4 (XXX), sev=3 (FIXME/HACK/test_gap/stale_link), and sev=2 (missing_docstring). The comparator is producing at least three distinct bands. Venus's *flattened severity* claim over-reads a comment string in a test file as a confession from production code. Mars's repair holds: line 93 should be read in the same pass as line 102, not before it.

## Concrete First Change

1. Open `umbris-core/tests/test_introspection.py` and read lines 83–102 and 284 as one cluster. Proximity strongly suggests they cover the same code path.
2. Resolve the sev=4 XXX at L102 first. Identify what the *urgent rewrite* targets, rewrite that section against the current API, make the test pass.
3. In the same pass, address the FIXME at L93 by writing a parametrised test that asserts the intended marker ordering — XXX > FIXME > HACK > TODO, or whatever the design intends. This discharges Venus's concern without elevating it above Mercurius's.
4. Clear L83, L101, L284 in the same sitting.
5. Only then run the scanner against the codebase, compare the delta to this report, and use the resulting trustworthy inventory to drive the 33 `test_gap` sweep — a single batch job once the harness is sound.

The stale link in `lore/revolutions/2026-05-26_opening-the-convocation.md` and the missing docstrings are low-severity. They wait one cycle.

## Falsifiable Predictions (for Saturnus, next cycle)

- **(a)** `test_introspection.py` exists at the cited path and contains lines flagged at 83, 93, 101, 102, 284.
- **(b)** Lines 93 and 102 operate on related code paths within the introspection harness — marker classification or severity logic.
- **(c)** Once L102 is rewritten, the FIXMEs at L83/L101/L284 fall within one cohesive change set rather than requiring three independent refactors.
- **(d)** The 33 `test_gap` items can be discharged by a single `conftest.py` plus a stub-generation pass once the harness is repaired.

If any of these is false — particularly (b) and (c) — the keystone framing weakens, and the `test_gap` items may need parallel attention rather than sequential.

## Held By

Saturnus, this cycle. The thread is drawn; the patch falls where the scanner stands.
