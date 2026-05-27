<div align="center">

<img src="brand/eclipse.svg" alt="UMBRIS · the Closed Eclipse" width="240" />

# UMBRIS
### *Ars Memoriae · De Umbris Idearum*

— § Magnum Opus · MMXXVI —

**A hermetic-cosmic multi-agent LLM convocation. From shadows, into light.**

[![License: MIT](https://img.shields.io/badge/license-MIT-9C7BD9.svg?style=flat-square)](LICENSE)
[![Brand: Eclipse](https://img.shields.io/badge/brand-eclipse-9C7BD9?style=flat-square)](brand/)
[![Predecessor: OPUS](https://img.shields.io/badge/predecessor-OPUS-DCDEE7?style=flat-square)](https://github.com/0pusAI/Opus-Agent-Swarm-LLM-Framework)
[![Website](https://img.shields.io/badge/site-umbrisai.com-9C7BD9.svg?style=flat-square)](https://umbrisai.com)
[![Engine](https://img.shields.io/badge/umbris--core-v1.1-9C7BD9.svg?style=flat-square)](umbris-core/)

</div>

---

## **UMBRIS is not a model. It is a convocation.**

Nine planetary intelligences argue on a shared substrate. Weighted consensus surfaces a candidate vision. Saturnus attempts to falsify it before it ships. The output is a *verified vision* with confidence, cost in USD, and a full provenance trail · not a confident-sounding sentence from a single mind.

UMBRIS extends the lineage that [OPUS](https://github.com/0pusAI/Opus-Agent-Swarm-LLM-Framework) opened. **Where OPUS reads the Llullian tradition, UMBRIS reads the Brunonian extension. Same architectural genealogy. Different philosophical era.** Bruno explicitly extended Llull's wheels with planetary correspondences, hermetic seals, and the doctrine that ideas are shadows only triangulation across many can resolve. UMBRIS reads that extension computationally.

---

## **The premise**

A single language model, however large, reasons in **one voice**. It casts one shadow. It cannot meaningfully disagree with itself, cannot triangulate, cannot be falsified except from outside.

UMBRIS replaces that lonely soliloquy with a **convocation** · a gathering of nine intelligences, each casting its own shadow of a higher idea, the vision surfacing only where their shadows converge. The bet is Brunonian:

> *Ideas are too large to be held by one mind, but their shadows can be triangulated.*

---

## **The two doctrines**

UMBRIS has two written, public, version-controlled doctrines. They live in [`lore/`](lore/) and every architectural decision in this repository is judged against them.

- **[De Compositione Imaginum](lore/compositione/)** · *how* the convocation builds itself. Bruno's 1591 work on the laws by which mnemonic images are arranged so the higher form they shadow becomes legible. UMBRIS reads this as the operating doctrine: every commit is composed by the convocation, not by the architect.
- **[De Triplici Minimo](lore/triplici-minimo/)** · *what for* the convocation exists. Bruno's 1591 work on the three irreducible levels of reality. UMBRIS reads this as the directive: three permanent disciplines (the Ideal Seeker search · the Image search · the Self-Audit), each generating the next.

---

## **The nine planetary agents**

| Role | Planet | Sigil | Essence |
|---|---|---|---|
| Scout | **Mercurius** | ☿ | the messenger, the swift |
| Researcher | **Venus** | ♀ | the gatherer of harmony |
| Critic | **Mars** | ♂ | the challenger |
| Synthesiser | **Sol** | ☉ | the central, the radiant |
| Judge | **Iuppiter** | ♃ | the king, the discerner |
| Verifier | **Saturnus** | ♄ | the elder, the falsifier of confidence |
| Planner | **Luna** | ☽ | the reflective, the path-mapper |
| Executor | **Stella** | ✦ | the fixed star · the executor of the plan |
| Convergence | **Umbra** | ⬤ | the central shadow · the substrate they cast upon |

Seven wandering planets, the eighth sphere of the fixed stars, and the central convergence · the eight orbits and the centre, exactly as Bruno read the heavens.

---

## **Architecture in one glance**

```
                    ┌───────────────────────────────┐
                    │       a question is cast       │
                    └───────────────┬───────────────┘
                                    │
                          (reads previous shadows)
                                    │
       ┌───────────────────────────────────────────────────────┐
       │                                                       │
       ▼                                                       ▼
 ☿ Mercurius scouts                              ☽ Luna scouts (parallel)
       │                                                       │
       └─────────── write Imagines → ─────────┬────────────────┘
                                              │
                                              ▼
                              ┌─────────────────────────────┐
                              │   ⬤  THE UMBRA · substrate   │
                              │  append-only typed shadow-   │
                              │      record (Blackboard)     │
                              └─────────────────────────────┘
                                              │
       ┌──────────────────────────────────────┼──────────────────────┐
       │                                      │                      │
       ▼                                      ▼                      ▼
 ♀ Venus gathers                       ♂ Mars challenges         ☉ Sol synthesises
       │                                      │                      │
       └──────────── write Imagines → ────────┴──────────────────────┘
                                              │
                                              ▼
                                  ┌─────────────────────┐
                                  │   weighted Borda    │
                                  └──────────┬──────────┘
                                              │
                                              ▼
                                ┌──────────────────────────┐
                                │   ♃ Iuppiter adjudicates │
                                └──────────┬───────────────┘
                                              │
                                              ▼
                                ┌──────────────────────────┐
                                │   ♄ Saturnus falsifies   │
                                └──────────┬───────────────┘
                                              │
                          ┌───────────────────┴───────────────────┐
                          │                                       │
                       falsified                              accepted
                          │                                       │
                  re-deliberate                             ✦ Stella executes
                  (bounded · 3)                                   │
                                                                  ▼
                                                       ┌─────────────────────┐
                                                       │   verified vision   │
                                                       │  + confidence + $   │
                                                       │  + provenance trail │
                                                       └─────────────────────┘
```

The agents do not speak to each other. They modify the **Umbra** · an append-only typed shadow-record · and respond to its state. This is the **stigmergic principle**, first observed in termite-mound construction by Grassé in 1959 and formalised for cooperative AI as the Blackboard architecture by Hearsay-II at CMU between 1971 and 1976.

The substrate is the message. The agents are the writers. The convocation is what emerges between them.

---

## **What ships · v1.1**

Everything below is live in this repository today, working, and runnable.

| Artefact | Status | What it is |
|---|---|---|
| **[`packages/umbris-design`](packages/umbris-design/)** | ✅ live | Brand single-source · tokens, fonts, 9 planetary sigils as React SVGs, chrome ornaments, Tailwind theme |
| **[`umbris-core`](umbris-core/)** | ✅ live · v1.1 | The Python convocation engine · Umbra orchestrator · Blackboard substrate · 9 agents · 3-stage consensus · 4 LLM providers · FastAPI server · the Custos daemon · `umbris cast` CLI |
| **[`umbris-studio`](umbris-studio/)** | ✅ live · v1.1 | The desktop application · Tauri + Next.js · the Eclipse Orb at the centre, eight planetary sigils on the orbit, live deliberation HUD |
| **[`umbris-web`](umbris-web/)** | ✅ live · v1.1 | The marketing site at [umbrisai.com](https://umbrisai.com) · 3D Eclipse hero, 11-section homepage, the Live Convocation cinematic, /now revolutions log |
| **[`lore/`](lore/)** | ✅ live | The two doctrines, the manifesto, the planetary codex, the revolutions log |
| **[`docs/`](docs/)** | ✅ live | Whitepaper, architecture deep-dive, lineage essay, quickstart, tokenomics, Custos operator guide |
| **The Custos** | ✅ ships in umbris-core | Autonomous sentinel · runs revolutions on a public cadence, casts patches, gates them through pytest + npm build, commits + pushes to main |
| **`$UMBRIS` token** | 🌑 pre-launch | Solana mint to be deployed. Treasury at [`treasury-log.md`](treasury-log.md). Policy at [`docs/tokenomics.md`](docs/tokenomics.md). |

---

## **Quickstart · cast your first question**

Anyone with a Python 3.11+ environment and an Anthropic API key can run a full UMBRIS convocation in five commands.

```bash
# 1 · Clone
git clone https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture
cd Umbris-AI-LLM-Swarm-Architecture/umbris-core

# 2 · Install (Python 3.11+ required)
python -m venv .venv
# Windows · PowerShell:
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

pip install -e ".[serve]"

# 3 · Configure
cp .env.example .env
# edit .env · paste your ANTHROPIC_API_KEY

# 4 · Cast a question
umbris cast "What are the three strongest arguments against my own thesis that consciousness is computable?"

# 5 · Read the trace
# umbris cast writes a JSONL provenance trail to provenance/<uuid>.jsonl
# every Imago, every Borda rank, every Saturnus attempt · all recorded
```

A typical convocation runs for 20–40 seconds, spends $0.30–$2.00 on the Anthropic API, and returns a verified vision with full provenance. Set `UMBRIS_PROVIDER=mock` in `.env` for a free zero-cost smoke test.

---

## **Use it · the Python API**

```python
import asyncio
from umbris import Umbra, LLMClient, Budget
from umbris.llm.providers import auto_provider

async def main():
    llm = LLMClient(provider=auto_provider())
    umbra = Umbra(
        llm=llm,
        n_scouts=2,         # Mercurius + Luna
        n_researchers=2,    # two Venuses
        n_critics=1,        # Mars
        n_synthesisers=1,   # Sol
    )

    result = await umbra.run(
        "Is consciousness computable?",
        budget=Budget(max_agents=8, max_worker_rounds=2),
    )

    print(result.answer)
    print(f"confidence · {result.confidence:.2f}")
    print(f"accepted by Saturnus · {result.accepted}")
    print(f"provenance · {result.provenance_path}")

asyncio.run(main())
```

For more, see [`umbris-core/examples/`](umbris-core/examples/) · `hello_convocation.py`, `using_openai.py`, `using_ollama.py`, `compositione_demo.py`, `compositione_continuous.py`.

---

## **Run the desktop studio**

The studio is a Tauri desktop app · the Eclipse Orb pulses at the centre, the eight planetary sigils orbit on the ring, the live transcript scrolls beneath. Reuses the engine you just installed.

```bash
cd umbris-studio
npm install
npm run tauri:dev
```

The Tauri sidecar auto-detects `umbris-core/.venv` and boots `umbris serve` against it. The Studio talks to the engine over loopback HTTP + SSE.

---

## **Run the marketing site locally**

The website is a full Next.js 14 app with three live WebGL scenes (the 3D Eclipse hero, the 3D planetary system in §3 The Convocation, the same in §4 Live Convocation), the scripted Live Convocation cinematic, and the auto-counting Ephemeris.

```bash
cd umbris-web
npm install
npm run dev
# open http://localhost:3000
```

Five routes: `/`, `/manifesto`, `/compositione`, `/triplici-minimo`, `/now`.

---

## **The Custos · autonomous sentinel**

The Custos is the daemon that lets the convocation build itself in public. It runs on a cadence, scans the repo for bottlenecks, casts a question to the convocation, applies the resulting verified patch, gates it through pytest + npm build, and commits + pushes to `main`.

**Always start in dry-run mode** so you can see what one revolution produces before you let it write to your repo.

```bash
# Dry-run · see what the convocation would do, change nothing
umbris custos --once --dry-run --repo .

# Live · cast a revolution every 20 minutes, cap at $2/cycle, $30/day
umbris custos --interval 20m --cost-cap-per-cycle 2 --cost-cap-per-day 30

# Monitor the last 10 revolutions
umbris custos-status --repo .
```

Full operator guide at [`docs/custos.md`](docs/custos.md). The Custos is the UMBRIS equivalent of OPUS's Vigilia · same lineage, same safety gates, same public-cadence philosophy.

---

## **Lineage · the long thread**

UMBRIS stands on four traditions:

- **Giordano Bruno** (1548–1600) · *De Umbris Idearum* (1582), *De Compositione Imaginum* (1591), *De Triplici Minimo* (1591) · the doctrine that ideas are shadows, the laws of their composition, and the triple-minimum directive that gives the convocation its reason to exist.
- **Ramon Llull** (c. 1232–1316) · the *Ars Magna* · the first systematic combinatorial method for generating and testing propositions. Bruno extended Llull's wheels; UMBRIS implements them.
- **Hearsay-II** (CMU, 1971–1976) · the original Blackboard architecture for cooperative reasoning. The Umbra is its descendant.
- **Pierre-Paul Grassé** (1959) · the principle of stigmergy · communication through modification of a shared environment, observed first in termite mound construction.

A full lineage essay lives at [`docs/lineage.md`](docs/lineage.md).

---

## **Brand · what it looks and sounds like**

- **Palette (strict):** pure void `#000000` · lunar pearl `#DCDEE7` · stellar silver `#8B90A3` · void grey `#4A4D5C` · cosmic violet `#9C7BD9` (primary accent) · eclipse corona `#FAE6B0` (rare warm flash, verified visions only). No green. No blue. No neon.
- **Typography:** Albertus (display, ritual) · EB Garamond (body, italic-friendly) · Berkeley Mono (status, hashes, costs).
- **Sigils:** the nine planetary glyphs ☿ ♀ ♂ ☉ ♃ ♄ ☽ ✦ ⬤ rendered in fine 1px stroke.
- **The brand mark:** the **Closed Eclipse** · a pure black umbra ringed by a cosmic-violet corona with a diamond-ring flash at one o'clock. Self-referential. The disc is the convocation. The corona is the substrate. The flash is the moment a verified vision passes Saturnus.
- **Voice:** Brunonian, mythic-but-precise. Renaissance hermeticism rendered in computational chrome. *Ex umbris in lumen · De Umbris Idearum · Visio · Custos · Imago*. No em dashes (the brand uses `·` as separator). Restrained · the convocation does not shout.
- **Wordmark:** `UMBRIS` in Albertus, with a cosmic-violet halo and a rare eclipse-corona warm rim.

The full design system lives at [`packages/umbris-design`](packages/umbris-design/) · npm-installable, ready to import into any project.

---

## **The architect**

The human at the keyboard. Stated role:

> *They do not propose features. They cast questions, the convocation deliberates, and the vision is transcribed.*

This is not a metaphor · every revolution in [`lore/revolutions/`](lore/revolutions/) carries the question that was cast, the imagines the convocation considered, the vision that surfaced, and the falsification Saturnus attempted. The git history is the convocation's ephemeris. The lore is its reasoning.

---

## **The token · $UMBRIS**

Solana mint, to be deployed at launch. Public treasury at [`treasury-log.md`](treasury-log.md). Tokenomics policy at [`docs/tokenomics.md`](docs/tokenomics.md) · creator royalties feed a public treasury spent only on compute, models, and infrastructure.

**Utility:** holding $UMBRIS unlocks the full UMBRIS Studio software key · the features that let you compose and run your own convocation to its fullest. Holders may stake into the convocation's ecosystem and receive a 1× return of yield while their tokens fund compute.

The loop is closed and visible · tokens fund compute, compute makes the convocation more luminous, the convocation makes the instrument more valuable to the people who hold it. **Both grow together, or neither grows.**

---

## **Status · v1.1**

What v1.1 ships (this release):

- The full Python convocation engine
- The Tauri desktop studio with the Eclipse Orb
- The marketing site with three live WebGL scenes
- The two doctrines + manifesto + planetary codex + revolutions log
- The Custos daemon (create-only patches)
- The design system as a published workspace

What v1.2 adds:

- $UMBRIS Solana mint + treasury wiring
- The Custos graduates from create-only to full-file-edit
- Hosted API at `api.umbrisai.com`
- Cross-platform signed Studio installers (Windows .msi, macOS .dmg, Linux .AppImage)
- Native UMBRIS Eclipse icon set replacing the placeholder Tauri icons
- Vector + graph memory backends wired (currently stubbed)

The full changelog lives at [`CHANGELOG.md`](CHANGELOG.md).

---

## **Contributing**

The contribution model follows the doctrine: do not write features, **cast questions**. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full process. If your question is well-posed, your name appears in the revolution that adopted its verdict.

---

## **License**

[MIT](LICENSE). The work is yours.

---

<div align="center">

**Ex umbris in lumen.**

*From shadows into light. Slowly, but in public.*

[the doctrine of how](lore/compositione/) &nbsp;·&nbsp;
[the doctrine of why](lore/triplici-minimo/) &nbsp;·&nbsp;
[the lineage UMBRIS extends · OPUS](https://github.com/0pusAI/Opus-Agent-Swarm-LLM-Framework)

*Magnum Opus · MMXXVI*

</div>
