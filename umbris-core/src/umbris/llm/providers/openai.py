"""
umbris.llm.providers.openai · the OpenAI provider.

Uses the raw Chat Completions HTTP API via `httpx` rather than the
`openai` SDK so it stays a zero-extra-deps install (httpx is already
present as an `anthropic` transitive dep). Compatible with:

  - OpenAI proper (api.openai.com)
  - Azure OpenAI (set OPENAI_BASE_URL + OPENAI_API_KEY)
  - Any OpenAI-compatible gateway (groq, together, fireworks, openrouter,
    deepinfra, locally-hosted vLLM / TGI / litellm-proxy, etc.) · just
    point OPENAI_BASE_URL at it.

Provider-specific notes:
  - `thinking` and `cache_system` are silently no-op (OpenAI exposes
    neither in the public API today).
  - `effort` maps to OpenAI's `reasoning_effort` for o-series models
    ("high" / "medium" / "low"). Silently ignored for non-reasoning
    models that don't accept it.
  - The o-series models (o1, o3, o3-mini) require `max_completion_tokens`
    rather than `max_tokens` · handled transparently below.
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
    ProviderConfigurationError,
)

DEFAULT_BASE_URL = "https://api.openai.com/v1"

#: USD per 1M tokens. Approximate, refresh PRICING_AS_OF when prices change.
#: Keys are model names exactly as the OpenAI API expects them.
PRICING_USD_PER_MTOK: dict[str, dict[str, float]] = {
    "gpt-4o":        {"input":  2.50, "output": 10.00},
    "gpt-4o-mini":   {"input":  0.15, "output":  0.60},
    "gpt-4.1":       {"input":  3.00, "output": 12.00},
    "gpt-4.1-mini":  {"input":  0.40, "output":  1.60},
    "o1":            {"input": 15.00, "output": 60.00},
    "o1-preview":    {"input": 15.00, "output": 60.00},
    "o1-mini":       {"input":  3.00, "output": 12.00},
    "o3-mini":       {"input":  1.10, "output":  4.40},
}

#: Substrings that identify OpenAI's reasoning ("o-series") models.
_REASONING_PREFIXES = ("o1", "o3", "o4")


class OpenAIProvider(LLMProvider):
    """OpenAI-compatible backend. Works with OpenAI proper or any
    OpenAI-API-compatible gateway (groq, together, fireworks, vLLM, etc.)."""

    name = "openai"

    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout: float = 600.0,
    ) -> None:
        key = api_key or os.environ.get("OPENAI_API_KEY")
        if not key:
            raise ProviderConfigurationError(
                "OpenAIProvider requires OPENAI_API_KEY in the environment "
                "or an explicit api_key argument."
            )
        self._api_key = key
        self._base_url = (base_url or os.environ.get("OPENAI_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")
        self._client = httpx.AsyncClient(timeout=timeout)

    @property
    def default_models(self) -> dict[str, str]:
        return {
            "worker":   "gpt-4o",
            "scout":    "gpt-4o-mini",
            "judge":    "o1-mini",
            "verifier": "gpt-4o",
        }

    def estimate_cost(self, model: str, usage: TokenUsage) -> float:
        table = PRICING_USD_PER_MTOK.get(model)
        if table is None:
            return 0.0
        return (
            usage.input_tokens   * table["input"]  / 1_000_000
            + usage.output_tokens * table["output"] / 1_000_000
        )

    async def complete(
        self,
        *,
        system: str,
        user: str,
        model: str,
        max_tokens: int = 16_000,
        thinking: bool = True,    # ignored on OpenAI
        effort: str = "high",     # mapped to reasoning_effort for o-series
        cache_system: bool = True,  # ignored on OpenAI
    ) -> CompletionResult:
        is_reasoning = any(model.startswith(p) for p in _REASONING_PREFIXES)

        # The o-series uses `max_completion_tokens` and only accepts
        # certain reasoning models. Build the body accordingly.
        body: dict[str, Any] = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
        if is_reasoning:
            body["max_completion_tokens"] = max_tokens
            body["reasoning_effort"] = effort
        else:
            body["max_tokens"] = max_tokens

        try:
            response = await self._client.post(
                f"{self._base_url}/chat/completions",
                json=body,
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
            )
        except httpx.HTTPError as e:
            raise ProviderAPIError(f"OpenAI HTTP error: {e}") from e

        if response.status_code != 200:
            raise ProviderAPIError(
                f"OpenAI returned {response.status_code}: {response.text[:500]}",
                status_code=response.status_code,
            )

        data = response.json()
        try:
            text = data["choices"][0]["message"]["content"] or ""
            stop_reason = data["choices"][0].get("finish_reason")
            usage_raw = data.get("usage", {}) or {}
        except (KeyError, IndexError) as e:
            raise ProviderAPIError(f"OpenAI response missing fields: {e}") from e

        usage = TokenUsage(
            input_tokens=int(usage_raw.get("prompt_tokens", 0) or 0),
            output_tokens=int(usage_raw.get("completion_tokens", 0) or 0),
        )
        cost = self.estimate_cost(model, usage)

        return CompletionResult(
            text=text,
            thinking=None,  # OpenAI does not expose reasoning content publicly
            model=model,
            usage=usage,
            cost_usd=cost,
            stop_reason=stop_reason,
            provider=self.name,
        )

    async def aclose(self) -> None:
        await self._client.aclose()
