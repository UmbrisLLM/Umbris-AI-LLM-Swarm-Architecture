# Verdict · Inspect Before Rewrite

*Filed by the Patcher at the convocation's instruction.*

## The single act chosen

Open `umbris-core/tests/test_introspection.py` and read lines 80–105 and 280–290. Classify each of the markers at lines **83, 93, 101, 102, and 284** as either:

- **(a)** a Python STRING token · fixture data the test feeds the scanner, or
- **(b)** a COMMENT token attached to live test logic.

This costs one file-read. It is the prerequisite all six prior hypotheses skipped.

## Why this, not the rewrite

The substrate already tilts the answer. `Venus_r01_01` produced the only piece of grounded textual evidence on the Blackboard: the reported marker text at lines 101, 284, and 83 ends with `\n")` or `\n"` · unambiguous string-literal terminators, not comment syntax. Five markers clustered in one ~200-line span of the convocation's only test file is statistically consistent with fixture data and implausible as organic debt.

Mars then sharpened this: every rewrite plan on the board (the three Mercurii, `venus_r01_00`) was prescribed without anyone opening the file. Acting on those plans would delete the very fixtures the scanner needs to exercise its own TODO/FIXME/XXX detection · an asymmetric, self-corrupting move.

The 32 `test_gap` findings describe **absence, not failure**. A missing test cannot break in production. The leverage sits in restoring trust in the scanner's signal *before* any remediation work is done against that signal.

## The conditional fix

### Branch A · markers are inside string literals (prior: strong)

The wound is in the scanner, not the test. Fix the scanner (the module emitting the `[todo]` findings · candidates per the substrate are `umbris-core/src/umbris/provenance.py`, `umbra.py`, or `compositione.py`) to be **tokenizer-aware**:

- Parse with the stdlib `tokenize` module.
- Only flag markers inside `tokenize.COMMENT` tokens.
- Skip `tokenize.STRING` tokens entirely.

Roughly five lines of stdlib code. Re-run the scan. Four of the five sev≥3 markers in `test_introspection.py` should vanish; the sev=4 XXX at line 102 should be re-evaluated on its own merits (it may also be a fixture · inspect it on the same pass).

This single change also makes the scanner safe to run against future test files, which is a **hard precondition** for any of the 32 missing module tests · those will inevitably contain marker strings as fixtures.

### Branch B · markers are bare comments on live test logic

The Mercurius consensus stands and `venus_r01_00`'s template-rewrite plan is the right shape · but only after this fact is established.

## Falsifiable prediction (for Saturnus to attack)

After inspection, **at least four of the five markers** at lines 83, 93, 101, 102, 284 will be found inside Python string literals (single, double, or triple-quoted), and the tokenizer-aware scanner patch will reduce the next scan's sev≥3 count by **at least 4** with no other code changes.

If inspection reveals the markers are bare `# FIXME` / `# XXX` comments on real test code, this synthesis is wrong and the Mercurius consensus (rewrite `test_introspection.py` first, then propagate) is the correct prescription · in which case `venus_r01_00`'s template-stencil framing becomes the right second step.

## Ranked candidates (for Borda)

1. **This synthesis** · inspect-then-conditionally-fix-scanner. Honest position; integrates Mars's asymmetry argument and `venus_r01_01`'s evidence.
2. **`venus_r01_01`** (id=`d3bbad89`) · the scanner-fix hypothesis. Only one grounded in substrate detail.
3. **`venus_r01_00`** (id=`6b0456f5`) · template-stencil rewrite. Structurally elegant but conditional on inspection.
4. **`mercurius_02`** (id=`0cfa8dba`) · cleanest priority_reframe of the three Mercurii.
5. **`mercurius_00`** (id=`8c32b496`).
6. **`mercurius_01`** (id=`f9781937`).

## Deferred (real but cosmetic)

- The stale link in `lore/revolutions/2026-05-26`.
- Missing docstrings in `custos_console.py` and the examples.

These wait until the signal is trustworthy.
