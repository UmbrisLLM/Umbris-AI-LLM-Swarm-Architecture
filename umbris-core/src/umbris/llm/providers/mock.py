"""
umbris.llm.providers.mock · deterministic mock provider for tests.

Lets the whole UMBRIS test suite exercise Umbra / planets / consensus
without burning a single API dollar. Two modes:

  - Static · pass a list of `responses`; the provider cycles through them.
  - Templated · pass a callable that gets `(role_signal, system, user)`
    and returns the response text. Useful for asserting role-specific
    behaviour.

Records every call it received so tests can verify the convocation sent
the right prompts.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Callable

from ...provenance import TokenUsage
from .base import CompletionResult, LLMProvider


@dataclass(frozen=True)
class MockCall:
    """One recorded invocation of MockProvider.complete()."""

    system: str
    user: str
    model: str
    max_tokens: int


@dataclass
class _MockState:
    calls: list[MockCall] = field(default_factory=list)
    index: int = 0


class MockProvider(LLMProvider):
    """A deterministic LLM provider for tests.

    Examples
    --------
    Static cycling responses:

        provider = MockProvider(responses=["yes", "no", "maybe"])
        # First call returns "yes", second "no", third "maybe", fourth "yes" again.

    Templated responses:

        def respond(role_signal: str, system: str, user: str) -> str:
            return f"Hello from {role_signal}"

        provider = MockProvider(responder=respond)
    """

    name = "mock"

    def __init__(
        self,
        *,
        responses: list[str] | None = None,
        responder: Callable[[str, str, str], str] | None = None,
        latency_seconds: float = 0.0,
        input_tokens_per_call: int = 100,
        output_tokens_per_call: int = 200,
    ) -> None:
        if responses is None and responder is None:
            responses = ["mock response"]
        self._responses = list(responses) if responses else None
        self._responder = responder
        self._latency = latency_seconds
        self._in_tokens = input_tokens_per_call
        self._out_tokens = output_tokens_per_call
        self._state = _MockState()
        self._lock = asyncio.Lock()

    @property
    def default_models(self) -> dict[str, str]:
        return {
            "worker":   "mock-worker",
            "scout":    "mock-scout",
            "judge":    "mock-judge",
            "verifier": "mock-verifier",
        }

    def estimate_cost(self, model: str, usage: TokenUsage) -> float:
        return 0.0

    # ── Test introspection ──────────────────────────────────────

    @property
    def calls(self) -> list[MockCall]:
        """Every call MockProvider has received so far, in order."""
        return list(self._state.calls)

    @property
    def call_count(self) -> int:
        return len(self._state.calls)

    def reset(self) -> None:
        """Clear recorded calls and reset the response cycle index."""
        self._state = _MockState()

    # ── The contract ───────────────────────────────────────────

    async def complete(
        self,
        *,
        system: str,
        user: str,
        model: str,
        max_tokens: int = 16_000,
        thinking: bool = True,
        effort: str = "high",
        cache_system: bool = True,
    ) -> CompletionResult:
        async with self._lock:
            self._state.calls.append(MockCall(
                system=system, user=user, model=model, max_tokens=max_tokens,
            ))
            if self._responder is not None:
                # Derive a coarse role signal from the model name so the
                # templated responder can branch on it.
                role_signal = model.replace("mock-", "")
                text = self._responder(role_signal, system, user)
            else:
                assert self._responses is not None
                text = self._responses[self._state.index % len(self._responses)]
                self._state.index += 1

        if self._latency > 0:
            await asyncio.sleep(self._latency)

        usage = TokenUsage(
            input_tokens=self._in_tokens,
            output_tokens=self._out_tokens,
        )

        return CompletionResult(
            text=text,
            thinking=None,
            model=model,
            usage=usage,
            cost_usd=0.0,
            stop_reason="stop",
            provider=self.name,
        )

    async def aclose(self) -> None:
        return None
