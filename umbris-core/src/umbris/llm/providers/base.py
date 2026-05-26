"""
umbris.llm.providers.base · the provider protocol.

Every LLM backend (Anthropic, OpenAI, Ollama, local, mock) implements
the same surface. This is what makes UMBRIS a true multi-provider convocation:
one architecture, any model.

Design rules:
  - One `complete()` method. Each provider is responsible for mapping
    UMBRIS's high-level kwargs to its native API.
  - Provider-specific kwargs (Anthropic's `thinking`, OpenAI's `reasoning`)
    are accepted on every provider and silently ignored where they don't
    apply. Calling code never branches on provider type.
  - Every provider exposes `default_models` for the four canonical roles
    (worker / scout / judge / verifier). The Umbra picks sensible defaults
    automatically.
  - Cost estimation is per-provider · pricing tables live with their
    provider, not in a global registry.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

from ...provenance import TokenUsage


# ──────────────────────────────────────────────────────────────────
# Result type · what every provider returns
# ──────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class CompletionResult:
    """One LLM call's worth of output, with accounting and provider info."""

    text: str
    """The model's response text."""

    thinking: str | None
    """Reasoning trace, when the provider exposes it. None for providers
    that don't surface intermediate reasoning."""

    model: str
    """The actual model that produced this response."""

    usage: TokenUsage
    """Token accounting for cost estimation."""

    cost_usd: float
    """Estimated cost in USD, computed by the provider's pricing table."""

    stop_reason: str | None
    """Provider-specific stop reason (end_turn, length, stop_sequence, etc.)."""

    provider: str
    """Which provider produced this result. One of: anthropic, openai,
    ollama, mock · or anything else a custom provider sets."""


# ──────────────────────────────────────────────────────────────────
# Exceptions
# ──────────────────────────────────────────────────────────────────


class ProviderError(Exception):
    """Base class for any provider-raised error."""


class ProviderConfigurationError(ProviderError):
    """Raised when a provider is misconfigured (missing API key, etc.)."""


class ProviderAPIError(ProviderError):
    """Raised when a provider's backend returns an error."""

    def __init__(self, message: str, *, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


# ──────────────────────────────────────────────────────────────────
# Provider base
# ──────────────────────────────────────────────────────────────────


class LLMProvider(ABC):
    """The contract every LLM backend implements.

    Subclass and implement `complete()` plus `name`. Override
    `default_models` and `estimate_cost` as needed for your backend.
    Override `aclose()` if you hold any async resources (httpx client,
    SDK client, etc.).
    """

    #: Short identifier for this provider (anthropic / openai / ollama / mock).
    name: str = "abstract"

    # ── Required ────────────────────────────────────────────────

    @abstractmethod
    async def complete(
        self,
        *,
        system: str,
        user: str,
        model: str,
        max_tokens: int = 16_000,
        # Provider-specific tuning hints. Accepted by every provider;
        # silently ignored where they do not apply.
        thinking: bool = True,
        effort: str = "high",
        cache_system: bool = True,
    ) -> CompletionResult:
        """Run one completion. Always async. Always returns a CompletionResult.

        Raises:
            ProviderConfigurationError · provider not configured (no key, etc.)
            ProviderAPIError · backend returned an error response
        """
        raise NotImplementedError

    # ── Optional overrides ─────────────────────────────────────

    @property
    def default_models(self) -> dict[str, str]:
        """Default model name per role.

        Roles: ``worker`` (deliberators), ``scout`` (cheap exploration),
        ``judge`` (consensus adjudicator), ``verifier`` (falsifier).

        Override per provider to surface sensible defaults so the Umbra
        works out of the box on any backend.
        """
        return {}

    def estimate_cost(self, model: str, usage: TokenUsage) -> float:
        """Estimate USD cost for one call. Default: 0.0 (free / unknown).

        Subclasses should override with their own pricing table.
        """
        return 0.0

    async def aclose(self) -> None:
        """Release any held resources. Default: no-op."""
        return None
