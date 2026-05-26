"""
umbris.llm.providers.ollama · local Ollama provider.

The provider that lets anyone run the UMBRIS convocation on a local LLM with
no API key, no rate limit, no per-token cost. Perfect for development,
private repos, air-gapped deliberations, or running the compositione
loop continuously without burning real dollars.

Requires Ollama running locally (default http://localhost:11434).
Install Ollama from https://ollama.com and pull a model:

    ollama pull llama3.3
    ollama pull qwen2.5:14b
    ollama pull mistral-small

Provider-specific notes:
  - All cost estimates are 0.00 · compute is free on local hardware.
  - `thinking`, `effort`, and `cache_system` are silently no-op.
  - `max_tokens` maps to Ollama's `num_predict` option.
"""

from __future__ import annotations

import os
from typing import Any

import httpx

from ...provenance import TokenUsage
from .base import (
    CompletionResult,
    LLMProvider,
    ProviderAPIError,
)

DEFAULT_BASE_URL = "http://localhost:11434"


class OllamaProvider(LLMProvider):
    """Local Ollama backend. Free, private, runs entirely on your machine."""

    name = "ollama"

    def __init__(
        self,
        *,
        base_url: str | None = None,
        timeout: float = 600.0,
    ) -> None:
        self._base_url = (base_url or os.environ.get("OLLAMA_HOST") or DEFAULT_BASE_URL).rstrip("/")
        self._client = httpx.AsyncClient(timeout=timeout)

    @property
    def default_models(self) -> dict[str, str]:
        # Conservative defaults · small enough that anyone with 16GB RAM
        # can run the whole convocation. Override at construction time for bigger
        # models if your hardware allows.
        return {
            "worker":   "llama3.3",
            "scout":    "llama3.2",
            "judge":    "llama3.3",
            "verifier": "llama3.3",
        }

    def estimate_cost(self, model: str, usage: TokenUsage) -> float:
        # Local compute is free.
        return 0.0

    async def complete(
        self,
        *,
        system: str,
        user: str,
        model: str,
        max_tokens: int = 16_000,
        thinking: bool = True,        # ignored on Ollama
        effort: str = "high",         # ignored on Ollama
        cache_system: bool = True,    # ignored on Ollama
    ) -> CompletionResult:
        body: dict[str, Any] = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user",   "content": user},
            ],
            "stream": False,
            "options": {
                "num_predict": max_tokens,
            },
        }

        try:
            response = await self._client.post(
                f"{self._base_url}/api/chat",
                json=body,
                headers={"Content-Type": "application/json"},
            )
        except httpx.HTTPError as e:
            raise ProviderAPIError(
                f"Ollama HTTP error: {e}. Is Ollama running on {self._base_url}?"
            ) from e

        if response.status_code != 200:
            raise ProviderAPIError(
                f"Ollama returned {response.status_code}: {response.text[:500]}",
                status_code=response.status_code,
            )

        data = response.json()
        text = (data.get("message") or {}).get("content", "") or ""

        usage = TokenUsage(
            input_tokens=int(data.get("prompt_eval_count", 0) or 0),
            output_tokens=int(data.get("eval_count", 0) or 0),
        )

        stop_reason = "stop" if data.get("done") else None

        return CompletionResult(
            text=text,
            thinking=None,
            model=model,
            usage=usage,
            cost_usd=0.0,
            stop_reason=stop_reason,
            provider=self.name,
        )

    async def aclose(self) -> None:
        await self._client.aclose()
