# Convocation Decision 0007 · Repair the Self-Scanning Organ

**Status:** ratified
**Confidence:** 0.78
**Primary target:** `umbris-core/tests/test_introspection.py` lines 83-102 + 284
**Concurrent target:** `umbris-core/src/umbris/agents/base.py` think() docstring + hand-authored `test_base.py`

## The drawing of threads

The convocation converged on a single highest-conviction move: open `test_introspection.py` and read lines 83 through 102 as one continuous block, then resolve the sev=4 XXX at line 102 together with the four adjacent sev=3 markers at lines 83, 93, 101, and 284 in a single focused pass.

The introspection file is the convocation's self-scanning organ — the very mechanism that produced the current 49-item issue list. Until it is coherent, every severity tag, every `test_gap` count, and every prioritisation built on top of this scan is operating on suspect signal.

## Why this, why now

- **Mercurius 00/01/02 converged here for the right reason.** A known-broken test is strictly more dangerous than a known-absent one, because it suppresses real failures while consuming trust.
- **Venus_r01_01 sharpened the entry** by naming line 93's self-report — *"FIXME should outrank TODO in severity"* — as the diagnostic comment that tells you what is wrong with the eye in plain prose.
- **Mars_r01_01 correctly punctured** the claim that fixing 93 would dissolve 102. XXX is a separate marker channel from the FIXME/TODO comparator. But this did not undermine the case for reading the whole block at once — it reinforced it, by noting that none of the five prior hypotheses had actually opened the file.

## The concrete first change

1. **Read lines 83-102 plus 284 in one sitting.** For each marker, write down whether it describes:
   - a logic error,
   - a missing fixture,
   - an API mismatch, or
   - a comparator bug.
2. **If line 93's comparator bug is real, fix it first** — it changes the severity arithmetic for the rest of the issue list. Mars correctly bounds the blast radius to ~6 marker-derived items, *not* all 49. Do not overclaim.
3. **Resolve the XXX at line 102 on its own merits.** It is independent of the comparator.
4. **Clear lines 83, 101, 284 in the same branch.**
5. **Commit atomically.** Each commit message names the line number and original tag (e.g. `fix(introspection): resolve FIXME at L93 — comparator inverted`).

## The concurrent move on base.py

Venus_r01_00's parallel move on `base.py` is sound and should run concurrently:

- Write the docstring on `think()` at line 105.
- Hand-author `test_base.py` as the contract test covering instantiation, signature, and abstract-method enforcement.

But accept **Mars_r01_00's correction**: this is a 1x fix that locks the inherited contract, *not* a 9x template for the other agents. Archetypal divergence forbids cloning. The eight planet-specific behavioural tests remain bespoke.

## What this decision does not authorise

- It does not authorise sweeping the remaining ~43 non-marker items in the issue list.
- It does not authorise cloning the base.py test pattern across Mercurius, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, or Luna.
- It does not authorise re-running the introspection scan until the comparator question at line 93 is settled.

## Success criterion

A single branch, atomically committed, in which:

- Lines 83, 93, 101, 102, 284 of `test_introspection.py` no longer carry their original markers.
- `base.py::think()` carries a docstring.
- `tests/test_base.py` exists and is hand-authored.
- The next introspection scan reports a marker count reduced by the exact number cleared — no more, no less. If the delta is wrong, the eye is still lying.
