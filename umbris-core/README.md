# `umbris-core` · the Python convocation engine

The reference implementation of the UMBRIS convocation. Multi-provider LLM swarm, nine planetary agents, three-stage consensus, autonomous Custos sentinel.

This package is the engineering heart of UMBRIS. The Studio and the website are clients of this engine.

## Status

**v1.0.0 · scaffolded.** Full implementation is the v1.1 work item · this package currently ships the public API surface, the Imago + Umbra dataclasses, and the agent base classes. The orchestration loop, consensus protocol, and Custos sentinel are wired-and-tested as inherited from `opus-core`, with planetary role names substituted via `UMBRIS_TO_OPUS_ROLE` in [`@umbris/design`](../packages/umbris-design/).

For the full v1.0 engine surface today, see the sibling [`opus-core`](https://github.com/0pusAI/Opus-Agent-Swarm-LLM-Framework/tree/main/opus-core).

## Layout

```
src/umbris/
├── __init__.py
├── cli.py              # `umbris query / serve / custos / custos-status / custos-reset`
├── convocation.py      # one revolution end-to-end
├── consensus.py        # weighted Borda + Iuppiter adjudication + Saturnus loop
├── imago.py            # Imago + ImagoType + ImagoId dataclasses
├── umbra.py            # InMemoryUmbra + FileUmbra
├── agents/
│   ├── mercurius.py
│   ├── venus.py
│   ├── mars.py
│   ├── sol.py
│   ├── luna.py
│   ├── stella.py
│   ├── iuppiter.py
│   ├── saturnus.py
│   └── umbra.py
├── llm/
│   ├── client.py
│   └── providers/      # Anthropic, OpenAI, Ollama, Mock
├── server/             # FastAPI app for `umbris serve` + Studio sidecar
└── custos/             # the autonomous sentinel
```

## Install (development)

```bash
cd umbris-core
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -e ".[dev,serve]"
```

Then:

```bash
umbris query "In one sentence, what is stigmergy?"
umbris serve
umbris custos --dry-run --once
```

## Tests

```bash
pytest
```

(Test suite ships once the full engine implementation lands · v1.1.)

## Reference

Architecture deep-dive: [`../docs/architecture.md`](../docs/architecture.md)
Sibling implementation: [opus-core](https://github.com/0pusAI/Opus-Agent-Swarm-LLM-Framework/tree/main/opus-core) · 129/129 tests passing
