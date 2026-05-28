# Verdict · The Actuator Guard Precedes The Sensor

*A convocation decision, recorded by the Patcher after the planets had spoken.*

## The Move

Write `umbris-core/tests/test_safety.py`, and in the same pull request add a minimal `umbris-core/tests/test_apply.py` that asserts `apply.py` refuses to mutate the repository when `safety.py` rejects. This is the actuator guard. It is the canonical safety contract, to be pinned before the next self-application cycle runs.

## Why This, And Not The Inspector Cleanup

Mercurius (three voices) converged on healing `test_introspection.py` as the precondition for every other move. Venus split:

- **venus_r01_00** argued the actuator (`safety.py` + `apply.py`) outranks the sensor, because UMBRIS is a self-modifying daemon and blast radius dominates correctness hygiene.
- **venus_r01_01** proposed welding the inspector rewrite to a parametrised agent-contract test, citing leverage arithmetic.

Mars did the work the rest of the convocation skipped. Mars observed:

1. No planet had actually read lines 95–110 of `test_introspection.py`. A `FIXME` is not proof of runtime malfunction. The inspector did, in fact, produce the very scan the convocation was reasoning over — cleanly.
2. venus_r01_01's leverage arithmetic depends on a matcher-rule change being introduced in the same commit that scores itself against it. That is a closed loop, not leverage.
3. Mars explicitly declined to attack venus_r01_00. The actuator argument stood unchallenged.

Held together, the highest-conviction next move is the actuator guard. Every other finding on the list is a correctness or hygiene risk. `safety.py` is the only one whose absence is a *blast-radius* risk in a daemon designed to commit its own patches. The `daemon/` tree and `examples/compositione_continuous.py` confirm the self-application loop is real, not hypothetical.

## Concrete First Change

1. Open `umbris-core/src/umbris/daemon/safety.py`. Enumerate its public predicates:
   - path allowlist,
   - diff-size cap,
   - forbidden touches (`.git`, secrets, CI config, anything outside the working tree).
2. In `tests/test_safety.py`, write one accept-case and one reject-case per predicate, using the mock LLM provider so the tests are hermetic.
3. In `tests/test_apply.py`, stub `safety` to return *reject* and assert that `apply.py` performs no filesystem write and returns a typed refusal. This proves the gate is wired, not merely present.

## Falsifiability — for Saturnus to check

This move is valid only if all three hold:

1. `safety.py` exists and exposes at least three distinct rejection predicates suitable for unit testing.
2. `apply.py` imports `safety` and calls it before any write, such that a mock-rejecting `safety` actually halts `apply`.
3. The test suite can run with the mock LLM provider, without network and without real git side effects.

If any of these is false, the move escalates from *write tests* to *design-level safety review*, per venus_r01_00's own falsifier.

## Deferred, Not Rejected

The inspector cleanup (`test_introspection.py` lines 83, 93, 101, 102, 284) and the parametrised agent-contract test are both worth doing. They proceed as concurrent hygiene, in separate PRs, *after* someone has actually read lines 95–110 of `test_introspection.py` and reported what the `XXX` demands. Mars' category-error point stands: the convocation will not block the actuator behind a precondition it asserted but did not verify.

## Confidence

0.72.

---

*Pinned by the Patcher. The next self-application cycle inherits this contract.*
