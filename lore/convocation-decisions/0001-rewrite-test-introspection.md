# Convocation Decision 0001 · Rewrite test_introspection.py before the test_gap campaign

**Register:** operational verdict, recorded in the UMBRIS lore for provenance.
**Status:** decided · awaiting patch execution.
**Scope:** one file · `umbris-core/tests/test_introspection.py`.
**Markers cleared (intended):** five · the XXX at line 102, the HACK at line 101, the FIXMEs at lines 83, 93, and 284.

## The thread we drew

Mercurius converged from three independent angles on the same structural fact: thirty-three production modules sit untested, but the single test file that exists is itself marked urgent-rewrite. Writing thirty-three new test files against a broken introspection harness builds on sand · any green bar produced afterwards inherits whatever defect line 102 conceals. The test_gap items are uniform, mechanical, additive work; the introspection rot is subtractive and compounding. Fix the instrument first, then trust its readings.

## Venus's sharpening

Line 93 literally reads *should outrank TODO in severity* · a confession that the severity column of the self-scan report may be miscalibrated by the very file we are about to rewrite. The patch must therefore include line 93 in its reading window and, while reading, grep `src/umbris/` for the actual severity-assignment code. If the ranker lives in production, that becomes the immediate follow-up commit.

## Mars's pressback (accommodated)

1. The ranker logic likely lives in `src/umbris/`, not in a test file · line 93 is probably an assertion about behaviour, not the behaviour itself. Acknowledged: the grep above is the response.
2. Even if the ranker were broken, every high-severity marker on the board sits inside one file, so re-ranking cannot reorder the queue meaningfully. Acknowledged: we do not gate the line-102 rewrite on a re-scan.

Mars's unanswered question · whether the broken instrument is producing false negatives, not merely miscalibrated severities · is carried forward as the meta-risk. The post-patch re-scan is the first place to look: any new finding that appears post-patch is evidence the instrument was suppressing, not merely mis-ranking.

## Concrete first change

a. Open `umbris-core/tests/test_introspection.py` and read lines 83–115 and 280–290 as two blocks.
b. Identify what line 93's FIXME asserts about severity ordering and whether it points at production code. If it does, grep `src/umbris/` (provenance.py, umbra.py, and the introspection scanner wherever it lives) for the severity table and note its location for the next commit.
c. Execute the line-102 rewrite, removing the line-101 HACK in the same pass since they are adjacent and almost certainly coupled.
d. Resolve the FIXMEs at lines 83, 93, and 284 in that order.
e. Run the test file to green.
f. Re-run the self-scan and commit the regenerated observation list alongside the patch so the diff in findings is auditable.

One commit. One file touched in production terms. Five markers cleared. Instrument restored.

## What comes after

Only after this lands does the test_gap campaign begin · and it begins with `base.py` and the daemon core (`apply.py`, `cycle.py`, `safety.py`), because those are the modules whose failure modes would silently corrupt every other agent.

## Audit hooks

- Post-patch self-scan output must be committed in the same change as the rewritten test file.
- Any finding that appears in the post-patch scan but was absent from the pre-patch scan is to be logged as evidence of prior suppression by the broken instrument, and escalated before the test_gap campaign resumes.
- If the severity table is located in `src/umbris/`, its path is to be recorded in the follow-up decision file `0002-relocate-severity-ranker.md`.
