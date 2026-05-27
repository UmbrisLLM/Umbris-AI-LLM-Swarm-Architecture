<div align="center">

# UMBRIS STUDIO
### *The convocation, given form.*

· § The Desktop HUD for UMBRIS v1.1 · MMXXVI ·

</div>

---

**UMBRIS Studio** is the official desktop application for the UMBRIS planetary convocation. One signed window, one branded HUD, every button wired to the real `umbris-core` engine. Cast a query, watch nine planetary intelligences deliberate live on the Eclipse Orb, receive a verified verdict, operate the autonomous Custos sentinel. Open-source under MIT.

Where OPUS Studio reads the Llullian tradition's instrument, UMBRIS Studio reads the Brunonian extension. Same architecture, different philosophical era.

---

## What you get in this release

- **A real desktop window.** Tauri 2.x shell, Next.js 14 frontend, 1440×900 dark HUD. One signed installer per platform (Windows / macOS / Linux).
- **The Eclipse Orb.** The Closed Eclipse at the centre of the deliberation panel · a pure black umbra disc ringed by a violet corona with a diamond-ring flash at one o'clock. Eight planetary sigils orbit on the outer ring. Each sigil ignites violet in real time as its planet emits a record.
- **The full cast flow.** Query input + Query Presets (Deep Research · Strategic Analysis · Code Audit · Whitepaper Review · Market Intelligence · Custom) + Convocation Mode (Standard / Deep / Rapid) + Research Depth slider + Constraints + Cost Cap + Time Cap.
- **A live Convocation Timeline.** Six phases (Query Posed → Convocation Assembled → Research Initiated → Synthesis in Progress → Verification Pending → Verdict Pending) with real wall-clock timestamps as the convocation advances.
- **A live Metrics strip.** Convocation Health · Consensus Progress · Tokens Consumed · Est. Completion. All four tick in real time.
- **The Verdict panel.** Renders the verified answer in EB Garamond with a confidence bar, cost, wall time, records count.
- **The UMBRIS Custos bar.** START THE CUSTOS · STOP · live sentinel status pulse · today's cycles + spend.
- **A branded brand.** Every colour, font, and ornament shared from `packages/umbris-design/` with the marketing site. The wordmark glows. The chrome breathes.

---

## How to install and run

### Prerequisites (one-time, ~15 min)

- **Node.js 20+** · download from [nodejs.org](https://nodejs.org)
- **Python 3.11+** · download from [python.org](https://www.python.org/downloads/)
- **Rust toolchain** · `winget install Rustlang.Rustup` (Windows), `brew install rustup-init && rustup-init` (macOS), or from [rustup.rs](https://rustup.rs/) (Linux)
- **Tauri prerequisites**:
  - **Windows**: Microsoft Edge WebView2 (preinstalled on Win 11) + Visual Studio Build Tools with the "Desktop development with C++" workload (`winget install Microsoft.VisualStudio.2022.BuildTools`)
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux**: `webkit2gtk-4.1`, `libayatana-appindicator3-dev`, `librsvg2-dev`, `build-essential`

### Setup (one-time, ~3 min)

```bash
git clone https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture
cd Umbris-AI-LLM-Swarm-Architecture

# Install the Python engine in a virtual environment.
cd umbris-core
python -m venv .venv
.venv\Scripts\activate         # Windows
# source .venv/bin/activate    # macOS / Linux
pip install -e ".[serve]"
cd ..

# Install all JavaScript dependencies (uses npm workspaces).
npm install
```

See [`umbris-core/README.md`](../umbris-core/README.md) for the engine's full prerequisites · the sidecar needs `umbris-core` installed in `umbris-core/.venv` for the convocation to boot.

### Configure your LLM provider

UMBRIS Studio supports three providers out of the box:

1. **Anthropic** (recommended) · paste an `sk-ant-…` key into `umbris-core/.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   UMBRIS_PROVIDER=anthropic
   ```
2. **OpenAI** · `OPENAI_API_KEY=sk-…` in `umbris-core/.env`, with `UMBRIS_PROVIDER=openai`
3. **Ollama** (local · free · no key needed) · install [Ollama](https://ollama.com), run `ollama serve`, then `UMBRIS_PROVIDER=ollama` in `.env`

### Run the desktop app

```bash
cd umbris-studio
npm install
npm run tauri:dev   # opens the desktop app
```

First run compiles the Rust shell (~3–5 minutes). Subsequent runs open the window in seconds.

The app boots the Python engine as a managed sidecar on a free local port. The top bar status flips from **THE CONVOCATION IS WAKING** to **THE CONVOCATION IS RESTING** when the engine is ready.

### Run in browser dev mode (no Tauri compile)

For faster UI iteration without the Rust build:

```bash
# Terminal 1 · start umbris serve manually on port 8000
cd umbris-core
.venv\Scripts\python -m umbris.cli serve --port 8000 --no-browser

# Terminal 2 · start the Next.js dev server
npm run dev --workspace umbris-studio
# open http://localhost:3000
```

---

## How to use UMBRIS Studio

### 1 · Cast your first query

1. Type a question into the **POSE A QUERY** textarea on the left.
2. Optional: select a **Query Preset** (Deep Research, Code Audit, etc.) to auto-fill Convocation Mode, Research Depth, and budgets.
3. Pick a **Convocation Mode**:
   - **STANDARD** · balanced depth and speed (default)
   - **DEEP** · maximum depth · longer vigil
   - **RAPID** · faster answers · lighter consensus
4. Adjust **Research Depth** (1–5) for per-agent thinking effort.
5. Add **Constraints** if the convocation should respect focus areas or boundaries.
6. Set the **Cost Cap** (USD) and **Time Cap** (hours).
7. Click **POSE** (or `Cmd/Ctrl + Enter`).

### 2 · Watch the convocation deliberate

- The **Eclipse Orb** at the centre animates as each of the 8 planetary intelligences emits records.
- The **Convocation Agents** list below the orb shows live status per agent (ACTIVE · PENDING · DONE).
- The **Convocation Timeline** on the right ticks through six phases with timestamps.
- The **Metrics strip** under the orb shows Convocation Health, Consensus Progress, Tokens Consumed, Est. Completion.
- The **Top bar** says `THE CONVOCATION IS ACTIVE` with a violet pulse.

### 3 · Read the verdict

When the convocation reaches consensus, the **Verdict** panel on the right fills:

- `VERIFIED.` (violet) or `BEST REMAINING.` (stellar, when verifier was unable to confirm)
- The verified answer in EB Garamond serif
- A confidence bar (0–100 %)
- Cost (USD) · wall time · records count
- **VIEW LIVE TRACE** and **SAVE TRACE** buttons (full trace explorer in v1.2)

### 4 · Start the Custos sentinel

The autonomous compositione loop · the convocation that does not sleep.

1. Click **START THE CUSTOS** in the bottom bar.
2. The sentinel spins up with your configured interval, cost caps, and gates.
3. Cycles land in the sentinel panel with status (shipped · skipped · failed · halted), files changed, cost, and commit hash.
4. Click **STOP** to halt the sentinel cleanly.

`umbris custos` runs the full compositione cycle on your local repository: scans, surfaces a bottleneck, asks the convocation for a structured patch, applies it (create-only, allowlist + denylist enforced), runs the test gate, runs the build gate where applicable, commits and pushes. Three independent safety gates (path policy, cost cap, PID lock) bound every cycle.

---

## What is functional today (v1.1.0)

This release ports the entire OPUS Studio working surface to the UMBRIS register. Everything below works:

- Tauri desktop window opens at 1440×900 (or browser dev mode at localhost:3000)
- Python engine boots as a managed sidecar
- Top bar status reflects engine + run state
- Query composer with presets, Convocation Mode, Research Depth, Constraints, Cost Cap, Time Cap
- POSE triggers a real Anthropic / OpenAI / Ollama deliberation
- SSE streams real records from the convocation
- Eclipse Orb animates planetary sigils violet as they emit records
- Convocation Agents list shows live per-agent status
- Convocation Timeline ticks through phases with timestamps
- Metrics strip updates live
- Verdict panel renders the verified answer with confidence + cost + wall time
- Custos control: start, stop, live status
- Shared design system between `umbris-web` and `umbris-studio`

## What is on the roadmap for v1.2

- First-run wizard with provider picker + Stronghold-backed key storage
- `/trace` route: full trace explorer with sidebar of past runs
- `/custos` route: full sentinel panel with cycles table + cost meter
- `/settings` route: provider switcher, query preset editor, budgets
- `/account` route: Solana wallet connect + $UMBRIS balance
- Save Trace (JSON / Markdown export)
- Auto-updater wired to GitHub Releases
- Signed installers (`.dmg`, `.exe`, `.AppImage`) via GitHub Actions matrix
- Edit-mode patching for the sentinel (v1.3)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Tauri Desktop Window                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js Frontend (React 18, Zustand, Tailwind)      │   │
│  │  → @tauri-apps/api for IPC                           │   │
│  │  → EventSource for SSE live record streams           │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │ Tauri IPC                                  │
│  ┌──────────────▼───────────────────────────────────────┐   │
│  │  Rust Tauri Shell (src-tauri/)                       │   │
│  │  · Sidecar lifecycle (spawn `umbris serve` on free port)│  │
│  │  · Health check, graceful kill on window close       │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │ subprocess + localhost HTTP                │
│  ┌──────────────▼───────────────────────────────────────┐   │
│  │  Python Sidecar · `umbris serve` (FastAPI · uvicorn) │   │
│  │  GET  /api/status                                    │   │
│  │  POST /api/query        + colony_mode + constraints  │   │
│  │  GET  /api/stream/{id}  SSE with keepalives         │   │
│  │  POST /api/daemon/start / stop                       │   │
│  │  GET  /api/daemon/state                              │   │
│  └──────────────┬───────────────────────────────────────┘   │
│  ┌──────────────▼───────────────────────────────────────┐   │
│  │  umbris-core engine                                  │   │
│  │  · Convocation (9 planetary agents)                  │   │
│  │  · Umbra (typed event substrate)                     │   │
│  │  · Custos (autonomous compositione cycles)           │   │
│  │  · Providers (Anthropic, OpenAI, Ollama, Mock)       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

The frontend talks to the sidecar over loopback HTTP directly · Tauri commands are only used for sidecar lifecycle and OS-keychain access. This is the simplest viable architecture and the fastest path to "it works".

---

## Repository layout

```
umbris/
├── umbris-core/                  # the Python engine (v1.1)
│   └── src/umbris/
│       ├── convocation.py        # 9-planet swarm orchestrator
│       ├── umbra.py              # typed event substrate
│       ├── custos/               # autonomous compositione loop
│       ├── llm/providers/        # Anthropic, OpenAI, Ollama, Mock
│       └── server/               # `umbris serve` FastAPI app
├── packages/
│   └── umbris-design/            # shared design tokens, fonts, utilities,
│                                 # planetary sigils, chrome, rail-icons
├── umbris-studio/                # the desktop app (v1.1 · this folder)
│   ├── src-tauri/                # Rust shell, sidecar manager
│   └── src/
│       ├── app/                  # Next.js App Router
│       ├── components/           # TopBar, LeftRail, BottomBar,
│       │                         # EclipseOrb, QueryComposer,
│       │                         # ConvocationAgents, MetricsStrip,
│       │                         # ConvocationTimeline, VerdictPanel
│       ├── lib/                  # tauri.ts, sse.ts, types.ts
│       └── store/                # useEngineStore, useComposerStore,
│                                 # useRunStore, useCustosStore (Zustand)
└── umbris-web/                   # the marketing site (umbrisai.com)
```

---

## Brand · why it looks like a celestial instrument

UMBRIS Studio uses the same visual language as the website and the lore:

- **Albertus** (Marcellus as the free-tier substitute) for display headers · uppercase, letter-spaced, ritual.
- **EB Garamond** for body prose · serif, italic-friendly.
- **Berkeley Mono** (IBM Plex Mono as the free-tier substitute) for status, hashes, costs.
- Palette: pure void `#000000`, lunar `#DCDEE7`, stellar `#8B90A3`, grey `#4A4D5C`, cosmic violet `#9C7BD9`, corona `#FAE6B0` (verified flash only). No green. No red except for irrecoverable failures.
- Custom 1px-stroke planetary sigils for the 9 agents. No Lucide. No Material. No Tabler.
- Astrolabe-fragment ornaments around the wordmark. Decorative chrome on the top corners.

The design is enforced from one source of truth: `packages/umbris-design/`. Both the website and the desktop app consume it directly.

---

## Troubleshooting

**The top bar says `THE CONVOCATION IS UNREACHABLE`.**
The Python sidecar didn't boot. Check that:
- `python` is on your PATH
- `umbris-core` is installed in editable mode (`pip install -e ".[serve]"` from inside `umbris-core/`)
- Your `.env` file has a valid `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`, or Ollama is running on localhost:11434
- No other process is on the picked-up port (Tauri will pick a free one; check the terminal Tauri logs)

**POSE click does nothing.**
The composer requires both:
- a non-empty query (the button stays ghost-grey otherwise)
- the engine to be ready (top bar says `THE CONVOCATION IS RESTING`)

**The Eclipse Orb shows agents pulsing but no verdict comes.**
Claude Opus + 5-attempt verification can take 2–3 minutes for a single STANDARD-mode run. The orb keeps animating because the SSE stream is live (you'll see keepalive comments in the network tab every 5s). Switch to RAPID mode for faster turnaround.

**Tauri compile fails on Windows with `link.exe` not found.**
You're missing the Visual Studio C++ Build Tools. Install via:
```powershell
winget install Microsoft.VisualStudio.2022.BuildTools --override "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --passive"
```
Then open a fresh terminal.

---

## License

MIT. Same as the rest of UMBRIS. The code is yours.

---

<div align="center">

*UMBRIS Studio is the convocation, given form.*

*Build it like an instrument, not a UI.*

*Ex umbris in lumen · MMXXVI · v1.1.0*

[← back to the repository root](../README.md) &nbsp;·&nbsp;
[the doctrines](../lore/) &nbsp;·&nbsp;
[the compositione pattern](../lore/compositione/) &nbsp;·&nbsp;
[the Custos operator guide](../docs/custos.md)

</div>
