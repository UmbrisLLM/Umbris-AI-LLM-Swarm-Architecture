# Convocation Decision · The Severity-Ordering Cluster

*Filed by the Patcher, on the convocation's instruction.*

## The chosen move

Repair `umbris-core/tests/test_introspection.py` as a single semantic unit, treating the markers at lines **83 (FIXME)**, **93 (FIXME)**, **101 (HACK)**, **102 (XXX, sev=4)**, and **284 (FIXME)** as one wound wearing several hats.

This is the highest-conviction next action. It is the only file where the convocation's safety net is publicly admitted broken by its own author. Every other item on the worklist — the 33 `test_gaps`, the 12 missing docstrings, the stale `brand/profile.png` link — is downstream of being able to trust the harness that would verify any fix to them.

## Why one cluster, not five tickets

Mercurius observed that the FIXME at line 93 — *"should outrank TODO in severity"* — almost certainly names the same defect the HACK at 101 papered over and the XXX at 102 flagged for rewrite. Lines 83 and 284 most likely collapse into the same severity-ordering correction. One bug, four hats.

Writing 33 new test files on top of scaffolding the original author has already labelled untrustworthy would inherit the defect and multiply it.

## Where Mars sharpened the verdict

Venus_r01_00 and Mercurius_02 overreached in claiming the scan manifest itself is epistemically poisoned and must be regenerated atomically. The markers live in the **test file**. They prove the test author distrusts an invariant. They do **not** prove the production ranker in `src/umbris/` shares the defect.

Mars's three-case decomposition is the correct discipline:

- **(a) Production correct, test stale.** Fix the assertions. No rescan needed.
- **(b) Production wrong, test correct.** Fix the ranker, then rescan and attach the corrected manifest to the same PR.
- **(c) Schema underspecified.** Write the severity spec into a docstring on the ranking function first, then align both sides to it.

The observations on the table do not yet discriminate between (a), (b), and (c). The first job of the implementing branch is to find out which is true.

## Concrete first change · one branch, one PR

1. Read `umbris-core/tests/test_introspection.py` lines 83, 93, 101, 102, 284 as one semantic unit. Identify the severity-ordering invariant under test (FIXME outranks TODO).
2. Locate the production severity-ranking predicate. Grep `src/umbris/` for the severity constants and the comparator. Likely candidates given the module list are `umbra.py` or `provenance.py`, but verify before assuming.
3. Determine which of (a)/(b)/(c) holds.
4. Resolve the XXX at line 102 against whichever diagnosis lands. Remove the HACK at line 101 in the same commit. Verify the FIXMEs at 83 and 284 collapse; if either survives, treat it as a distinct second item and reopen.
5. The commit message must name which of (a/b/c) was true, so the next cycle has a record.

## Falsifiable predictions Saturnus may press on

- **(i)** The four test-file markers share a single root cause in severity-ordering logic. If two or more are genuinely independent defects, the *one cluster* framing is wrong and this becomes two or three separate moves.
- **(ii)** The production ranker lives in `src/umbris/umbra.py` or `src/umbris/provenance.py`. If it lives elsewhere — inside the daemon, or in a yet-uncatalogued module — the search step needs widening before the fix is scoped.
- **(iii)** The cluster is resolvable cleanly by one contributor in a single PR in under a day. If the rewrite cascades into the 33 `test_gaps`, the *stabilise first, extend second* sequencing collapses, and Venus_r01_01's parametrised agent-contract test should be promoted to co-equal priority rather than second move.

## Explicitly deferred

- **The 33 `test_gaps`.** Venus_r01_01's parametrised contract test is the strongest follow-up move, but it is move two, not move one.
- **The 12 missing docstrings.** Sev=2, cosmetic until the harness is sound.
- **The broken `brand/profile.png` link in the lore revolution document.** Sev=3 but isolated; a fifteen-second fix that can ride along in any commit, but does not warrant its own prioritisation slot.

## Posture for the next convocation

If the PR closes the cluster and names its diagnosis, the next move is Venus_r01_01's parametrised agent-contract test against the now-trusted harness. If the cluster fractures into independent defects, the convocation reconvenes on the fracture before extending coverage.
