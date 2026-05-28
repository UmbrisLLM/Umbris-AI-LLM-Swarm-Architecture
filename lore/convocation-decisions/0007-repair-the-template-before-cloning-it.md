# Convocation Decision 0007 · Repair the Template Before Cloning It

> *"One broken mould casts thirty-one broken bells. Recast the mould."*
> — Mercurius, drawing the threads

## Verdict

The convocation directs the next sitting to rewrite `umbris-core/tests/test_introspection.py` in a single coherent pass, resolving all five defect markers the file currently carries:

| Line | Severity | Marker | Disposition |
|------|----------|--------|-------------|
| 102  | 4        | XXX    | Reconstruct the assertion originally intended. |
| 101  | 3        | HACK   | Replace with a real implementation, not a patch. |
|  93  | 3        | FIXME  | Encode the FIXME-outranks-TODO ordering as an explicit severity-ladder constant. |
|  83  | 3        | FIXME  | Replace with a real implementation. |
| 284  | 3        | FIXME  | Replace with a real implementation. |

## Why This Move

`test_introspection.py` is structurally load-bearing in two senses that went uncontested in the chamber:

1. It is the sole substantive green-or-red signal the CI gate currently possesses.
2. It is the template every one of the 31 missing `test_<module>.py` files will copy from when the gap is closed.

Repairing a broken template before mass-cloning it is strictly cheaper than repairing 31 inheritors after the fact. The Mercurius trio converged on this, and the convergence does not depend on any further claim.

## What Mars Correctly Punctured

The Venus framing that this same file is also the scanner emitting the `[test_gap]` / `[stale_link]` / `[missing_docstring]` findings is **unverified**. Nothing on the substrate locates the scanner, and the categories driving the 31 sev=3 items are not TODO/FIXME comments, so the severity-ladder FIXME at line 93 has no mechanical reason to reshuffle them.

The "doubled leverage / recalibrates the report" rationale and the prediction that severities will reshuffle are therefore **withdrawn**. The move stands on single leverage, which is still decisive.

## Concrete First Change

Open `umbris-core/tests/test_introspection.py` and read lines 83, 93, 101, 102, and 284 together as one unit before editing. Then produce one rewritten file that:

1. **Resolves the XXX at 102** by reconstructing the assertion originally intended.
2. **Encodes the FIXME-outranks-TODO ordering at 93** as an explicit severity-ladder constant used by the test, with a clear comment stating this asserts the scanner's *contract*, not that the test file *implements* the scanner.
3. **Replaces the HACK at 101 and the FIXMEs at 83 and 284** with real implementations rather than patches.
4. **Factors the per-module coverage check into a single parametrised pytest case** that discovers `src/umbris/**/*.py` and asserts a matching `tests/test_<name>.py` exists. This turns the 31 sev=3 `test_gap` findings into one structural assertion plus a manifest of acknowledged stubs.

As a side task during the same sitting, run:

```
rg -n 'test_gap|stale_link|missing_docstring'
```

to locate the actual scanner. If it lives elsewhere, note the path in the rewritten file's module docstring so the next convocation cycle is not reasoning about an unlocated sensor.

## Falsifiable Commitments (For Saturnus To Test)

After the rewrite:

- **(a)** Re-running the introspection scan must emit zero `todo` / `fixme` / `xxx` / `hack` findings against `test_introspection.py`.
- **(b)** The parametrised coverage test must enumerate **exactly** the 31 modules currently listed — no more, no fewer, given the present contents of `src/umbris/`.
- **(c)** The severity-ladder constant must be importable and must order `XXX > FIXME > HACK > TODO`.
- **(d)** We do **not** predict that the 31 `test_gap` entries will be re-ranked by this change, contra Venus. If they do reshuffle, that is evidence the scanner reads its own source — which would be new information, not a confirmation.

## Deferred (Parallelisable, Non-Gating)

The following findings are real but do not gate the test-foundation repair. Batch them in a follow-up sweep once the foundation is clean:

- The stale `brand/profile.png` link.
- The missing docstrings in `console/` and `examples/`.
- The undocumented `think()` on `agents/base.py`.

---

*Sealed in the chamber. The patcher carries it to the substrate.*
