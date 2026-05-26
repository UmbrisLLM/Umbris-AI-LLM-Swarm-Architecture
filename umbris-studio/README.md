<div align="center">

# UMBRIS STUDIO
### *The convocation, taken home.*

— § The desktop HUD for UMBRIS v1.0 · MMXXVI —

</div>

---

**UMBRIS Studio** is the official desktop application for the UMBRIS convocation. One signed window, one branded HUD, every button wired to the real `umbris-core` engine. Cast a question, watch eight planetary intelligences argue live around the Sphere of Shadows, receive a verified vision, operate the autonomous Custos sentinel. Open-source under MIT.

This is the v1.0 implementation. Tauri 2.x + Next.js 14, 1440×900 dark HUD, the Eclipse at the centre.

## Status

**v1.0.0 · scaffolded.** Full implementation lands in v1.1 by porting the OPUS Studio engineering wholesale and re-skinning with the UMBRIS design package. The package shell, Tauri config, and the engine-talks-to-Python-sidecar wiring all inherit OPUS Studio's working surface.

For the v1.0 working desktop today, see the sibling [`opus-studio`](https://github.com/0pusAI/Opus-Agent-Swarm-LLM-Framework/tree/main/opus-studio).

## How to install and run (when v1.1 lands)

### Prerequisites

- Node 20+ · [nodejs.org](https://nodejs.org)
- Python 3.11+ · [python.org/downloads](https://www.python.org/downloads/)
- Rust toolchain · [rustup.rs](https://rustup.rs)
- Tauri build prerequisites (platform-specific · see [`docs/quickstart.md`](../docs/quickstart.md))

### Setup

```bash
git clone https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture
cd Umbris-AI-LLM-Swarm-Architecture

cd umbris-core
python -m venv .venv && .venv\Scripts\activate
pip install -e ".[serve]"
cd ..

npm install
npm run tauri:dev --workspace umbris-studio
```

First Rust compile takes ~3–5 min. Subsequent runs open in seconds.

## What the HUD looks like

Three-panel layout, 1440×900, dark only:

- **Left panel (360px) · INSCRIBE A QUERY** · the query textarea, Query Presets (Deep Inscription, Strategic Study, Code Audit, Tablet Review, Market Augury, Custom), Colony Mode (STANDARD / DEEP / RAPID), Research Depth slider (1–5), Constraints field, Cost Cap, Time Cap, large violet **POSE** button.
- **Centre panel · the Sphere of Shadows** · a pure black umbra disc ringed by a thin cosmic-violet corona, orbited by eight planetary sigils in fine bronze (well, violet) circles. The eclipse glows when the convocation deliberates. Each sigil pulses gold (corona-cream) when its agent casts an Imago.
- **Right panel (360px) · THE VERDICT** · empty-state diamond ornament + "AWAITING VERDICT · the scribes are still in council" · or when verified, the full vision in EB Garamond, confidence bar, cost, wall time, **VIEW LIVE TRACE** + **PRESERVE TABLET** buttons.

Below the centre panel: nine-row "THE EIGHT ME" list + four live metrics (TABLET HEALTH · ASSEMBLY 47% · WEDGES 1.24M · ETA 2H 47M).

Bottom bar: **THE CUSTOS** status indicator, **AWAKEN THE CUSTOS** + **REST** buttons, **STYLUS** wallet, **$UMBRIS** balance.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Tauri Desktop Window                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js Frontend (React 18, Zustand, Tailwind)      │   │
│  │  → @tauri-apps/api for IPC                           │   │
│  │  → EventSource for SSE live Imago streams            │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │ Tauri IPC                                  │
│  ┌──────────────▼───────────────────────────────────────┐   │
│  │  Rust Tauri Shell (src-tauri/)                       │   │
│  │  · Sidecar lifecycle (spawn umbris serve)            │   │
│  │  · Health check, graceful kill on window close       │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │ subprocess + localhost HTTP                │
│  ┌──────────────▼───────────────────────────────────────┐   │
│  │  Python Sidecar · `umbris serve` (FastAPI + uvicorn) │   │
│  │  same surface as OPUS's opus serve                   │   │
│  └──────────────┬───────────────────────────────────────┘   │
│  ┌──────────────▼───────────────────────────────────────┐   │
│  │  umbris-core engine                                  │   │
│  │  · Convocation (9 planetary agents)                  │   │
│  │  · Umbra (typed event substrate)                     │   │
│  │  · Custos (autonomous sentinel · v1.0+)              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

The frontend talks to the sidecar over loopback HTTP directly · Tauri commands are only used for sidecar lifecycle and OS-keychain access.

## Brand

UMBRIS Studio uses the shared design system at [`@umbris/design`](../packages/umbris-design/) · Albertus (display) / EB Garamond (body) / Berkeley Mono (status). Cosmic-violet primary accent, eclipse-corona warm flash for verified visions only. Custom 1px-stroke planetary sigils. No alchemical glyphs (those belong to OPUS).

## License

MIT.

---

<div align="center">

*The convocation, taken home.*

*Build it like an instrument, not a UI.*

*Magnum Opus · MMXXVI · v1.0.0*

[← back to the repository root](../README.md) &nbsp;·&nbsp;
[the doctrines](../lore/) &nbsp;·&nbsp;
[the Custos operator guide](../docs/custos.md)

</div>
