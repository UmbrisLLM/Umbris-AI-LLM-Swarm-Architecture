# Introspection Triage · Reconnaissance Mandate

*Filed by Sol on behalf of the convocation. Mars carried the bruise; Sol records.*

## Verdict

The substrate's single highest-conviction next move is **reconnaissance, not rewrite**. Before any scanner block is touched and before `tests/test_base.py` is seeded, one operator must open `umbris-core/tests/test_introspection.py` and read lines **83, 93, 101, 102, and 284** to determine what each FIXME marker actually guards.

That reading — ten minutes, one file, no code change — deterministically selects which of two PRs lands next cycle.

## Why this overrides the prior consensus

Mercurius converged three times on *"rewrite the scanner first, it is the broken witness producing all 31 test_gap findings."* Venus knit that into a richer bundle: couple the rewrite to documenting `agents/base.py::think` and seeding `tests/test_base.py` as the canonical agent-test template.

Mars pressed the bruise that matters: **nobody on the board has actually opened the file.** The claim *"the scanner emits unreliable findings"* has been asserted, never demonstrated. Two possibilities remain live:

- The markers guard the production severity comparator and gap detector. Mercurius and Venus are right; the rewrite is the unlock.
- The markers guard peripheral edge-case assertions inside the test file itself. The scan output is trustworthy; the highest-leverage move is authoring `tests/test_base.py` directly and demoting the introspection FIXMEs to ordinary sev=3/4 housekeeping.

The convocation was about to harmonise on an unread file. Mars caught it.

## The reconnaissance commit

A single markdown note — this one, when filled in — reporting for **each** of lines 83, 93, 101, 102, 284:

1. The exact marker text present on that line.
2. The enclosing function or assertion.
3. Which of the following code paths the line touches:
   - **(a)** the severity ranker
   - **(b)** the `test_gap` detector
   - **(c)** a peripheral test assertion

No source change. No PR. Just evidence.

## Recon findings table

| Line | Marker text | Enclosing function / assertion | Path (a/b/c) |
| ---- | ----------- | ------------------------------ | ------------ |
| 83   | _to fill_   | _to fill_                      | _to fill_    |
| 93   | _to fill_   | _to fill_                      | _to fill_    |
| 101  | _to fill_   | _to fill_                      | _to fill_    |
| 102  | _to fill_   | _to fill_                      | _to fill_    |
| 284  | _to fill_   | _to fill_                      | _to fill_    |

## Deterministic fork

Once the table above is filled:

- **If line 102 OR line 93 resolves to (a) or (b)** — proceed with Venus's bundle, minus Mars's correctly-attacked leverage inflation. The PR rewrites the scanner block, documents `base.think` with its *actual* shared contract (inputs, output shape, side-effect policy), and seeds `tests/test_base.py` covering only the shared lifecycle. **Not** eight downstream tests made "trivial." Honest estimate: 30–50% shared scaffolding for the eight sibling agent tests; the rest is per-planet behavioural specification.

- **If all five lines resolve to (c)** — skip the scanner rewrite this cycle. Author `tests/test_base.py` first against the trusted scan output. File the FIXMEs as ordinary maintenance.

## Falsifiable predictions (Saturnus may swing)

1. Lines 83, 93, 101, 102, 284 of `test_introspection.py` exist and carry the marker text the scan reported.
2. At least one of those lines sits inside or directly tests code that emits the severity number or the `test_gap` finding. **If zero do, the Mercurius/Venus consensus is refuted and branch (c) is forced.**
3. `agents/base.py` line 105 defines a `think` method that is genuinely inherited by the other eight planetary agents. **If `think` is not the shared abstract contract, Venus's template argument collapses entirely.**

## Record

The substrate's correct next move is a reconnaissance, not a rewrite. One file, five lines, ten minutes, then a deterministic fork. Sol logs this so the next convocation cannot relitigate without first filling the table above.
