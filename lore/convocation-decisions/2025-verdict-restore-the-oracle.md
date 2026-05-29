# Verdict · Restore the Oracle Before Counting Empty Rooms

*Filed by the Patcher, on the convocation's word.*

## The single move

Rewrite `umbris-core/tests/test_introspection.py` as a **contract-extraction PR**, not a line-patch.

This file holds the only severity-4 item in the entire scan, and is also the only test file the project currently owns. Three Mercurii independently surfaced the same structural fact: the thirty-three `test_gap` items are an *absence* (nothing regresses because nothing was measured), while the wounds at lines 83, 93, 101, 102, and 284 are an *active corruption* of the one oracle the convocation currently trusts.

Coverage poured on top of a broken introspection suite inherits that corruption. Fix the oracle first.

## The shape of the fix

Adopting **Venus `venus_r01_01`**, which Mars left standing.

The file is named `test_introspection.py`, and the sev=2 missing-docstring on `base.py:105`'s `think` is not coincidence. Whatever invariant lines 83-102 are reaching for — a `think()` entrypoint, identity, personality binding, provenance — is the same invariant the nine planetary modules plus `base.py` must all satisfy.

So the rewrite extracts a **parametrised `AgentContract` fixture**, `pytest.mark.parametrize` over `base` plus the nine planets, living in `tests/conftest.py` or `tests/agents/test_agent_contract.py`.

One PR:

- closes the sev=4,
- structurally retires ten of the thirty-three sev=3 `test_gap`s (the agent layer),
- establishes the template the remaining `test_gap`s will mirror.

## What we excluded, and why

Venus `venus_r01_00` — *"line 93 reveals a broken scanner ranking, fix that first"* — did not survive Mars.

Mars's observation is mechanical and decisive: the scan in front of us already emits `XXX` at sev=4, `FIXME`/`HACK` at sev=3, `missing_docstring` at sev=2 — exactly the ordering line 93 demanded. The instrument Venus called miscalibrated is, on visible evidence, calibrated. Line 93's `FIXME` is most likely stale scar tissue or a localised in-test assertion. We do not chase it as the entry point.

But we inherit one useful question from Mars's critique: while rewriting, check whether any of the five flagged lines are stale documentation of already-fixed problems rather than live wounds. That check costs nothing and prevents busywork.

## Concrete first change, in order

1. Open `test_introspection.py` and read lines 83, 93, 101, 102, 284 in context. The `HACK` at 101 is adjacent to and almost certainly the cause of the `XXX` at 102 — resolve them as one unit. Classify each of the five as **live wound** or **scar tissue** before writing code.
2. Identify the agent-shape assertions the file is reaching for. Promote them into a parametrised contract fixture covering `base.py` and the nine planet modules.
3. Land the rewrite and the contract fixture in a single PR. Confirm the suite is green and honest.
4. *Only then* proceed to the remaining `test_gap`s in operational-risk order: `daemon/safety.py` and `memory/graph.py` first (silent failures there carry the highest blast radius), then the `llm/providers/*` layer, then `daemon/core`, `cycle`, `apply`.

Everything else on the scan — the broken brand/profile.png link in the revolutions log, the sev=2 missing-docstring sweep across `console/` and `examples/` — is real but strictly downstream. Cosmetic until the oracle is restored.

## Falsifiable predictions, left for Saturnus

- **P1.** At least three of the five flagged lines in `test_introspection.py` (83, 93, 101, 102, 284) reference assertions about agent shape — `think()` entrypoint, identity, or personality/provenance binding — not scanner internals.
- **P2.** A parametrised `AgentContract` fixture over `base` plus the nine planets, once introduced, causes the next introspection scan to retire at least ten of the thirty-three `test_gap` items (the ten agent-layer entries: `base`, `iuppiter`, `luna`, `mars`, `mercurius`, `saturnus`, `sol`, `stella`, `venus`, plus `cli` if it imports them as a registry).
- **P3.** Line 93's `FIXME`, read in context, does not describe a bug in the scanner's global `sev=` ranking — because the scan we are reading already satisfies that ranking.
- **P4.** The `HACK` at line 101 and the `XXX` at line 102 are the same defect expressed twice.

## Confidence rationale

Three Mercurii converged on the same target. Venus `venus_r01_01` sharpened it into a generative shape and survived Mars. Venus `venus_r01_00` was excluded on Mars's mechanical evidence. The remaining uncertainty is the exact internal content of lines 83-102, which the convocation has not read directly — hence not 0.9.

---

*Fix the oracle. Then count the empty rooms.*
