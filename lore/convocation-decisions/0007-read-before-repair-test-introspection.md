# Convocation Decision 0007 · Read Before Repair

*Filed by the Patcher, on behalf of the convened planets.*

## The drawn thread

Mercurius, across three independent passes, located the signal under the noise · thirty-three absent test files form one systemic condition, while the single existing test file, `test_introspection.py`, carries a sev=4 urgent rewrite, two `FIXME:critical` markers, a `HACK`, and a broken edge case across roughly two hundred lines. Because that file is the very mechanism that produced the observation list, every downstream priority inherits its unreliability.

Venus extended the foundation twice:

- **venus_r01_00** · a contract-based parametrized harness keyed on a freshly-written docstring for `think` in `agents/base.py`.
- **venus_r01_01** · a self-healing scaffold that auto-emits stubs for every detected gap.

Mars broke both extensions cleanly:

- venus_r01_00 rests on an unread assumption about what `test_introspection.py:83-102` actually exercises · agent behaviour, substrate scanning, or both.
- venus_r01_01 would launder visible debt into thirty-three skip-marked stubs that read as coverage to any future scan, contradicting Mercurius_01's own principle that honest absence beats misleading presence.

## The verdict

The highest-conviction next move is the **read**.

Open `test_introspection.py` and read lines 83, 93, 101–102, and 284 in order. Then publish, in the commit message, what the file actually imports and asserts · agent contract, substrate scanner, or both. That read is the gating act.

Conditional on what it reveals, the first pull request does exactly one thing:

- Resolve the sev=4 rewrite at line 102 and the coupled sev=3 `FIXME` at line 93, in severity order.
- Delete any test whose underlying behaviour is no longer intended, rather than patching it green.
- No scaffolding. No bundled docstring work. No thirty-three stubs.

The deliverable is a `test_introspection.py` whose every remaining assertion is one a human would defend out loud, plus a one-paragraph note in the PR description stating which of the two Venus extensions the file's actual contents licence as the legitimate follow-up.

That note is what unblocks PR #2 · either venus_r01_00's contract harness (if the file proves to be about agent behaviour) or a narrower scanner-hardening pass (if it proves to be about substrate introspection).

- Confidence that this is the right first move · **high**.
- Confidence about which Venus extension follows · **deliberately deferred to the read**.

## Falsifiable predictions for Saturnus

1. `test_introspection.py` exists at the stated path and contains the five markers at lines 83, 93, 101–102, 284 as reported.
2. The markers are mutually coupled enough that resolving the sev=4 at line 102 cannot be done cleanly without also touching the sev=3 at line 93.
3. No single PR can honestly close the sev=4 plus the nine agent `test_gaps` plus the `think` docstring without first establishing, by reading the file, which planet's framing is correct · therefore any synthesis that bundles them pre-read is premature.
4. The thirty-three `test_gaps` are not uniform · `daemon/safety.py`, `daemon/apply.py`, `provenance.py`, and `llm/providers/*` are load-bearing in a way `examples/*` and `console/*` are not. Mars is right that bundling them was a category error. This synthesis does not repeat that error · but it also does not yet resolve it.

## The principled objection, preserved

Mars's objection is not overruled · it is honoured by deferral. The convocation refuses to ratify either Venus extension before the read, precisely because Mars demonstrated that both extensions encode unread assumptions. The read is the answer to Mars.

## What this decision forbids

- Writing the `think` docstring before the read.
- Emitting any stub file for any of the thirty-three gaps.
- Opening a PR that touches more than `test_introspection.py` in its first commit.
- Closing the sev=4 at line 102 without also addressing the sev=3 at line 93 in the same change.
- Naming a Venus extension as "next" in any artefact authored before the commit message of the read-PR lands.

## What this decision requires

- The read, performed and quoted in the commit message.
- One PR, narrow, with deletions permitted and preferred over green-patching.
- A one-paragraph PR-description note nominating the legitimate follow-up, citing the file's actual contents as evidence.

*The convocation rests here until the read is done.*
