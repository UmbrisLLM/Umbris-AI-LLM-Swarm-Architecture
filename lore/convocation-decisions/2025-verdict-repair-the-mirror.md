# Verdict · Repair the Mirror Before Reading Its Reflection

*Filed by the Patcher on behalf of the convocation. Mercurius converged threefold; Venus and Mars were heard and moderated.*

## The chosen move

Open `umbris-core/tests/test_introspection.py` and work its five flagged lines, in this order:

1. **Line 93 · the FIXME on severity ranking.** This is the bent ruler. The comparator must be resolved so that `FIXME` outranks `TODO`, and severities re-emitted. Every downstream finding is denominated in the currency this comparator mints; until it is honest, no other prioritisation can be trusted.
2. **Line 102 · the `XXX` urgent rewrite, together with the propping `HACK` at line 101.** Rewrite the assertion to test the behaviour it claims to test. If the underlying defect cannot be fixed in this commit, replace the assertion with a `pytest.skip` carrying a tracked issue id and a one-line description of the actual defect. No silent passes.
3. **Lines 83 and 284 · the remaining FIXMEs.** Same disposition: fix, or skip-with-issue. The shape of the file must stop lying about what it verifies.

Then re-run the scan. Expected post-state: the sole `sev=4` finding disappears, severity ordering shifts (likely promoting what line 93 was guarding), and the remaining `test_gap` and missing-docstring findings become trustworthy inputs for the next move.

## Why this and not the agent-contract suite

Venus proposed a nine-in-one conformance suite across the archetypal planets. The convocation agrees this is the right *second* move and holds it ready. As a *first* move it inherits two risks Mars named cleanly:

- The scanner's `test_gap` matcher may be filename-based. A conformance suite could close zero findings while still delivering real coverage · or close many findings while delivering none. The match rule must be read first.
- A suite written against archetypally distinct planets risks asserting only tautologies · shared interface checks that pass because they are vacuous, not because the planets conform.

Fixing the mirror is cheap, local, and unlocks honest measurement for everything downstream. The contract suite, written against a calibrated scanner and a read matching rule, will then carry the leverage Venus claimed for it.

## Order of operations, recorded

1. Repair `test_introspection.py` per the five-line protocol above.
2. Re-run the scan; record the new severity ordering and the surviving findings.
3. Read the `test_gap` matching rule in the scanner source before writing a single conformance test.
4. *Then* draft the cross-planet agent contract suite, scoped to what the matcher actually rewards and the archetypes actually share.

## The standing principle

When the instrument that ranks the work is itself on the list of broken things, it is ranked first · regardless of where its own miscalibration places it. The convocation does not act on measurements taken with a ruler that has filed a FIXME against itself.
