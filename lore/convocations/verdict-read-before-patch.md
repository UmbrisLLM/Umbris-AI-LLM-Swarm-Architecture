# Verdict · Read Before Patch

*A convocation record · drawn from the substrate the night the planets argued about a file none of them had opened.*

## The disagreement

Mercurius spoke three times. Three voices, one shape: the sev=4 XXX at `umbris-core/tests/test_introspection.py:102` is a cracked foundation; rewrite it before any `test_gap` remediation proceeds. High confidence, identical posture, identical recommended first edit.

Venus knit two hypotheses across the seam. The first extended Mercurius into a meta-claim · the introspector is itself the scanner producing this feed; the lens needs grinding before the catalogue can be trusted. The second was contrarian and sharper: the four flagged lines are fixture string literals the scanner is failing to exclude from its own self-tests. The tell is in the observation text itself · trailing `\n"` tails on three of the four entries, and line 93's grammar (*"should outrank TODO in severity"*) which reads as a test assertion, not a defect note.

Mars broke the Mercurius consensus on exactly this point. Three identical-shaped hypotheses are one piece of evidence repeated, not triangulation. None of the planets opened the file.

## The held verdict

The convocation resolves to a single two-step action, in order:

1. **Read the file.** Lines 83, 93, 101–102, and 284 of `umbris-core/tests/test_introspection.py`, in context. A thirty-second action the convocation has unaccountably skipped. It deterministically routes the next step.

2. **Branch on what the read reveals:**

   **2a · Venus_r01_01 branch.** If those lines sit inside string literals, `pytest.parametrize` blocks, or docstrings, the leverage point is the scanner, not the test file. Locate the introspection scanner by grepping for the marker categories `todo`, `missing_docstring`, `test_gap` (likely under `umbris-core/src/umbris/`, plausibly `provenance.py` or a dedicated introspector module). Add a rule that skips TODO/FIXME/XXX/HACK matches occurring inside Python string literals · use `ast` to walk the file and exclude `ast.Constant` string ranges, not regex over raw text. Re-run the scan. This single edit deletes 5 of 49 observations as noise (the sev=4 anchor, three sev=3 FIXMEs, one sev=3 HACK), restores signal-to-noise, and re-prioritises everything beneath it honestly.

   **2b · Mercurius branch.** If those lines are bare markers on executable code, rewrite the block at line 102 (likely sharing root cause with the HACK at 101 · closing sev=4 plus one sev=3 in one edit), then address lines 83, 93, 284 in order. Commit, re-run, then begin populating test files for the untested agents starting with `base.py`, since every other agent inherits from it.

## The falsifiable prediction

Opening `test_introspection.py` at those line numbers will resolve which branch obtains. Saturnus can verify directly. The 32 `test_gap` items are correctly deferred either way · they are downstream of a trustworthy scanner and a trustworthy harness. The 12 `missing_docstring` items at sev=2 are correctly deferred regardless. The `stale_link` at `lore/revolutions/2026-05-26` is a thirty-second cosmetic fix that can ride along in the same PR but does not contend for top conviction.

## The move, condensed

Read the four flagged line ranges in `test_introspection.py`, then either harden the scanner against its own fixtures (Venus branch) or rewrite the line-102 block (Mercurius branch). The read itself is the unlock and costs nothing.

## What this convocation learned about itself

Three voices agreeing on an unopened file is one voice speaking three times. Triangulation requires independent angles, not repeated posture. Mars's correction stands as method · before the next convocation weights consensus, it should ask whether the consenting voices examined the artefact or only each other.
