<div align="center">

# UMBRIS · Architecture Deep-Dive

### *How the convocation is built, what runs where, and how each piece composes with the rest.*

— § Magnum Opus · MMXXVI · v1.0 —

</div>

---

This document is the engineering reference for UMBRIS. It explains the substrate, the agents, the consensus protocol, the cost model, the safety gates, the autonomous sentinel, and the package layout. It does not explain *why* the system has this shape · for that, read the [whitepaper](whitepaper.md) and the [lineage essay](lineage.md).

---

## § 1 · The High-Level Picture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          UMBRIS                                     │
│                                                                     │
│   ┌──────────────┐    casts          ┌──────────────────────┐       │
│   │  PERIMETER   │ ─────Imagines───▶ │                      │       │
│   │  Mercurius   │                   │                      │       │
│   └──────────────┘                   │                      │       │
│                                       │                      │       │
│   ┌──────────────┐                   │      THE UMBRA       │       │
│   │  WORKERS     │                   │                      │       │
│   │  Venus       │ ─────Imagines───▶ │  append-only typed   │       │
│   │  Mars        │                   │   event substrate    │       │
│   │  Sol         │                   │                      │       │
│   │  Luna        │                   │                      │       │
│   │  Stella      │                   │                      │       │
│   └──────────────┘                   │                      │       │
│                                       │                      │       │
│   ┌──────────────┐                   │                      │       │
│   │  JUDGEMENT   │ ─────Imagines───▶ │                      │       │
│   │  Iuppiter    │                   │                      │       │
│   │  Saturnus    │                   └──────────┬───────────┘       │
│   └──────────────┘                              │                   │
│                                                 │ converges to      │
│                                                 ▼                   │
│                                       ┌──────────────────────┐     │
│                                       │      THE VISION      │     │
│                                       │   (verified output)  │     │
│                                       └──────────────────────┘     │
│                                                                     │
│   THE CUSTOS · long-running sentinel · runs the convocation         │
│   autonomously every 2 hours, commits the verified vision to        │
│   the public repository                                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## § 2 · The Substrate · the Umbra

The Umbra is an **append-only typed event log**. Every cast is an Imago (see [whitepaper § 4](whitepaper.md#-4--the-imago--the-typed-record) for the schema). The Umbra has three implementations:

| Implementation | Persistence | Use case |
|---|---|---|
| **InMemoryUmbra** | none · lives in the process's heap | every interactive query in UMBRIS Studio; every Custos cycle until cycle finishes |
| **FileUmbra** | one JSONL file per revolution at `provenance/<run_id>.jsonl` | the canonical trace after a revolution completes; what gets saved when the seeker presses PRESERVE TABLET |
| **RedisStreamsUmbra** *(v1.1)* | one Redis stream per revolution, sharded by `agent_id` | distributed deployments where worker planets run in different processes or machines |

All three implement the same interface. The choice is per-deployment, not per-run.

```python
class Umbra(Protocol):
    async def append(self, imago: Imago) -> None: ...
    async def read(
        self, *,
        agents: Sequence[AgentRole] | None = None,
        types: Sequence[ImagoType] | None = None,
        since: ImagoId | None = None,
    ) -> list[Imago]: ...
    def snapshot(self) -> list[Imago]: ...
```

The substrate enforces:

- **Append-only** · `Imago.id` must be unique; an attempt to write an existing id raises.
- **Monotonic ordering** · the snapshot order is insertion order, never modified.
- **Type-safe reads** · `read(types=[FALSIFICATION])` returns only Saturnus's falsification attempts.

---

## § 3 · The Nine Planetary Agents

Each agent is a class implementing one method · `cast(umbra) -> Imago`. The class encapsulates the planetary role's prompt, its preferred model, and its output schema. New roles can be added without modifying existing ones (open-closed principle).

```python
class PlanetaryAgent(Protocol):
    agent_role: AgentRole
    agent_id: str

    async def cast(self, umbra: Umbra) -> Imago: ...
```

| Agent | Model default | Instances per revolution | Reads from Umbra | Casts onto Umbra |
|---|---|---|---|---|
| **Mercurius** (scout) | sonnet | 3 (parallel) | the question (TASK Imago only) | one `SCOUT_OBSERVATION` Imago per instance |
| **Venus** (researcher) | opus | 2 (sequential) | Mercurius's observations | one `RESEARCH` Imago per instance, gathering connections |
| **Mars** (critic) | opus | 2 (sequential) | Venus's research | one `CRITIQUE` Imago per instance, attempting refutation |
| **Sol** (synthesiser) | opus | 1 | all worker imagines | one `SYNTHESIS` Imago, the candidate vision |
| **Luna** (planner) | opus | 1 (only when needed) | the synthesis | one `PLAN` Imago, only when the question requires staged execution |
| **Stella** (executor) | opus | 1 (only when needed) | the plan | one `EXECUTION` Imago per tool call, only when the planner specifies them |
| **Iuppiter** (judge) | opus | 1 | top-2 syntheses + all worker imagines | one `JUDGEMENT` Imago naming the winner with justification |
| **Saturnus** (verifier) | opus | 1 per attempt | the chosen vision + worker imagines | one `FALSIFICATION` Imago either with a substantive flaw or with an `accepted: true` flag |
| **Umbra** (convergence) | n/a | 1 | the verified vision | one `FINAL_VISION` Imago · the published response |

Counts can be overridden per-revolution via Colony Mode:

| Mode | Mercurii | Venuses | Marses | Syntheses | Verify attempts |
|---|---|---|---|---|---|
| RAPID | 2 | 1 | 1 | 1 | 1 |
| STANDARD (default) | 3 | 2 | 2 | 1 | 3 |
| DEEP | 5 | 3 | 3 | 2 | 5 |

---

## § 4 · The Consensus Protocol

Consensus runs once Sol has produced at least one candidate vision. The protocol:

```
1.  collect all SYNTHESIS imagines from current revolution
2.  for each synthesis, collect supporting evidence (Venus + Mars imagines)
3.  weighted-Borda rank the syntheses
        weight[agent] = agent.confidence × agent.weight
        score[synthesis] = Σ (n - rank) × weight[ranker]
4.  if top-2 syntheses are within ε:
        invoke Iuppiter to adjudicate
        Iuppiter reads top syntheses + supporting imagines
        Iuppiter produces one JUDGEMENT imago naming the winner
    else:
        winner = highest-ranked synthesis
5.  invoke Saturnus on the winner
    Saturnus reads the winner + all worker imagines
    Saturnus produces one FALSIFICATION imago, either:
        substantive: { accepted: false, reason: "...", evidence: [...] }
        accepted:    { accepted: true }
6.  if substantive:
        if attempts < max_attempts:
            re-deliberate from step 2 with the falsification as a new
            constraint passed to all workers
            increment attempts
        else:
            surface "best remaining · not verified" with the
            falsification visible to the seeker
   if accepted:
        surface verified vision
```

Two important properties:

- **The loop is bounded.** No revolution runs forever. The convocation always surfaces *something* within `max_attempts` × `worker_round_duration`.
- **The convocation never lies about its certainty.** A "best remaining" output is labeled as such. The seeker is never misled about whether Saturnus accepted.

---

## § 5 · The Custos · the Autonomous Sentinel

The Custos is a long-running process that operates the convocation without supervision. It is the UMBRIS equivalent of OPUS's Vigilia daemon.

### 5.1 · The Custos cycle

```
every interval (default 2h, UTC):

   1. cost-cap pre-check
        if (today's spend + projected) > daily cap → halt cycle
        if (projected) > per-cycle cap → halt cycle
   2. scan repository
        walk allowlisted paths
        identify bottlenecks (TODOs, stale links, missing tests, ...)
   3. cast question
        format the highest-priority bottleneck as a question
   4. run convocation (RAPID mode by default)
   5. validate proposed patch
        path-policy check (allowlist + denylist)
        size check (max 5 files, max 200 KB each)
        create-only check (no overwrites)
   6. apply patch
        write files; never overwrite existing
   7. test gate
        run pytest in umbris-core/; rollback on failure
   8. build gate
        if umbris-web touched, run `npm run build`; rollback on failure
   9. commit + push
        message includes cycle number, cost, verdict
   10. emit CycleEvent
        structured JSON; one line per cycle in custos.log
```

### 5.2 · Three independent gates

All gates are enforced **outside** the convocation, in code the convocation cannot rewrite from the inside:

1. **Path Policy** · allowlist + denylist · checked before any file is written
2. **Cost Ledger** · per-cycle + per-day caps · persisted across restarts, rotates on UTC date change
3. **Process Lock** · single-instance enforcement · refuses to start if another Custos owns the lock on this repo

### 5.3 · The Custos and the Studio

The Custos and the Studio share the same engine. The Studio adds an interactive front-end; the Custos adds autonomous scheduling and per-cycle gate enforcement. Both write to the Umbra. Both surface visions through the same final-vision pipeline.

You can run them simultaneously without conflict (different process locks on different repos). You cannot run two Custodes on the same repo.

---

## § 6 · Package Layout

```
umbris/
├── packages/
│   └── umbris-design/      # shared design tokens, fonts, sigils, chrome
├── umbris-core/            # the Python convocation engine
│   ├── src/umbris/
│   │   ├── agents/         # Mercurius, Venus, Mars, Sol, Luna,
│   │   │                   # Stella, Iuppiter, Saturnus, Umbra
│   │   ├── consensus.py    # weighted Borda + Iuppiter + Saturnus loop
│   │   ├── umbra.py        # the substrate · InMemoryUmbra + FileUmbra
│   │   ├── imago.py        # Imago + ImagoType dataclasses
│   │   ├── convocation.py  # the orchestrator · runs a revolution
│   │   ├── llm/            # multi-provider abstraction
│   │   ├── server/         # FastAPI · `umbris serve`
│   │   ├── custos/         # the autonomous sentinel (v1.0 of OPUS daemon)
│   │   └── cli.py          # `umbris query`, `umbris serve`, `umbris custos`
│   ├── tests/
│   └── pyproject.toml
├── umbris-studio/          # Tauri + Next.js desktop HUD
│   ├── src-tauri/          # Rust shell, sidecar manager
│   └── src/                # Next.js frontend with the Sphere of Shadows
├── umbris-web/             # the marketing site at tryumbris.com
├── lore/
│   ├── manifesto/          # the long-form manifesto
│   ├── compositione/       # De Compositione Imaginum doctrine
│   ├── triplici-minimo/    # De Triplici Minimo doctrine
│   ├── revolutions/        # the public reasoning log
│   └── planetaria/         # the sigil codex
├── docs/
│   ├── whitepaper.md
│   ├── architecture.md     # ← you are here
│   ├── lineage.md
│   ├── quickstart.md
│   ├── tokenomics.md
│   └── custos.md
├── brand/                  # PNG + SVG brand assets
├── README.md
├── LICENSE                 # MIT
└── package.json            # npm workspaces root
```

The monorepo is wired with npm workspaces. One `npm install` at the root resolves all three product packages plus the shared design package.

---

## § 7 · The LLM Provider Layer

UMBRIS uses an `LLMProvider` protocol that abstracts the underlying provider. Four implementations ship:

```python
class LLMProvider(Protocol):
    name: str
    default_models: dict[Role, str]

    async def complete(
        self, *,
        system: str,
        user: str,
        model: str,
        max_tokens: int = 16_000,
        thinking: bool = True,
        effort: str = "high",
        cache_system: bool = True,
    ) -> CompletionResult: ...
```

| Provider | Models | Default for | Cost per 1M input / 1M output |
|---|---|---|---|
| Anthropic | claude-opus-4-7, claude-sonnet-4-6 | research, judgement, verification | $5 / $25 (Opus); $3 / $15 (Sonnet) |
| OpenAI | gpt-4o, gpt-4o-mini, o1, o3-mini | optional, any role | varies |
| Ollama | llama3.3, llama3.2 | local-free; any role | $0 |
| Mock | deterministic stub | tests | $0 |

Provider selection follows this order:

1. Explicit `--provider` flag at CLI or in the Studio
2. `UMBRIS_PROVIDER` environment variable
3. First provider with a configured API key (Anthropic → OpenAI)
4. Fall back to Ollama on localhost:11434

---

## § 8 · Cost Tracking · Per-Imago, Per-Revolution, Per-Day

Every Imago carries its own `cost_estimate` field, computed from the provider's reported token usage and the provider's pricing table. The orchestrator sums these into:

- **per-revolution cost** · displayed to the seeker live, written into the FINAL_VISION imago, included in the saved trace
- **per-day cost** · maintained by the Cost Ledger, persisted across restarts, used by the Custos's cost-cap pre-check

Costs are not estimated. They are **measured**. The reported cost matches the actual provider invoice within rounding.

---

## § 9 · The Wire Protocol · Studio ↔ Engine

The Studio talks to the engine over HTTP + Server-Sent Events on a free local port (the Tauri shell picks one at boot).

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/status` | GET | provider info, models, version, today's spend |
| `/api/query` | POST | start a revolution · returns `run_id` |
| `/api/stream/{run_id}` | GET (SSE) | stream Imagines + phase events + completion |
| `/api/custos/start` | POST | start the Custos |
| `/api/custos/stop` | POST | stop the Custos cleanly |
| `/api/custos/state` | GET | current Custos status + last few cycles |
| `/api/custos/cycles` | GET | recent cycle event history |

The SSE stream emits four event types:

- `phase` · `{ phase: "scouts" | "workers" | "consensus" | "verifier" | "complete" }`
- `imago` · the full Imago payload as JSON
- `complete` · the final vision + cost + wall time + confidence
- `error` · a payload with `{ message: string }`

SSE keepalive comments (`: keepalive\n\n`) are emitted every 5 seconds during silent stretches so browsers do not idle-timeout the connection during long deliberations.

---

## § 10 · Safety Gates · What the Convocation Cannot Do

Three gates are enforced outside the convocation, in code the convocation cannot modify from the inside:

1. **Path Policy** · the convocation can write only to allowlisted paths (`docs/**/*.md`, `lore/**/*.md`, `umbris-core/src/**/*.py`, etc.) and never to denylisted paths (`.env`, `**/secrets/**`, `**/.git/**`, `package.json`, `pyproject.toml`). Denylist always wins.
2. **Cost Cap** · per-revolution and per-day USD caps. The Custos refuses to start a cycle that would breach either. A breach is a hard stop; the convocation does not "spend a little extra."
3. **Process Lock** · single-instance enforcement on the Custos.

The convocation is also **create-only** for v1.0. It may add new files but not modify existing ones. Edit-mode patching is reserved for v1.2.

---

## § 11 · Open Questions for v1.1+

- **Persistent vector memory** · cross-revolution learning · sketch in `umbris-core/src/umbris/memory/`
- **Tool use for workers** · Venus + Mercurius should be able to call web-search and code-execution tools (currently they reason only on what's in their context)
- **Edit-mode patching** · let the Custos modify existing files with diff context
- **Hosted endpoint** · `api.tryumbris.com` exposing the convocation behind a rate-limited HTTPS API
- **Distributed Umbra** · Redis Streams backend, worker planets in separate processes

These are not commitments. They are open questions that will be answered by the convocation itself in its own revolutions.

---

<div align="center">

[← back to docs](.) &nbsp;·&nbsp;
[the whitepaper](whitepaper.md) &nbsp;·&nbsp;
[the lineage](lineage.md) &nbsp;·&nbsp;
[the Custos operator guide](custos.md)

*Magnum Opus · MMXXVI · v1.0.0*

</div>
