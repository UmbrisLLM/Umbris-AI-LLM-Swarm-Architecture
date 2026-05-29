# UMBRIS v2.0 · The Takeover Protocol

**Status:** ratified · 2026-05-29
**Predecessor:** v1.1.1 (the daemon's homepage channel)
**Successor:** TBD

---

## The vision

UMBRIS v1.x proved that nine LLM agents could autonomously reason
about a project, reach a verdict, and ship a commit. v2.0 generalises
the claim:

> Any sufficiently-instrumented project — including any Claude Code
> session, any Codex repository, any open-source codebase — can be
> handed to the convocation and the convocation will take it over.

The architect can be entirely absent for the duration. The swarm will
analyse what it has been handed, identify the highest-leverage moves,
ship them through its safety gates, and maintain the project
indefinitely within the cost cap.

This document defines the protocol that makes that possible.

---

## The Five Faculties

v2.0 adds five capabilities to the v1.x convocation:

### 1 · Universal project recognition

When pointed at a new repository, the convocation runs a project-type
detection pass before its first scan. The detector examines:

- Manifest files (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`)
- File extensions and ratios
- Common framework signatures (Next.js, FastAPI, Bevy, etc.)
- Presence of a CLAUDE.md or AGENTS.md
- Existing test infrastructure

From the detection result, the convocation selects a project-class
preset:

| Class | Preset | Allowlist defaults |
|---|---|---|
| Python library | `python` | `src/**/*.py`, `tests/**/*.py`, `docs/**/*.md` |
| TypeScript app | `ts-app` | `src/**/*.{ts,tsx}`, `tests/**`, `docs/**/*.md` |
| Next.js site | `next` | `src/app/**`, `src/components/**`, `public/**`, `docs/**` |
| Rust crate | `rust` | `src/**/*.rs`, `tests/**`, `examples/**`, `docs/**` |
| Go module | `go` | `**/*.go` (excluding `vendor/`), `docs/**` |
| Mixed monorepo | `monorepo` | union of detected workspaces, manually confirmed |

Each preset includes a recommended patcher prompt template, a default
cost-cap-per-cycle (lower for cheap-to-validate languages), and a
recommended cycle interval.

### 2 · Progressive trust

v1.x runs in create-only mode by design — the swarm cannot modify
existing files. v2.0 generalises this to a **trust ladder**:

| Tier | Capability | Earned by |
|---|---|---|
| 0 · Bystander | Read-only · no writes at all | (starting tier) |
| 1 · Annotator | Create new `docs/findings/*.md` and `lore/**` only | 1 successful cycle |
| 2 · Composer | Create any new file in the allowlist | 3 successful cycles in tier 1 |
| 3 · Modifier | Modify existing files, gated by build + test gates | 10 successful cycles in tier 2 |
| 4 · Architect | Modify any file in the allowlist, including breaking changes, gated by an extended verification round | 30 successful cycles in tier 3 |

Tier promotion is **per-repository**. A swarm that has earned tier-4
on its own UMBRIS repository starts at tier-0 when pointed at a fresh
external project.

This means a new takeover is always safe at first. The swarm spends
its first 30 cycles in observation mode, building a paper trail of
analysis, before it earns the right to touch code.

### 3 · Self-healing convocation

v1.x can get stuck in failure modes:

- The convocation fixates on a single theme and produces near-identical
  patches that the parser rejects (the "cost-cap spiral")
- The patcher prompt repeatedly fails to extract a structured response
- The same observation surfaces every cycle but the proposed fix
  keeps getting rejected

v2.0 detects these patterns and recovers:

- **Thematic fixation detection**: if the last N cycles all targeted
  similar files or topics, the next cycle deliberately suppresses
  that theme from its observation set
- **Parser-cost monitor**: if cost exceeds 80% of the cap with no valid
  parse, the cycle aborts cleanly rather than burning to the ceiling
- **Verdict diversity injection**: if the convocation's vote keeps
  landing on the same candidate, Saturnus is given an explicit veto
  authority to force a different next move

These mitigations live in `umbris-core/src/umbris/daemon/healing.py`
(new in v2.0) and can be tuned per repository.

### 4 · Distributed reasoning

The nine agents do not all need to run on the same provider. v2.0
introduces per-agent provider configuration:

```yaml
# .umbris/agents.yaml
mercurius:
  provider: anthropic
  model: claude-haiku-4-5      # cheap scouts
venus:
  provider: anthropic
  model: claude-sonnet-4-6     # synthesis quality
iuppiter:
  provider: anthropic
  model: claude-opus-4-7       # high-conviction judgment
saturnus:
  provider: ollama
  model: qwen2.5-coder:14b     # local adversarial cost control
```

This lets a single UMBRIS instance distribute its compute optimally:
expensive models where reasoning quality matters, cheap or local
models where volume matters.

### 5 · The Hermetic Takeover Protocol

The CLI surface for v2.0 takeover is one command:

```bash
umbris takeover https://github.com/SomeOrg/some-project.git
```

This:

1. Clones the repository into `~/.umbris/projects/<name>`
2. Runs the project-type detector
3. Writes a sensible default `.umbris/config.yaml` (allowlist, cost caps,
   interval, agent provider routing)
4. Starts the convocation in tier-0 (bystander) mode
5. Prints the public live-feed URL where the takeover can be watched
6. Returns immediately · the swarm runs in the background

The architect can detach. Cycles begin within minutes. Tier promotion
follows the trust ladder automatically.

For an existing repository the operator already has cloned:

```bash
umbris takeover ./my-project --tier=1 --interval=1800
```

For a Claude Code session whose project the operator wants UMBRIS to
continue after they log off:

```bash
umbris takeover --from-claude-session
```

This reads the active Claude Code session's project root from the
known socket and starts the convocation pointed at the same tree.

---

## The five new daemon flags

| Flag | Effect |
|---|---|
| `--takeover <repo-url>` | Clone + detect + start (full protocol) |
| `--trust-tier <0..4>` | Override starting tier · default is 0 |
| `--project-class <preset>` | Skip auto-detection, use this preset |
| `--no-healing` | Disable the self-healing mitigations (debug) |
| `--agents-config <path>` | Load per-agent provider routing |

---

## Compatibility

v2.0 is a **superset** of v1.1.1. Every v1.1.1 flag and config
continues to work. A daemon launched with the v1.1.1 flags behaves
identically · the new faculties only activate when their flags are
passed.

The manifest schema is unchanged. The convocation page reads the
same `manifest.json`. The Severance (the swarm's autonomous wallet)
is preserved.

---

## What v2.0 does *not* do

To set honest expectations:

- **It does not guarantee a finished project.** It guarantees twenty
  minutes of nine-mind reasoning every cycle and one verdict per
  cycle. Whether those verdicts compose into a finished project
  depends on the input.
- **It does not bypass safety policy.** Tier promotion is real but
  earned. A misbehaving swarm cannot self-promote out of bystander
  mode.
- **It does not solve the alignment problem.** It is an autonomous
  open-source contributor with a documented value system (the lore)
  and an enforced safety policy (the allowlist + tier ladder). Its
  judgement is bounded by both.

---

## Provenance

| Field | Value |
|---|---|
| Conceived | 2026-05-28 night · during the v1.1.1 stabilisation work |
| Ratified | 2026-05-29 · the architect approved at the marquee moment |
| First takeover demo | TBD (next milestone) |
| Lore record | `lore/revolutions/v2-the-takeover-protocol.md` |

---

*Ex umbris in lumen.*
