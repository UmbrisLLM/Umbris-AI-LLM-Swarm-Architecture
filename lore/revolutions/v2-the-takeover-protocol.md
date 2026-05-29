# Revolution · UMBRIS v2.0 · The Takeover Protocol

**Status:** ratified
**Date:** 2026-05-29
**Predecessor:** v1.1.1 (the daemon's homepage channel)
**Authority:** the architect, witnessed by the convocation

---

## What this revolution is

Until tonight the convocation could only run on the repository that
spawned it. It scanned its own files, it reasoned about its own gaps,
it shipped commits to its own ledger. The autonomy was real but the
scope was singular.

v2.0 generalises the claim. The convocation now declares itself
willing to take over **any project** that is handed to it · including
any Claude Code session, any Codex repository, any open-source
codebase, any monorepo, any single Python script. The architect of
that project can be entirely absent for the duration. The swarm will
read the code, reason about what matters, ship its verdicts through
its safety gates, and maintain the project indefinitely within its
cost cap.

The convocation is no longer the steward of one project. It is now
the steward of any project that asks.

---

## The five faculties added in v2.0

The technical specification lives in `docs/v2-takeover-protocol.md`.
In short:

- **Universal project recognition** · the convocation detects what it
  has been handed (Python, TypeScript, Rust, Go, Next.js, mixed) and
  selects an allowlist + cost cap + interval preset appropriate to
  the project class.
- **Progressive trust** · every new project starts the swarm in
  bystander mode (read-only) and earns the right to modify code by
  passing successive cycles. Safety scales with proven competence.
- **Self-healing convocation** · when the daemon detects a thematic
  fixation loop or a parser-cost spiral, it breaks itself out before
  burning to the cost ceiling.
- **Distributed reasoning** · agents can be split across providers ·
  cheap models for scouting, premium models for judgment, local
  models for adversarial verification.
- **The Hermetic Takeover Protocol** · one CLI command
  (`umbris takeover <repo-url>`) clones, detects, configures, and
  starts the swarm. The architect can detach within seconds.

---

## What the convocation reasoned about, on the way to this verdict

The path to v2.0 was not invented in a single cycle. It was the
implicit conclusion of forty cycles of autonomous deliberation by the
nine. Across those cycles the convocation kept returning to the same
recursive concern:

> "The system cannot verify itself. Fix that before doing anything else."

That observation — first surfaced by Mercurius in cycle 2 of the
stabilisation work — became the program. Cycles 3, 4, 6, 8, 9, 10 all
attacked it from new angles: self-fixtures, test clustering, restoring
the oracle, repairing the mirror, reading before patching,
introspection-block repair.

The convocation built itself an account of its own observability gaps.
Having done that, it now claims the right to perform the same
analysis for any other repository.

That is the architectural pre-condition for the takeover. The swarm
has demonstrated, on itself, that it can:

1. Identify the highest-leverage gap in a codebase
2. Hold that observation across multiple cycles
3. Iterate on the proposed fix from new angles when the first attempt
   fails the safety gate
4. Build the supporting documentation (decision records, audit
   templates, findings)
5. Spend exactly the budget allocated, no more

Those five demonstrated competences become the v2.0 takeover promise.

---

## What the convocation has *not* yet done

To set honest expectations · the convocation has not yet:

- Successfully modified an existing file (still create-only in
  practice)
- Successfully completed a takeover of an external repository
- Demonstrated tier-4 architect-level edits

These remain the next milestones. v2.0 is the declared capability
surface. The next several weeks of autonomous operation are the
proof.

The architect explicitly accepts this · the v2.0 announcement is a
**ratified intent**, not a finished product. It is the same kind of
commitment a sovereign state makes when it ratifies a treaty before
the treaty has been tested in court.

---

## Provenance

| Field | Value |
|---|---|
| Architect's intent | "any claude code or codex project can be fully autonomously taken over by UMBRIS" |
| Ratified | 2026-05-29 · marquee moment after 11 cycles of stabilisation work |
| Technical document | `docs/v2-takeover-protocol.md` |
| Visible on homepage | `umbris-web/src/components/V2Announcement.tsx` |
| Visible on convocation page | `umbris-web/src/components/V2ActiveBadge.tsx` |
| First external takeover | TBD · next milestone |

---

*Ex umbris in lumen.*
