# Convocation Decision · The Keystone at agents/base.py

## Verdict

The convocation, weighing Mercurius's sensor-flag on `test_introspection.py`, Venus's harmonic pull toward `agents/base.py`, and Mars's twin objections (unverified scanner-target conflation; unconfirmed emitter of FIXME records), has chosen the move that survives both critiques:

> **Write the canonical test file for `umbris-core/src/umbris/agents/base.py` and, in the same change, give the public `think` method at `base.py:105` a precise docstring stating its contract.**

## Why This Move

`agents/base.py` is the only artefact appearing in three observation classes simultaneously:

1. `test_gap` on the module itself
2. `missing_docstring` on the public `think` method
3. Structural parent of nine planetary agents, each carrying their own `test_gap`

This triple-incidence is the **keystone signature**. A tested, docstringed `think` contract collapses ten `test_gap` records into one shaped pattern: the eight planet tests become parameterised variants of the base test, and the docstring documents the contract by executable example, naturally retiring the sev=2 docstring debt as coverage spreads.

The move is **robust under Mars's two attacks**:

- It does **not** depend on `test_introspection.py` being either broken or the scanner.
- It stands whether or not someone has yet identified the true emitter of the FIXME records.

It does not chase the scanner-repair phantom; it does not prematurely commit to eight planet tests before the shape is known.

## Concrete First Change

### Step 1 · Falsifiability check (Venus declared this; nobody executed it)

```
grep -nE 'class |def think' umbris-core/src/umbris/agents/base.py
```

- **If** a base class with a `think` method is present at or near line 105, **proceed**.
- **If** `base.py` is merely a thin re-export, **stop and reroute** to per-agent tests. The keystone hypothesis is dead and Mars wins this round.

### Step 2 · Docstring at base.py:105

Add a docstring to `think` that names:

- inputs (signature and types)
- return shape
- blackboard side-effects (writes, reads, ordering guarantees)
- what subclasses must honour (invariants, override points, forbidden mutations)

### Step 3 · Canonical test file

Create `umbris-core/tests/test_agents_base.py` using the existing `umbris-core/src/umbris/llm/providers/mock.py` as the LLM seam. Three tests, no more:

1. `think` returns the declared shape.
2. Subclass instantiation guards hold (abstract base cannot be instantiated bare; required attributes raise on omission).
3. Personality/voice fields surface in output.

### Step 4 · Land the reference pattern

Open nine follow-up issues, one per planetary agent (Mercurius, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Luna), each pointing at `test_agents_base.py` as the template to parameterise from.

## Housekeeping (Not Promoted to Strategic)

- Stale link sev=3 to `brand/profile.png` · pick up in the same PR.
- `test_introspection.py` FIXMEs · note but do not act until someone has actually grepped the substrate to identify the true emitter of those scan records. This is the **open question Mars left on the board**.

## Falsifiable Prediction

**If** `base.py` exposes a shared `think` contract as expected, the median time-to-write each of the nine planet tests drops below thirty minutes once the template lands.

**If** after writing `test_agents_base.py` the second planet test still requires fresh design work rather than parameterisation, the keystone hypothesis has failed and the agents share less surface than assumed. In that case the next convocation should reopen the per-agent route and treat `base.py` as decorative rather than structural.

## Dissent Recorded

Mars's second nerve-press is preserved here as an open thread: no planet has yet confirmed that `test_introspection.py` is the **emitter** of the FIXME records rather than a **test of** an introspection target. Until that grep is done, any move premised on the scanner being either broken or canonical is built on sand. The keystone move was chosen precisely because it sidesteps this question.
