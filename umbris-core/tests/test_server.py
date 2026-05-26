"""Tests for umbris.server · the local web UI + HTTP API.

Uses the MockProvider so no API key is required. Exercises the FastAPI
app directly via httpx.AsyncClient + ASGITransport, no live network.
"""

from __future__ import annotations

import json
from typing import Any

import httpx
import pytest

# FastAPI is an optional `[serve]` extra · skip the whole module
# cleanly if it isn't installed in the current env.
pytest.importorskip("fastapi")

from umbris.llm.client import LLMClient
from umbris.llm.providers import MockProvider
from umbris.server import create_app


# A canned mock response shaped like what the planets expect to parse.
_AGENT_JSON_RESPONSE = json.dumps({
    "content": "A short verdict from the mock convocation.",
    "confidence": 0.8,
})


@pytest.fixture
def mock_llm() -> LLMClient:
    """Build an LLMClient backed by a fully-deterministic MockProvider."""
    # Same response shape for every planet so the Umbra can parse, vote,
    # and verify without hitting any real API.
    return LLMClient(provider=MockProvider(
        responses=[_AGENT_JSON_RESPONSE],
        input_tokens_per_call=10,
        output_tokens_per_call=20,
    ))


@pytest.fixture
def client(mock_llm: LLMClient) -> httpx.AsyncClient:
    """A test client wired to the FastAPI app, no real network."""
    app = create_app(
        mock_llm,
        # Smallest possible Umbra so tests stay fast.
        hive_kwargs={
            "n_scouts": 1,
            "n_researchers": 1,
            "n_critics": 1,
            "n_synthesisers": 1,
        },
        poll_interval_seconds=0.02,
    )
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://test")


# ──────────────────────────────────────────────────────────────────
# GET /  · the UI page
# ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_index_returns_html(client: httpx.AsyncClient):
    async with client:
        resp = await client.get("/")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/html")
    body = resp.text
    # Brand + structure must be present.
    assert "UMBRIS" in body
    assert "Your Local Convocation" in body
    assert 'id="compose"' in body
    assert "/api/query" in body
    assert "/api/stream/" in body


# ──────────────────────────────────────────────────────────────────
# GET /api/status · reports active provider + models
# ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_status_reports_provider_and_models(client: httpx.AsyncClient):
    async with client:
        resp = await client.get("/api/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["provider"] == "mock"
    assert data["models"]["worker"] == "mock-worker"
    assert data["models"]["scout"] == "mock-scout"
    assert data["models"]["judge"] == "mock-judge"
    assert data["models"]["verifier"] == "mock-verifier"
    assert data["version"] == "1.1.0"
    assert isinstance(data["spent_usd"], (int, float))


# ──────────────────────────────────────────────────────────────────
# POST /api/query · accepts a query, returns a run_id
# ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_query_returns_run_id(client: httpx.AsyncClient):
    async with client:
        resp = await client.post("/api/query", json={"query": "What is 2+2?"})
    assert resp.status_code == 200
    data = resp.json()
    assert "run_id" in data
    assert isinstance(data["run_id"], str)
    assert len(data["run_id"]) >= 8


@pytest.mark.asyncio
async def test_query_rejects_empty_string(client: httpx.AsyncClient):
    async with client:
        resp = await client.post("/api/query", json={"query": ""})
    assert resp.status_code == 422  # pydantic validation


@pytest.mark.asyncio
async def test_query_rejects_oversize(client: httpx.AsyncClient):
    big = "x" * 5000
    async with client:
        resp = await client.post("/api/query", json={"query": big})
    assert resp.status_code == 422


# ──────────────────────────────────────────────────────────────────
# GET /api/stream/{run_id} · full end-to-end SSE flow
# ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_stream_unknown_run_returns_404(client: httpx.AsyncClient):
    async with client:
        resp = await client.get("/api/stream/does-not-exist")
    assert resp.status_code == 404


def _parse_sse(text: str) -> list[dict[str, Any]]:
    """Split a raw SSE response body into [(event, json-payload), ...]."""
    events: list[dict[str, Any]] = []
    current_event: str | None = None
    for line in text.splitlines():
        if line.startswith("event: "):
            current_event = line.removeprefix("event: ").strip()
        elif line.startswith("data: "):
            payload = json.loads(line.removeprefix("data: "))
            events.append({"event": current_event or "message", "data": payload})
            current_event = None
    return events


@pytest.mark.asyncio
async def test_stream_emits_phase_records_and_complete(client: httpx.AsyncClient):
    """End-to-end: post a query, follow the SSE stream, get a complete event."""
    async with client:
        post = await client.post("/api/query", json={"query": "Mock question."})
        run_id = post.json()["run_id"]

        # Read the stream until the 'complete' event arrives.
        body_chunks: list[str] = []
        async with client.stream(
            "GET", f"/api/stream/{run_id}", timeout=20.0,
        ) as r:
            assert r.status_code == 200
            assert r.headers["content-type"].startswith("text/event-stream")
            async for chunk in r.aiter_text():
                body_chunks.append(chunk)
                if "event: complete" in "".join(body_chunks):
                    break

    body = "".join(body_chunks)
    events = _parse_sse(body)
    kinds = [e["event"] for e in events]

    # We expect at minimum: an opening phase event, several records,
    # and a final complete event.
    assert "phase" in kinds
    assert "complete" in kinds
    assert kinds.count("record") >= 1  # at least one record streamed

    complete = next(e for e in events if e["event"] == "complete")
    assert "answer" in complete["data"]
    assert "cost_usd" in complete["data"]
    assert "wall_seconds" in complete["data"]
    assert complete["data"]["provider"] == "mock"
