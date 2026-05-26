"""UMBRIS · Ars Memoriae. A hermetic-cosmic multi-agent LLM convocation for collective reasoning.

Public API · these are the surfaces stable enough to import directly.

    from umbris import Umbra, LLMClient, Budget, CompositioneLoop, Step

For everything else (Records, planet base classes, consensus internals,
provenance helpers) import from the submodules directly:

    from umbris.blackboard import Record, RecordType
    from umbris.consensus import borda_aggregate
    from umbris.provenance import ProvenanceSummary
"""

__version__ = "1.1.0"

from .agents.base import Budget
from .compositione import CompositioneLoop, Step
from .umbra import Umbra
from .introspection import Observation, RepoAnalyst, surface_bottlenecks
from .llm.client import LLMClient
from .llm.providers import (
    AnthropicProvider,
    CompletionResult,
    LLMProvider,
    MockProvider,
    OllamaProvider,
    OpenAIProvider,
    ProviderAPIError,
    ProviderConfigurationError,
    ProviderError,
    auto_provider,
)

__all__ = [
    "__version__",
    # Core
    "Umbra",
    "LLMClient",
    "Budget",
    # Compositione
    "CompositioneLoop",
    "Step",
    # Introspection
    "RepoAnalyst",
    "Observation",
    "surface_bottlenecks",
    # LLM providers (multi-backend)
    "LLMProvider",
    "CompletionResult",
    "AnthropicProvider",
    "OpenAIProvider",
    "OllamaProvider",
    "MockProvider",
    "auto_provider",
    "ProviderError",
    "ProviderConfigurationError",
    "ProviderAPIError",
]
