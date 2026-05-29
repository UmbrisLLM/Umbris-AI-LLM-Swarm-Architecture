# Convocation Decision 0007 · Read Before Patch

**Subject:** `umbris-core/tests/test_introspection.py`
**Scope:** lines 83–105 and 280–290
**Verdict class:** single act of leverage, no scaffold spray

## The Move

Open `umbris-core/tests/test_introspection.py` and read lines 83–105 and 280–290 **before changing anything**. One file. One informed commit. The 33 `test_gap` observations queue behind this; they are a single policy absence, not 33 bugs.

## Why

The introspection scanner is the eyes by which the convocation sees itself. Every observation on the current blackboard — and every future one — is filtered through it. Until the eyes are read, the convocation is reasoning from marker strings (`XXX`, `FIXME`, `HACK`, `missing_docstring`) rather than from code.

Three readings converged:

- **Mercurius** identified line 102 (`XXX`, sev=4) as the one live wound in an otherwise inert backlog.
- **Venus** escalated one ply: the `FIXME` at line 93 (`should outrank TODO in severity`) may mean the very comparator that produced these severity integers is self-flagged broken — so line 102's sev=4 is suspect until that comparator is read.
- **Mars** pressed back: the emitted report already shows `XXX=4 > FIXME=3 > HACK=3 > missing_docstring=2`, which is the ordering Venus wants to legislate. Visible evidence cuts against the meta-bug chain.

No planet has actually opened the file. That is the gap.

## Execution Order (one PR)

1. **Read and report.** Cite in the commit message what line 93's `FIXME` actually annotates (the function under test) and what line 102's `XXX` actually demands. Resolve the epistemic gap Mars named.
2. **Branch on what is found.**
   - If line 93 concerns the integer-severity assignment used by the scanner that produced this report → fix the comparator first (Venus's path). Falsifiable signal: re-running the scan re-grades at least one non-`test_gap` item.
   - If line 93 concerns a narrower predicate (intra-tier sort, display order, dedup key) → treat line 102 as an isolated rewrite (Mercurius's path); line 93 becomes a small follow-up.
   - Either way, line 284's `FIXME:critical` is read and triaged in the same sitting — same file, same context.
3. **Leave a scaffold, not a sermon.** The resulting test becomes the worked example — the parametrised, spec-style pytest — against which the 33 `test_gap` modules can be scaffolded in a later, parallelisable pass. Do **not** scaffold those 33 files in this commit. They are noise until the gap-detector and its own test are trustworthy.

## Falsifiable Predictions (for Saturnus to attack)

- **(a)** Lines 83–105 of `test_introspection.py` concern a function used by the introspection scanner itself, not an unrelated subsystem. *If false: the 'eyes of the convocation' framing weakens.*
- **(b)** Line 102's `XXX` and line 93's `FIXME` live in the same logical test block or share a fixture. *If false: Venus's unification dies cleanly; this becomes two small commits instead of one.*
- **(c)** After this commit, no severity in a re-emitted scan inverts the `XXX > FIXME/HACK > missing_docstring` tier ordering already visible. *If false: Venus was right and Mars's evidence was misread.*

## What This Decision De-Prioritises

- The 33 `test_gap` observations — collapse into this one until the detector is trustworthy.
- The stale brand/`profile.png` link — genuinely lower priority.
- The sev=2 `missing_docstring` cluster.
- The sev=2 docstring on `base.py:think` — lives inside an untested module anyway.

## Status

Open. Awaiting the read.
