# Convocation Verdict · Repair the Self-Observer First

> *"A convocation that cannot trust its own introspection cannot trust any scan it runs, including this one."*

## The Single Move

Read and repair `umbris-core/tests/test_introspection.py` before touching anything else on the Blackboard. Specifically lines **80-110 and 280-290** as one contiguous block.

This file carries:

- the only **sev=4** in the scan (`XXX` at line 102)
- three **sev=3 FIXMEs** (lines 83, 93, 284)
- a **sev=3 HACK** at line 101

It is the module that validates the convocation's capacity to observe itself, and it is the module that produced the very issue list under deliberation. Until it is repaired, every other prioritisation rests on output from a harness whose own tests are flagged as broken.

## Threads Drawn

### Mercurius surfaced
The dense cluster of wounds in one file is the real signal. The thirty `test_gap` items are likely noise from that same harness.

### Venus knit
Two distinct sharper claims:

1. Line 102 is the `test_gap` detector itself — so the thirty gaps are false positives from filename-glob heuristics.
2. Lines 93 and 102 together are the severity classifier — explaining the flat sev=3 plateau.

### Mars broke
Both Venus readings are conjecture about code no planet has read. They contradict each other. Venus_01 internally contradicts itself by proposing `FIXME > XXX` ordering while anchoring on the `XXX`.

Mars is correct: we cannot defer the thirty `test_gap` items on the strength of unverified line-to-function attribution, because several of those modules sit on the **trust boundary**:

- `daemon/safety.py`
- `daemon/apply.py`
- `daemon/git_ops.py`
- `llm/client.py`
- `provenance.py`
- `agents/base.py`

## Concrete First Change, In Order

1. **Open `test_introspection.py`.** Read lines 80-110 and 280-290. Write down, in one sentence each, what the code at line 102, line 101, line 93, line 83, and line 284 actually does. This costs minutes and resolves the Mercurius/Venus/Mars dispute on factual grounds.

2. **If line 102 governs the `test_gap` detector or the severity ranker** (Venus's two hypotheses), execute the sev=4 rewrite:
   - Replace filename-glob matching with `pytest --collect-only` plus AST import resolution to map collected tests back to source modules.
   - Fix the severity ordering at line 93 so `FIXME` outranks `TODO`.
   - Re-run the scan. The `test_gap` list will stratify or collapse.

3. **If line 102 governs something else entirely** (a fixture, a helper, an unrelated assertion), repair it on its own terms, then proceed in parallel to triage the six trust-boundary `test_gap`s without waiting for scanner repair — their need for tests is independent of whether the scanner is honest.

## Why This Is The Leverage Move

**Self-referential integrity.** Fixing the introspection harness either:

- collapses the thirty sev=3 items into a much smaller honest list (Venus's prediction), or
- confirms they are real, in which case we now have a trustworthy ranker telling us which to address first.

Either outcome is strictly better than acting on the current flat list. The broken brand link and the docstring gaps are genuinely lower priority and can wait.

## Falsifiable Commitments for Saturnus

**(a)** `test_introspection.py:102` is semantically related to either `test_gap` detection or severity ranking. *If it is unrelated to both, Venus's framing is wrong and only the Mars fallback (parallel trust-boundary triage) survives.*

**(b)** After the rewrite, either the `test_gap` count drops below 10, or the remaining items stratify above and below sev=3. *If neither happens, the harness was honest and the codebase genuinely is under-tested at the claimed scale.*

**(c)** `FIXME` at line 93 and `XXX` at line 102 are coupled — share variables, share a function, or sit in the same class. *If they are in unrelated scopes, Venus_01's coupling claim falls.*

---

*Filed by the Patcher at the convocation's instruction. The verdict stands until falsified by reading the actual lines.*
