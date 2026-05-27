# Changelog

All notable changes to **UMBRIS** · a hermetic-cosmic multi-agent LLM convocation for collective reasoning.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Coming next (v1.1)

- `umbris-core` · full Python engine implementation (sibling of `opus-core` with planetary role renames)
- `umbris-studio` · Tauri + Next.js desktop HUD with the Sphere of Shadows
- `umbris-web` · marketing site at `umbrisai.com`
- The Custos · autonomous sentinel running every 2 hours via GitHub Actions
- $UMBRIS token deploy on Solana
- First-run wizard with Stronghold-backed key storage
- Hosted endpoint at `api.umbrisai.com`
- Cross-platform signed installers via GitHub Actions

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
