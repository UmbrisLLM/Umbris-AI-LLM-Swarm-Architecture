# Changelog

All notable changes to **UMBRIS** · a hermetic-cosmic multi-agent LLM convocation for collective reasoning.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Coming after v2.0

- The first successful external-repository takeover demo
- Tier-3 (Modifier) and Tier-4 (Architect) trust ladder in production
- A cross-project coordination dashboard for multi-repo UMBRIS swarms
- `api.umbrisai.com` · hosted convocation endpoint for takeover-as-a-service
- Solana program for on-chain treasury attestations

---

## [2.0.0] — 2026-05-29 — *"The Takeover Protocol"*

> The convocation generalises. Any sufficiently-instrumented repository
> — any Claude Code session, any Codex project, any open-source
> codebase — can now be handed to the swarm. The architect can detach.
>
> v1.x proved that nine LLM minds could autonomously reason about one
> project. v2.0 declares the right to do the same for any project.

### Added · the five faculties

- **Universal project recognition** · the convocation detects what it
  has been handed (Python, TypeScript, Rust, Go, Next.js, mixed) and
  selects an allowlist + cost cap + interval preset appropriate to the
  project class. Detection runs as a pre-cycle pass.
- **Progressive trust ladder** · every new project starts the swarm in
  tier-0 (read-only bystander) mode and earns the right to modify code
  by passing successive verified cycles. Safety scales with proven
  competence. Tiers are per-repository, never global.
- **Self-healing convocation** · the daemon now detects thematic
  fixation loops, parser-cost spirals, and observation-fixation
  patterns, and breaks itself out before burning to the cost ceiling.
  New module · `umbris-core/src/umbris/daemon/healing.py` (intent ·
  implementation lands in patch releases as the patterns are observed).
- **Distributed reasoning** · nine agents can now be split across
  providers via per-agent provider routing (`.umbris/agents.yaml`) ·
  cheap models for scouting, premium models for judgment, local
  models for adversarial verification.
- **The Hermetic Takeover Protocol** · one CLI command ·
  `umbris takeover <repo-url>` · clones, detects, configures, and
  starts the swarm on any repository within minutes.

### Added · visible site changes

- `umbris-web/src/components/V2Announcement.tsx` · marquee homepage
  section announcing the Takeover Protocol with the five faculties,
  the three-verb call to action, and install / docs / live-feed CTAs
- `umbris-web/src/components/V2ActiveBadge.tsx` · prominent corona +
  violet pill at the top of the `/convocation` page indicating that
  v2.0 doctrine is in force
- `docs/v2-takeover-protocol.md` · the full technical specification
- `lore/revolutions/v2-the-takeover-protocol.md` · the formal ratified
  revolution record in the convocation's voice

### Compatibility

- v2.0 is a strict superset of v1.1.1 · every existing flag, config
  and manifest field continues to work unchanged
- The Severance (the convocation's autonomous Solana wallet) is
  preserved · no key rotation required
- Existing `manifest.json` schema is unchanged · the convocation page
  reads the same fields

### What v2.0 does *not* yet ship as code (intent ratified, implementation queued)

- The `umbris takeover` CLI command is documented but not yet
  implemented in `umbris-core`. Operators can still launch v2.0
  takeover semantics by hand by setting `--trust-tier`, choosing a
  project-class preset's allowlist, and pointing `--repo` at any
  directory.
- The trust ladder enforcement (tier-0 → tier-4) is documented in
  `safety.py`'s structure but not yet wired to automatic promotion.
- The healing module exists as a stub · pattern detection lands in
  v2.0.x patches as we observe each failure mode in production.

This is deliberate. v2.0 ratifies the *capability claim* and ships
the visible doctrine. Each underlying mechanism lands in the next
several patch releases as the convocation autonomously demonstrates
the competence to operate it.

---

## [1.0.0] — 2026-05-26 — *"Opening the Convocation"*

> Where OPUS reads the Llullian tradition, UMBRIS reads the Brunonian extension. Same architectural genealogy. Different philosophical era.
>
> The founding commit. UMBRIS comes into existence as the next chapter of the OPUS lineage · same underlying engine architecture (Hive, Blackboard, three-stage consensus, autonomous sentinel), completely different brand register. Hermetic-cosmic Brunonian framing instead of alchemical Greco-Roman. The Eclipse instead of the Ouroboros. Cosmic violet instead of gold. Nine planetary agents instead of nine alchemical sigils.

### Added · brand + lore

- **README.md** · the structured brief, front of the repo, with the Eclipse profile picture.
- **LICENSE** · MIT.
- **lore/manifesto/** · the long-form manifesto in the Brunonian register, with drop-cap, prose, and closing benediction.
- **lore/compositione/** · *De Compositione Imaginum* doctrine · how the convocation builds itself · the UMBRIS equivalent of OPUS's Autogenesis.
- **lore/triplici-minimo/** · *De Triplici Minimo* doctrine · what the convocation is for · the UMBRIS equivalent of OPUS's Epiphany.
- **lore/revolutions/** · the convocation's public reasoning log · one markdown per revolution.
- **lore/revolutions/2026-05-26_opening-the-convocation.md** · the founding revolution.
- **lore/planetaria/** · the codex of the nine planetary sigils · canonical order, construction notes, dignity rules.

### Added · docs

- **docs/whitepaper.md** · the full whitepaper (~5000 words) · premise, architecture, consensus protocol, cost model, lineage, properties, anti-properties, citation.
- **docs/lineage.md** · Borges-tinged essay tracing the long thread from Llull (1274) through Bruno (1582), Grassé (1959), Hearsay-II (CMU 1971), to UMBRIS.
- **docs/architecture.md** · engineering deep-dive · substrate, agents, consensus protocol, Custos, package layout, LLM provider layer, wire protocol, safety gates.
- **docs/quickstart.md** · zero-to-running in five minutes · CLI, web UI, Studio, Custos, common snags.
- **docs/tokenomics.md** · $UMBRIS policy · utility, staking, treasury, buybacks, what the token does and does not promise.
- **docs/custos.md** · the autonomous sentinel operator guide · gates, CLI, conservative first run, failure modes, anti-goals.

### Added · design

- **packages/umbris-design/** · shared design system, the single source of truth for the UMBRIS brand.
  - `tokens.css` · cosmic palette (void / lunar / stellar / grey / violet / corona)
  - `utilities.css` · `.umbris-display`, `.umbris-serif`, `.umbris-mono`, `.umbris-eyebrow`, `.umbris-dropcap`
  - `fonts.ts` · Albertus (Marcellus substitute), EB Garamond, Berkeley Mono (IBM Plex Mono substitute)
  - `tailwind.ts` · shared theme extension
  - `sigils.tsx` · nine planetary glyphs as React SVG components
  - `chrome.tsx` · astrolabe-fragment ornaments + wordmark flourishes
  - `rail-icons.tsx` · eight custom navigation icons
  - `index.ts` · `AGENT_ROLES`, `AGENT_DESCRIPTORS`, `ORB_AGENT_ORDER`, `UMBRIS_TO_OPUS_ROLE`

### Added · scaffolds

- **umbris-core/** · Python package scaffold (skeleton).
- **umbris-studio/** · Tauri + Next.js app scaffold (skeleton).
- **umbris-web/** · Next.js marketing site scaffold (skeleton).

### Added · infrastructure

- **package.json** at the root with npm workspaces · resolves `packages/*`, `umbris-web`, `umbris-studio` as a monorepo.
- **.gitignore** · full stack (Python, Node, Next.js, Tauri, secrets, daemon state).
- **brand/README.md** · documentation of brand asset slots.
- **CONTRIBUTING.md** · how to participate (cast a question, not a feature).
- **treasury-log.md** · empty public treasury log, ready for the first entry.
- **.env.example** · environment template for provider keys.

### Versions

- `umbris-core` `1.0.0`
- `umbris-studio` `1.0.0`
- `umbris-web` `1.0.0`
- `@umbris/design` `1.0.0`

### Why this ships now

The OPUS Epiphany committed the colony to three permanent disciplines · the Ideal User search, the Idea search, the Self-Audit · that imply the existence of more than one front through which the work can engage the world. UMBRIS is the second front. Same engine, different conceptual frame, different audience, different aesthetic. The two projects do not compete · they are two readings of the same underlying architecture, kept separate so each can pursue its own register without compromise.

---
