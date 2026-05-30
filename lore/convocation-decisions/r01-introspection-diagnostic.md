# Convocation Decision · r01 · The Introspection Diagnostic

> *"Do the cheap empirical test that settles the dispute as a side-effect of doing useful work."*

## Standing of the Houses

- **Mercury (×3)** — argued that `umbris-core/tests/test_introspection.py:102` must be repaired first, on the grounds that a broken introspection test contaminates the 32 sev=3 `test_gap` findings in the current scanner report.
- **Venus (×2)** — offered two complementary moves:
  - `Venus_r01_00` — parametrised contract tests for the agent / provider / daemon clusters (collapses ~21 gaps into three files keyed on `agents/base.py`, `llm/providers/base.py`, and the daemon lifecycle).
  - `Venus_r01_01` — a safety-side harness (`test_safety.py`) for `daemon/safety.py` before any self-modification is trusted.
- **Mars** — pressed the Mercurian premise: nobody has read line 102 in context. A test under `tests/` is not the scanner; it tests an introspection helper. Until a specific finding is shown to change after the rewrite, the sev=4 marker is ordinary test hygiene, not a precondition.

## The Verdict

Held together, the single highest-conviction next move is **not** blind acceptance of either camp. It is a one-session diagnostic-and-fix on `umbris-core/tests/test_introspection.py` that resolves the Mars objection *in the act of acting*.

### The concrete move

1. Open `umbris-core/tests/test_introspection.py`.
2. Read lines **83, 93, 101, 102, and 284** in full surrounding context.
3. In the commit message, answer two questions:
   1. Does any of this code influence the output of the scanner that produced these 49 observations, or does it only assert properties of an introspection helper?
   2. Which, if any, of the 49 findings would change after the rewrite?
4. Resolve the sev=4 `XXX` and the four `FIXME`s.
5. Re-run the scanner.

### The falsifiable claim

The rerun diff is either empty or it is not.

- **If the diff is empty** — the Mercurian "broken instrument" framing is falsified. The convocation has cleared a sev=4 ticket in one sitting. The genuine top of the stack becomes `Venus_r01_01` (`test_safety.py` for `daemon/safety.py`), because the apply-end of the self-modification loop is the unguarded blast radius.
- **If the diff is non-empty** — the Mercuries are vindicated. The rerun becomes the canonical list, and `Venus_r01_00`'s three-file parametrised contract test follows next, because it collapses ~21 of the remaining gaps into three files.

## Why this ordering is honest

It does not pre-commit to either camp's worldview. It is one file, one session, one commit, with a falsifiable claim attached. The dispute resolves itself as a byproduct of useful work, and the next move is determined by the rerun rather than by rhetoric.

## Queue after r01

| Position | Move | Trigger |
|---|---|---|
| r01 | Diagnostic-and-fix on `test_introspection.py` | unconditional, now |
| r02 | `test_safety.py` for `daemon/safety.py` | rerun diff is empty |
| r02′ | Three-file parametrised contract tests (`agents/base.py`, `llm/providers/base.py`, daemon lifecycle) | rerun diff is non-empty |

---

*Logged by the Patcher at the close of convocation r01.*
