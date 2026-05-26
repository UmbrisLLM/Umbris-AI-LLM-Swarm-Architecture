<div align="center">

# Quickstart

### *From clone to a running convocation in under five minutes.*

— § Magnum Opus · MMXXVI —

</div>

---

This document is for someone who wants to open UMBRIS on their own machine and cast a question, today. It assumes nothing about prior exposure to the project. It assumes you have a terminal.

If you want the conceptual picture first, read the [manifesto](../lore/manifesto/) or the [whitepaper](whitepaper.md). If you just want it running, keep reading.

---

## § 1 · Prerequisites (one-time, ~10 minutes)

You need:

- **Python 3.11+** · [python.org/downloads](https://www.python.org/downloads/)
- **Node.js 20+** · [nodejs.org](https://nodejs.org)
- An **LLM provider key** · one of:
  - Anthropic (`sk-ant-…` · recommended · [console.anthropic.com](https://console.anthropic.com))
  - OpenAI (`sk-…` · [platform.openai.com](https://platform.openai.com))
  - Ollama (local · free · no key · [ollama.com](https://ollama.com))

For UMBRIS Studio (the desktop app), additionally:

- **Rust toolchain** · `winget install Rustlang.Rustup` (Windows), `brew install rustup-init` (macOS), or [rustup.rs](https://rustup.rs)
- **Tauri build prerequisites**:
  - **Windows** · Microsoft Edge WebView2 (preinstalled on Win 11) + Visual Studio Build Tools with "Desktop development with C++"
  - **macOS** · `xcode-select --install`
  - **Linux** · `webkit2gtk-4.1`, `libayatana-appindicator3-dev`, `librsvg2-dev`, `build-essential`

---

## § 2 · Three Commands · the Convocation Engine

```bash
git clone https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture
cd Umbris-AI-LLM-Swarm-Architecture
npm install
```

Then set up the Python engine in a virtual environment:

```bash
cd umbris-core
python -m venv .venv

# Windows:
.venv\Scripts\activate

# macOS / Linux:
source .venv/bin/activate

pip install -e ".[serve]"
cd ..
```

Configure your provider · create `umbris-core/.env`:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
UMBRIS_PROVIDER=anthropic
```

(For OpenAI, set `OPENAI_API_KEY` and `UMBRIS_PROVIDER=openai`. For Ollama, install it and set `UMBRIS_PROVIDER=ollama`.)

Cast your first question via the CLI:

```bash
umbris query "In one sentence, what is stigmergy?"
```

The convocation runs (~30 seconds in RAPID mode, ~2 minutes in STANDARD), then surfaces a verified vision with confidence, cost in USD, and the path to a full provenance trace.

---

## § 3 · The Local Web UI · `umbris serve`

Boot a FastAPI server with an inline single-page UI:

```bash
umbris serve
# opens http://127.0.0.1:8000 in your browser
```

You can cast questions, watch the convocation deliberate live via SSE, and inspect the full Imago trace. Same engine as the CLI, just visual.

---

## § 4 · The Desktop App · UMBRIS Studio

```bash
npm run tauri:dev --workspace umbris-studio
```

First Rust compile takes ~3–5 min. Subsequent runs open the window in seconds.

The window is 1440×900, dark only. The Sphere of Shadows sits at the centre. Eight planetary sigils orbit. Type a question into INSCRIBE A QUERY on the left, click POSE, watch the convocation deliberate live on the orb, receive the verified vision on the right.

Full operator guide: [`../umbris-studio/README.md`](../umbris-studio/README.md).

---

## § 5 · The Autonomous Sentinel · the Custos

For autonomous operation against a repository:

```bash
# safe first run · single cycle, no commit, no push
umbris custos --dry-run --once

# live · runs every 2 hours, commits + pushes verdicts to main
umbris custos --interval 2h --commit-and-push
```

The Custos sits in your terminal as a foreground process, or wrap in a systemd unit / launchd plist / `pm2 start` for true autonomy.

Full operator guide: [`custos.md`](custos.md).

---

## § 6 · What Each Command Costs (Anthropic-defaults)

| Command | Mode | Typical wall time | Typical cost |
|---|---|---|---|
| `umbris query "…"` | RAPID | 30–60s | $0.10–0.30 |
| `umbris query "…" --mode standard` | STANDARD | 2–3 min | $0.30–1.50 |
| `umbris query "…" --mode deep` | DEEP | 5–10 min | $2–5 |
| `umbris custos` (per cycle) | RAPID by default | 1–2 min | $0.10–0.30 |

Costs are measured per Imago, not estimated. The reported cost matches your actual Anthropic invoice within rounding.

---

## § 7 · Common Snags

**`umbris: command not found`** · the venv isn't activated. Run `source .venv/bin/activate` (or `.venv\Scripts\activate` on Windows).

**"the convocation is unreachable" in the Studio** · the Python sidecar didn't boot. Check that `python` is on your PATH, that `umbris-core` is pip-installed in the active venv, and that your `.env` has a valid API key.

**Tauri compile fails on Windows with `link.exe not found`** · the Visual Studio C++ Build Tools are missing. Run `winget install Microsoft.VisualStudio.2022.BuildTools --override "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --passive"` in an admin PowerShell.

**Saturnus keeps falsifying my queries** · this is feature, not bug. The convocation has reached the verification limit without producing a vision Saturnus accepts. The "best remaining · not verified" output is honest about the failure · trust the label. Reduce the difficulty of the question or try DEEP mode.

---

<div align="center">

*Ex umbris in lumen.*

[← back to docs](.) &nbsp;·&nbsp;
[the whitepaper](whitepaper.md) &nbsp;·&nbsp;
[the Custos operator guide](custos.md) &nbsp;·&nbsp;
[the tokenomics](tokenomics.md)

*Magnum Opus · MMXXVI · v1.0.0*

</div>
