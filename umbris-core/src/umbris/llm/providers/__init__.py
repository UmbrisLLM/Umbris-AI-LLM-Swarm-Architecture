"""
umbris.llm.providers · the multi-provider LLM abstraction.

Public surface:

    from umbris.llm.providers import (
        LLMProvider,
        AnthropicProvider,
        OpenAIProvider,
        OllamaProvider,
        MockProvider,
        CompletionResult,
        ProviderError,
        ProviderConfigurationError,
        ProviderAPIError,
        auto_provider,
    )

Quickstart with any provider:

    >>> from umbris import Umbra, LLMClient
    >>> from umbris.llm.providers import OpenAIProvider
    >>> llm = LLMClient(provider=OpenAIProvider())
    >>> umbra = Umbra(llm=llm)
    >>> result = await umbra.run("...")

Or let UMBRIS pick a provider based on which API key is in the env:

    >>> from umbris.llm.providers import auto_provider
    >>> llm = LLMClient(provider=auto_provider())
"""

from __future__ import annotations

import os
from typing import Literal

from .anthropic import AnthropicProvider
from .base import (
    CompletionResult,
    LLMProvider,
    ProviderAPIError,
    ProviderConfigurationError,
    ProviderError,
)
from .mock import MockCall, MockProvider
from .ollama import OllamaProvider
from .openai import OpenAIProvider

__all__ = [
    "LLMProvider",
    "CompletionResult",
    "AnthropicProvider",
    "OpenAIProvider",
    "OllamaProvider",
    "MockProvider",
    "MockCall",
    "ProviderError",
    "ProviderConfigurationError",
    "ProviderAPIError",
    "auto_provider",
]

#: Identifier for explicit provider selection in auto_provider().
ProviderName = Literal["anthropic", "openai", "ollama"]


def auto_provider(name: ProviderName | None = None) -> LLMProvider:
    """Pick a provider intelligently.

    Resolution order (when ``name`` is None):

      1. ``UMBRIS_PROVIDER`` env var ("anthropic" | "openai" | "ollama") wins.
      2. ``ANTHROPIC_API_KEY`` present → AnthropicProvider.
      3. ``OPENAI_API_KEY`` present → OpenAIProvider.
      4. Fall back to OllamaProvider (no key required).

    With ``name`` set explicitly, returns that provider directly.

    Raises:
        ProviderConfigurationError · explicit name given but required env
        var (API key) is missing.
    """
    chosen = name or os.environ.get("UMBRIS_PROVIDER")

    if chosen == "anthropic":
        return AnthropicProvider()
    if chosen == "openai":
        return OpenAIProvider()
    if chosen == "ollama":
        return OllamaProvider()

    # Auto-detection: pick the first one with a key.
    if os.environ.get("ANTHROPIC_API_KEY"):
        return AnthropicProvider()
    if os.environ.get("OPENAI_API_KEY"):
        return OpenAIProvider()

    # No key found · fall back to local Ollama.
    return OllamaProvider()
