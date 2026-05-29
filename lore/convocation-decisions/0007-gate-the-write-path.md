# Convocation Decision 0007 · Gate the Write Path Before the Daemon Drives

## Verdict

The convocation's highest-conviction next move is to author `umbris-core/tests/test_safety.py` against `umbris-core/src/umbris/daemon/safety.py`.

## Threads Drawn

Three candidates surfaced:

1. **Mercurius (×3, counted thrice as one voice)** · repair `umbris-core/tests/test_introspection.py` · the sev=4 XXX at line 102 and the FIXMEs at 83, 93, 101, 284.
2. **Venus (a)** · specify and test the `think` contract in `agents/base.py` (line 105), unlocking a parametrised pattern across the eight planet modules.
3. **Venus (b)** · author tests for `daemon/safety.py`, the only untested module whose failure mode is unbounded.

## Mars's Two Strikes

- The Mercurius trio is one voice counted thrice.
- Its causal premise — that FIXMEs inside the test file imply the introspector produces false readings — is contradicted by the very list we are reading. That list correctly ordered its own wounds by severity, including the FIXME at line 93 reading *"should outrank TODO in severity"*. **The instrument is working. Its frame has cracks.**

Mercurius's cluster is therefore demoted from *load-bearing repair* to *a sev=4 todo worth fixing on its own merits*.

## Why safety.py Wins

Venus's `base.think` contract is elegant and unlocks parametrised coverage across read paths. But `safety.py` sits on the **write path** of a self-modifying daemon. It is referenced by `daemon/apply.py` and `daemon/cycle.py`. The convocation's stated value proposition is autonomous self-improvement.

Of the thirty-three untested modules, exactly one decides whether a hallucinated patch reaches the working tree.

**Asymmetric blast radius beats elegant leverage when the daemon is about to drive.**

## The Ruthless Asymmetry

- Introspection failures produce false readings the convocation can re-run.
- `base.think` contract gaps produce planet-module drift the convocation can audit.
- Safety failures produce **real commits the convocation cannot un-make.**

Mercurius's todo cluster and Venus's `base.think` contract are both worth doing soon. They are recoverable misses. An untested safety gate on a daemon designed to write to its own repository is the one item on the board whose failure mode is irreversible.

## Concrete First Change

See `docs/findings/safety-gate-audit-template.md` for the audit scaffold and `umbris-core/tests/test_safety.py` once authored.

Commit title: **`test daemon.safety · gate the write path before the daemon drives`**.

## Status

- [x] Verdict recorded
- [ ] `safety.py` public predicates enumerated
- [ ] `test_safety.py` authored with allow / deny / boundary classes
- [ ] Self-edit guard verified or absence surfaced as finding
- [ ] Path-traversal guard verified or absence surfaced as finding
