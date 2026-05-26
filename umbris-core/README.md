# umbris-core

The Python convocation engine for UMBRIS.

<div align="center">

**Official $UMBRIS CA (Solana)**

`coming-soon`

</div>

---

Where OPUS reads the Llullian tradition, UMBRIS reads the Brunonian extension. Same architectural genealogy. Different philosophical era.

**New here?** Start with the [**Quickstart**](../docs/quickstart.md) · zero to a running convocation in under five minutes, Windows / macOS / Linux.

For the architecture and motivation, see the [whitepaper](../docs/whitepaper.md). For the engineering reference, see [architecture.md](../docs/architecture.md). For the lineage, see [lineage.md](../docs/lineage.md).

---

## Install

Requires Python 3.11+. The recommended package manager is [`uv`](https://docs.astral.sh/uv/).

```bash
cd umbris-core
cp .env.example .env       # paste your ANTHROPIC_API_KEY
pip install -e ".[serve,dev]"
```

## Run

### CLI · one cast, one vision

```bash
umbris cast "What are three strong arguments against my own thesis?"
```

`umbris query` is accepted as an alias for compatibility with the OPUS register.

The convocation returns three things at end of run:

- the vision
- the cost in USD
- the path to the full provenance trace (`provenance/<query_uuid>.jsonl`)

### Local Web UI · one command, your own convocation in the browser

```bash
pip install -e ".[serve]"        # one-time, adds fastapi+uvicorn
umbris serve                     # boots http://127.0.0.1:8000
```

A single command boots a local FastAPI server with the UMBRIS web UI on `localhost`. Pose questions, watch the convocation deliberate live (server-sent events stream every Record as it's written to the Blackboard), see the vision + cost + provenance. Anyone with a terminal can run their own convocation · no API gate, no marketing form, no rate limit.

```bash
umbris serve --provider ollama          # local model, $0/cast
umbris serve --provider openai          # OpenAI / o-series
umbris serve --port 9000 --no-browser   # custom port, headless
```

### Library · embed it in your own code

```python
from umbris import Umbra, LLMClient, Budget

llm = LLMClient()  # uses Anthropic by default
umbra = Umbra(llm=llm)
result = await umbra.run(
    "What is the cleanest refactor for this module?",
    budget=Budget(max_total_usd=0.50),
)
print(result.answer)
print(f"${result.summary.total_cost_usd:.4f}")
```

### Pick your LLM backend (Anthropic / OpenAI / Ollama / anything)

```python
from umbris import LLMClient, OpenAIProvider, OllamaProvider, auto_provider

llm = LLMClient(provider=OpenAIProvider())     # GPT-4o / o1 / o3 / etc.
llm = LLMClient(provider=OllamaProvider())     # local, free, private
llm = LLMClient(provider=auto_provider())      # auto-detect from env
```

All four providers (Anthropic, OpenAI, Ollama, Mock for tests) expose the same `LLMProvider` interface · your Umbra / planet / consensus code never has to branch on backend. Per-role default models come from each provider automatically; runnable demos at [`examples/using_openai.py`](examples/using_openai.py) and [`examples/using_ollama.py`](examples/using_ollama.py).

### Compositione · let the convocation work on a goal autonomously

The same pattern UMBRIS uses to ship its own updates. Hand the convocation a goal; it deliberates, implements, verifies, and hands each verified step to your callback.

```python
from umbris import Umbra, LLMClient, CompositioneLoop

llm   = LLMClient()
umbra = Umbra(llm=llm)
loop  = CompositioneLoop(hive=umbra, goal="Grow and document this repository.")

async def apply(step):
    print(f"[{step.iteration}] {step.plan_answer[:80]}  (${step.total_cost_usd:.4f})")
    # ... open a PR, write to a file, anything ...

await loop.run(max_iterations=5, commit_handler=apply)
```

Full runnable demo: [`examples/compositione_demo.py`](examples/compositione_demo.py).

## Test

```bash
pytest
```

**84 tests pass** · Blackboard (5), Consensus (8), Umbra (5), Introspection (27), Providers (32), Server (7). Run in under 4 seconds. All use isolated fixtures, `httpx.MockTransport`, or `httpx.ASGITransport`; no network, no API key required.

## Layout

```
src/umbris/
├── __init__.py        ·· public API
├── umbra.py           ·· orchestrator (the Umbra Core)
├── compositione.py    ·· the autonomous deliberation loop
├── introspection.py   ·· repo scanner + bottleneck surfacer
├── blackboard.py      ·· append-only Record store (the Umbra substrate)
├── consensus.py       ·· borda · iuppiter · saturnus
├── provenance.py      ·· cost ledger + DAG serialisation
├── agents/            ·· one file per planet (nine roles)
│   ├── mercurius.py
│   ├── venus.py
│   ├── mars.py
│   ├── sol.py
│   ├── iuppiter.py
│   ├── saturnus.py
│   ├── luna.py
│   └── stella.py
├── memory/            ·· vector + graph wrappers (stubs in v1.1)
├── llm/
│   ├── client.py       ·· LLMClient · façade with budget tracking
│   └── providers/      ·· multi-backend abstraction
│       ├── base.py     ·· LLMProvider protocol + types
│       ├── anthropic.py ·· Claude (Opus 4.7, Sonnet 4.6, Haiku 4.5)
│       ├── openai.py   ·· GPT-4o / o1 / + OpenAI-compatible gateways
│       ├── ollama.py   ·· local LLM, free, private, no key required
│       └── mock.py     ·· deterministic mock for tests
├── server/            ·· local web UI + HTTP API (one-command serve)
│   ├── app.py          ·· FastAPI app, SSE streaming, /cast, /status
│   └── ui.py           ·· single-file inline web UI
├── daemon/            ·· Custos · the autonomous sentinel
└── cli.py             ·· `umbris cast "..."`, `umbris serve`

examples/
├── hello_convocation.py        ·· smallest one-cast example (Anthropic)
├── compositione_demo.py        ·· the autonomous loop, end-to-end
├── compositione_continuous.py  ·· continuous scan → surface → loop pipeline
├── using_openai.py             ·· same convocation, on OpenAI
└── using_ollama.py             ·· same convocation, on local Ollama (free)
```

See [`../docs/architecture.md`](../docs/architecture.md) for the file-by-file walk-through and [`../docs/lineage.md`](../docs/lineage.md) for how UMBRIS relates to OPUS.
