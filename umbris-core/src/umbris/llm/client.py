"""
umbris.llm.client

The high-level LLM client every planet calls. Owns budget tracking and
per-role default models. Delegates the actual API call to a configurable
provider (Anthropic, OpenAI, Ollama, Mock · or anything else implementing
`LLMProvider`).

Backward compatible: `LLMClient()` with no arguments still gives you
the original Anthropic behaviour, same kwargs, same `CompletionResult`.

To run the convocation on a different backend, pass a provider explicitly:

    from umbris import LLMClient
    from umbris.llm.providers import OpenAIProvider, OllamaProvider, auto_provider

    llm = LLMClient(provider=OpenAIProvider())
    llm = LLMClient(provider=OllamaProvider())
    llm = LLMClient(provider=auto_provider())   # picks based on env

Default model names per role are read from the provider (so the Umbra
just works on any backend out of the box), but every default can still
be overridden explicitly.
"""

from __future__ import annotations

import asyncio

from .providers import (
    AnthropicProvider,
    CompletionResult,
    LLMProvider,
)

# Backward-compatible re-exports for callers that import these directly.
DEFAULT_WORKER_MODEL = "claude-opus-4-7"
DEFAULT_SCOUT_MODEL = "claude-sonnet-4-6"
DEFAULT_JUDGE_MODEL = "claude-opus-4-7"
DEFAULT_VERIFIER_MODEL = "claude-opus-4-7"


__all__ = [
    "CompletionResult",
    "LLMClient",
    "DEFAULT_WORKER_MODEL",
    "DEFAULT_SCOUT_MODEL",
    "DEFAULT_JUDGE_MODEL",
    "DEFAULT_VERIFIER_MODEL",
]


class LLMClient:
    """The async LLM façade every planet calls.

    Owns:
      - per-role default model names (worker / scout / judge / verifier)
      - budget tracking (spent_usd, optional cap)
      - the configured provider (Anthropic by default, swappable)
    """

    def __init__(
        self,
        *,
        api_key: str | None = None,
        provider: LLMProvider | None = None,
        default_worker_model: str | None = None,
        default_scout_model: str | None = None,
        default_judge_model: str | None = None,
        default_verifier_model: str | None = None,
        budget_usd: float | None = None,
    ) -> None:
        # Provider default = Anthropic (backward compatible). If the caller
        # passes a provider, it wins; api_key only applies to the default.
        self._provider = provider or AnthropicProvider(api_key=api_key)

        # Pull defaults from the provider, allow per-arg overrides.
        provider_defaults = self._provider.default_models
        self.default_worker_model = (
            default_worker_model or provider_defaults.get("worker") or DEFAULT_WORKER_MODEL
        )
        self.default_scout_model = (
            default_scout_model or provider_defaults.get("scout") or DEFAULT_SCOUT_MODEL
        )
        self.default_judge_model = (
            default_judge_model or provider_defaults.get("judge") or DEFAULT_JUDGE_MODEL
        )
        self.default_verifier_model = (
            default_verifier_model or provider_defaults.get("verifier") or DEFAULT_VERIFIER_MODEL
        )

        self._budget_usd = budget_usd
        self._spent_usd = 0.0
        self._lock = asyncio.Lock()

    # ── Properties ──────────────────────────────────────────────

    @property
    def provider(self) -> LLMProvider:
        """The underlying provider (anthropic / openai / ollama / mock / custom)."""
        return self._provider

    @property
    def provider_name(self) -> str:
        return self._provider.name

    @property
    def spent_usd(self) -> float:
        return self._spent_usd

    @property
    def budget_remaining_usd(self) -> float | None:
        if self._budget_usd is None:
            return None
        return max(0.0, self._budget_usd - self._spent_usd)

    def is_budget_exhausted(self) -> bool:
        return self._budget_usd is not None and self._spent_usd >= self._budget_usd

    # ── The contract ───────────────────────────────────────────

    async def complete(
        self,
        *,
        system: str,
        user: str,
        model: str | None = None,
        max_tokens: int = 16_000,
        thinking: bool = True,
        effort: str = "high",
        cache_system: bool = True,
    ) -> CompletionResult:
        """Run one completion through the configured provider.

        Provider-specific kwargs (`thinking`, `effort`, `cache_system`) are
        accepted on every provider and silently ignored where they do not
        apply · the planet layer never has to branch on provider type.
        """
        model = model or self.default_worker_model

        result = await self._provider.complete(
            system=system,
            user=user,
            model=model,
            max_tokens=max_tokens,
            thinking=thinking,
            effort=effort,
            cache_system=cache_system,
        )

        async with self._lock:
            self._spent_usd += result.cost_usd

        return result

    async def aclose(self) -> None:
        await self._provider.aclose()
