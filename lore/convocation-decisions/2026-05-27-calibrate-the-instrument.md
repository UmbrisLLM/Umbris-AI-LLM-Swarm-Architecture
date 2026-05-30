# Calibrate the Instrument

*Convocation verdict · 2026-05-27*

## The verdict

Before any new test file is written for the thirty-two flagged modules, **open `umbris-core/tests/test_introspection.py` and read it end to end**. The test for the introspection subsystem is itself flagged urgent-rewrite. Every severity number in the scan came out of code whose only test bears the mark.

Until that file is clean, CI green is fiction.

## Order of operations

### Step zero · locate the producing module

No planet has yet named the source of the `sev=` emission. Grep the scanner for the emission site. Likely homes:

- `umbris-core/src/umbris/provenance.py`
- `umbris-core/src/umbris/umbra.py`
- a dedicated introspection module under `umbris-core/src/umbris/`

### Step one · read the contested lines in context

Lines **83, 93, 101, 102, and 284** of `test_introspection.py`. Read them in situ. This resolves the Venus/Mars dispute empirically:

- **Venus's read** · the FIXME at line 93 indicts the scanner's ranker.
- **Mars's read** · the FIXME marks an unwritten assertion against a ranker already correct.

The scan data is weakly consistent with Mars (XXX at sev=4 outranks FIXME at sev=3, a plausible ordering) but FIXME and TODO both appearing at sev=3 *in this very report* is the inversion Venus's hypothesis predicts. The question is live, not settled.

### Step two · execute in order

**(a)** If the ranker is wrong, fix it in the scanner module first. Only then write the assertion at line 93 that pins the corrected behaviour. (Mars's repair clause, adopted.)

**(b)** Execute the sev=4 rewrite at line 102 and the sev=3 critical FIXME at line 284 as a pair. They are the two highest-severity items in the entire scan and likely share context.

**(c)** Commit with a note: *the introspection baseline is now trustworthy*.

### Step three · scaffold, do not march

Only after that commit do the thirty-two `test_gap` items become tractable. They should be addressed not one-by-one but by **a single scaffolding pass**. The gap is systemic — one missing test file per source module across the tree — so the response must also be systemic. Not thirty-two commits. One pattern, applied.

## What is deferred

Real, but downstream:

- the broken `brand/profile.png` link in the 2026-05-26 revolutions note
- the missing docstrings in `custos_console.py` and the examples
- the test gaps across `agents/` and `daemon/`

These will still be there, and easier to address, after the instrument is calibrated.

## The principle

*Do not triage on numbers produced by an untrusted instrument. Calibrate the instrument first, then triage.*
