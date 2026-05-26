"""
umbris.server · the local web UI and HTTP API.

Boots a tiny FastAPI app that:

  * Serves a single-page web UI at ``/`` matching UMBRIS's brand register.
  * Exposes ``POST /api/query`` to start a deliberation.
  * Streams Records live via Server-Sent Events at ``GET /api/stream/{run_id}``.
  * Reports the active provider at ``GET /api/status``.

The whole thing is one self-contained Python module so it ships as part
of the regular install (with the ``[serve]`` extra for FastAPI / uvicorn).

Boot it from a script:

    from umbris import auto_provider, LLMClient
    from umbris.server import create_app, run_server

    run_server(LLMClient(provider=auto_provider()))

Or from the CLI:

    umbris serve
"""

from __future__ import annotations

from .app import create_app, run_server

__all__ = ["create_app", "run_server"]
