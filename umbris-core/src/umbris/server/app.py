"""
umbris.server.app · the FastAPI app that powers `umbris serve`.

Endpoints
---------

  GET  /                       · single-page web UI (inline HTML)
  GET  /api/status             · { provider, version, models }
  POST /api/query              · start a deliberation, returns { run_id }
  GET  /api/stream/{run_id}    · SSE: 'phase' / 'record' / 'complete' events

Architecture
------------

A single in-memory ``_RunRegistry`` holds active deliberations. Each
``POST /api/query`` kicks off a background ``asyncio.Task`` that runs the
Umbra against a fresh Blackboard, while a poller pushes new Records into
the run's SSE queue every 150ms. When the Umbra finishes, a terminal
``complete`` event ships the verdict, total cost, and wall time.

The whole thing is single-process and small enough to be read in one
sitting. Tested against a MockProvider with FastAPI's TestClient so
the entire flow exercises offline.
"""

from __future__ import annotations

import asyncio
import json
import time
import uuid
import webbrowser
from dataclasses import dataclass, field
from typing import Any

from ..agents.base import Budget
from ..blackboard import InMemoryBlackboard, Record, RecordType
from ..umbra import Umbra
from ..llm.client import LLMClient
from .ui import INDEX_HTML

# Imports we only use when running the server; FastAPI is an optional
# `[serve]` extra so we want a clear error if it isn't installed.
try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
    from pydantic import BaseModel, Field
except ImportError as e:  # pragma: no cover · import-time guard
    raise ImportError(
        "umbris.server requires the [serve] extra. Install with:\n"
        "    pip install -e \".[serve]\"\n"
        "or:\n"
        "    pip install fastapi uvicorn"
    ) from e


# ──────────────────────────────────────────────────────────────────
# In-memory run registry · one deliberation = one entry
# ──────────────────────────────────────────────────────────────────


@dataclass
class _Run:
    """Live state for one in-flight or just-completed deliberation."""

    run_id: str
    query: str
    started_at: float
    blackboard: InMemoryBlackboard
    queue: asyncio.Queue
    task: asyncio.Task | None = None
    seen_count: int = 0
    poll_task: asyncio.Task | None = None
    completed: bool = False


@dataclass
class _RunRegistry:
    runs: dict[str, _Run] = field(default_factory=dict)

    def add(self, run: _Run) -> None:
        self.runs[run.run_id] = run

    def get(self, run_id: str) -> _Run | None:
        return self.runs.get(run_id)


# ──────────────────────────────────────────────────────────────────
# Request / response shapes
# ──────────────────────────────────────────────────────────────────


class QueryBody(BaseModel):
    query: str = Field(..., min_length=1, max_length=4000)
    budget_usd: float | None = None
    # Optional richer inputs from UMBRIS Studio. Backward compatible:
    # if absent, the Umbra uses its defaults.
    constraints: str | None = None
    colony_mode: str | None = None        # 'STANDARD' | 'DEEP' | 'RAPID'
    research_depth: int | None = None     # 1..=5
    time_cap_hours: float | None = None
    sources_lock: bool | None = None
    preset_id: str | None = None


class QueryAccepted(BaseModel):
    run_id: str


# Custos control bodies
class DaemonStartBody(BaseModel):
    interval: str = "2h"
    cost_cap_per_cycle_usd: float = 5.0
    cost_cap_per_day_usd: float = 50.0
    commit_and_push: bool = False
    run_tests: bool = True
    run_build_when_web_touched: bool = True
    repo_root: str | None = None    # defaults to current working dir


# ──────────────────────────────────────────────────────────────────
# SSE serialisation helpers
# ──────────────────────────────────────────────────────────────────


def _sse_event(event: str, payload: dict[str, Any]) -> str:
    """Format one Server-Sent Event."""
    return f"event: {event}\ndata: {json.dumps(payload, default=str)}\n\n"


def _record_to_payload(r: Record, *, running_cost_usd: float) -> dict[str, Any]:
    """Project a Record into a JSON-safe dict for the client."""
    return {
        "id": str(r.id),
        "agent_id": r.agent_id,
        "agent_role": r.agent_role.value,
        "type": r.type.value,
        "content": r.content,
        "confidence": r.confidence,
        "model": r.model,
        "cost_estimate": r.cost_estimate,
        "timestamp": r.timestamp.isoformat() if r.timestamp else None,
        "running_cost_usd": running_cost_usd,
    }


# ──────────────────────────────────────────────────────────────────
# The app factory
# ──────────────────────────────────────────────────────────────────


def create_app(
    llm: LLMClient,
    *,
    hive_kwargs: dict[str, Any] | None = None,
    poll_interval_seconds: float = 0.15,
) -> FastAPI:
    """Build the FastAPI app. Pass a pre-configured LLMClient · the app
    reuses it across requests so the budget tracking stays coherent.

    ``hive_kwargs`` is passed through to ``Umbra(...)`` so callers can
    tune planet counts, rounds, etc. Defaults to the Umbra's own defaults.
    """
    app = FastAPI(
        title="UMBRIS · Local",
        version="1.1.0",
        docs_url=None,   # keep the surface intentionally small
        redoc_url=None,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    registry = _RunRegistry()
    hive_kwargs = hive_kwargs or {}

    # ── GET / · the UI ──────────────────────────────────────────

    @app.get("/", response_class=HTMLResponse)
    async def index() -> HTMLResponse:
        return HTMLResponse(content=INDEX_HTML, status_code=200)

    # ── GET /api/status ─────────────────────────────────────────

    @app.get("/api/status")
    async def status() -> JSONResponse:
        return JSONResponse({
            "provider": llm.provider_name,
            "models": {
                "worker":   llm.default_worker_model,
                "scout":    llm.default_scout_model,
                "judge":    llm.default_judge_model,
                "verifier": llm.default_verifier_model,
            },
            "spent_usd": llm.spent_usd,
            "version": "1.1.0",
        })

    # ── POST /api/query ─────────────────────────────────────────

    # Colony Mode → Umbra config. Mirrors UMBRIS Studio's mapping.
    _COLONY_MODE_PRESETS = {
        "STANDARD": {"n_scouts": 3, "n_researchers": 2, "n_critics": 2, "n_synthesisers": 1},
        "DEEP":     {"n_scouts": 5, "n_researchers": 3, "n_critics": 3, "n_synthesisers": 2},
        "RAPID":    {"n_scouts": 2, "n_researchers": 1, "n_critics": 1, "n_synthesisers": 1},
    }

    @app.post("/api/query", response_model=QueryAccepted)
    async def post_query(body: QueryBody) -> QueryAccepted:
        run_id = uuid.uuid4().hex[:12]
        # Compose the final query: optionally prepend constraints.
        final_query = body.query
        if body.constraints:
            final_query = (
                f"{body.query}\n\n"
                f"Additional constraints from the user:\n{body.constraints}"
            )
        # Resolve per-run Umbra kwargs from Colony Mode (override server defaults).
        per_run_hive_kwargs = dict(hive_kwargs)
        if body.colony_mode and body.colony_mode in _COLONY_MODE_PRESETS:
            per_run_hive_kwargs.update(_COLONY_MODE_PRESETS[body.colony_mode])
        run = _Run(
            run_id=run_id,
            query=final_query,
            started_at=time.time(),
            blackboard=InMemoryBlackboard(),
            queue=asyncio.Queue(),
        )

        async def run_hive() -> None:
            try:
                # Each request gets its own Umbra instance so provenance
                # is fresh. The Blackboard is injected so the poller
                # below can stream records as they're written.
                umbra = Umbra(llm=llm, **per_run_hive_kwargs)
                budget = Budget(max_total_usd=body.budget_usd)
                await run.queue.put(_sse_event("phase", {
                    "phase": "deliberating",
                    "label": "Mercurii gathering…",
                }))
                result = await umbra.run(
                    final_query,
                    budget=budget,
                    blackboard=run.blackboard,
                )
                wall = time.time() - run.started_at
                await run.queue.put(_sse_event("complete", {
                    "accepted": bool(result.accepted),
                    "answer": result.answer,
                    "confidence": result.confidence,
                    "cost_usd": result.summary.total_cost_usd,
                    "wall_seconds": wall,
                    "total_records": result.summary.total_records,
                    "provider": llm.provider_name,
                }))
            except Exception as e:  # noqa: BLE001 · surface as an error event
                await run.queue.put(_sse_event("error", {"message": str(e)}))
            finally:
                run.completed = True

        async def poll_blackboard() -> None:
            """Push any new Records on the Blackboard to the run's queue
            every `poll_interval_seconds`, until the run completes."""
            running_cost = 0.0
            while not run.completed:
                snap = run.blackboard.snapshot()
                if len(snap) > run.seen_count:
                    new_recs = snap[run.seen_count :]
                    run.seen_count = len(snap)
                    for r in new_recs:
                        if r.type == RecordType.PROVENANCE_SUMMARY:
                            continue
                        running_cost += float(r.cost_estimate or 0.0)
                        await run.queue.put(_sse_event("record",
                            _record_to_payload(r, running_cost_usd=running_cost),
                        ))
                await asyncio.sleep(poll_interval_seconds)
            # One final sweep after completion so trailing records get sent.
            snap = run.blackboard.snapshot()
            if len(snap) > run.seen_count:
                for r in snap[run.seen_count :]:
                    if r.type == RecordType.PROVENANCE_SUMMARY:
                        continue
                    running_cost += float(r.cost_estimate or 0.0)
                    await run.queue.put(_sse_event("record",
                        _record_to_payload(r, running_cost_usd=running_cost),
                    ))
            # Signal end of stream.
            await run.queue.put(None)

        run.task = asyncio.create_task(run_hive())
        run.poll_task = asyncio.create_task(poll_blackboard())
        registry.add(run)
        return QueryAccepted(run_id=run_id)

    # ── GET /api/stream/{run_id} · SSE ──────────────────────────

    @app.get("/api/stream/{run_id}")
    async def stream(run_id: str) -> StreamingResponse:
        run = registry.get(run_id)
        if run is None:
            raise HTTPException(status_code=404, detail="run_id not found")

        async def event_generator():
            # Send SSE keepalives every 5 seconds so the browser does not
            # idle the connection during long Umbra deliberations. Without
            # these the EventSource times out, the browser closes and
            # reconnects, and the client sees a spurious "stream lost".
            KEEPALIVE_SEC = 5.0
            while True:
                try:
                    item = await asyncio.wait_for(run.queue.get(), timeout=KEEPALIVE_SEC)
                except asyncio.TimeoutError:
                    # SSE comment line · browser ignores, but counts as
                    # traffic for the connection-idle timer.
                    yield ": keepalive\n\n"
                    continue
                if item is None:  # sentinel = stream over
                    return
                yield item

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",  # disable nginx buffering, harmless elsewhere
            },
        )

    # ──────────────────────────────────────────────────────────────
    # Custos control · `umbris.daemon.Daemon` lifecycle wrapped behind HTTP
    # ──────────────────────────────────────────────────────────────

    # Lazy import: the daemon module pulls in `structlog`, `httpx` etc.
    # Import only when daemon routes are first used to keep cold start small.
    _daemon_state: dict[str, Any] = {"instance": None, "task": None}

    @app.post("/api/daemon/start")
    async def daemon_start(body: DaemonStartBody) -> JSONResponse:
        from pathlib import Path
        from ..daemon import Daemon, DaemonConfig

        if _daemon_state["instance"] is not None:
            return JSONResponse({"ok": False, "reason": "already running"}, status_code=409)

        repo_root = Path(body.repo_root) if body.repo_root else Path.cwd()
        config = DaemonConfig(
            repo_root=repo_root.resolve(),
            interval=body.interval,
            dry_run=not body.commit_and_push,
            once=False,
            commit_and_push=body.commit_and_push,
            run_tests=body.run_tests,
            run_build_when_web_touched=body.run_build_when_web_touched,
            cost_cap_per_cycle_usd=body.cost_cap_per_cycle_usd,
            cost_cap_per_day_usd=body.cost_cap_per_day_usd,
        )
        daemon = Daemon(llm=llm, config=config)
        _daemon_state["instance"] = daemon
        _daemon_state["task"] = asyncio.create_task(daemon.run_async())
        return JSONResponse({
            "ok": True,
            "repo": str(repo_root.resolve()),
            "interval_seconds": daemon._interval_seconds,
        })

    @app.post("/api/daemon/stop")
    async def daemon_stop() -> JSONResponse:
        daemon = _daemon_state["instance"]
        task = _daemon_state["task"]
        if daemon is None:
            return JSONResponse({"ok": False, "reason": "not running"}, status_code=409)
        daemon._stop_requested = True
        if task is not None:
            try:
                await asyncio.wait_for(task, timeout=5.0)
            except asyncio.TimeoutError:
                task.cancel()
        _daemon_state["instance"] = None
        _daemon_state["task"] = None
        return JSONResponse({"ok": True})

    @app.get("/api/daemon/state")
    async def daemon_state() -> JSONResponse:
        daemon = _daemon_state["instance"]
        if daemon is None:
            return JSONResponse({
                "status": "stopped",
                "cycles_completed": 0,
                "last_event": None,
                "today_spent_usd": 0.0,
            })
        # Derive status from daemon state.
        last = daemon.state.last_event or {}
        is_cycling = last.get("status") in ("shipped", "skipped", "failed") and (
            (time.time() - run_started_to_seconds(last.get("started_at"))) < 5
            if last.get("started_at") else False
        )
        return JSONResponse({
            "status": "cycling" if is_cycling else "idle",
            "cycles_completed": daemon.state.cycles_completed,
            "last_event": last or None,
            "today_spent_usd": daemon.ledger.spent_today_usd,
            "history": daemon.state.history[-20:],
        })

    @app.get("/api/daemon/cycles")
    async def daemon_cycles(limit: int = 20) -> JSONResponse:
        daemon = _daemon_state["instance"]
        if daemon is None:
            return JSONResponse({"cycles": []})
        return JSONResponse({"cycles": daemon.state.history[-limit:]})

    return app


# Small helper for daemon_state.
def run_started_to_seconds(iso: str | None) -> float:
    if not iso:
        return 0.0
    from datetime import datetime
    try:
        return datetime.fromisoformat(iso).timestamp()
    except (ValueError, TypeError):
        return 0.0


# ──────────────────────────────────────────────────────────────────
# `umbris serve` plumbing · boot uvicorn with the configured app
# ──────────────────────────────────────────────────────────────────


def run_server(
    llm: LLMClient,
    *,
    host: str = "127.0.0.1",
    port: int = 8000,
    open_browser: bool = True,
    hive_kwargs: dict[str, Any] | None = None,
) -> None:
    """Synchronously boot the server. Used by `umbris serve` and as a one-call
    convenience for any Python script that wants to launch the UI."""
    try:
        import uvicorn
    except ImportError as e:  # pragma: no cover
        raise ImportError(
            "umbris serve requires the [serve] extra. Install with:\n"
            "    pip install -e \".[serve]\""
        ) from e

    app = create_app(llm, hive_kwargs=hive_kwargs)

    url = f"http://{host}:{port}"
    if open_browser:
        try:
            webbrowser.open(url)
        except Exception:  # noqa: BLE001 · non-fatal in headless contexts
            pass

    uvicorn.run(app, host=host, port=port, log_level="info")
