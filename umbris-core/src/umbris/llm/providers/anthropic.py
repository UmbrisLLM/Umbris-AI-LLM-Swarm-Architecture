"""
umbris.llm.providers.anthropic · the Anthropic provider.

Hosts the Anthropic-specific tuning (adaptive thinking, prompt caching,
output_config.effort, always-stream-then-get_final_message to dodge
non-streaming HTTP timeouts on long Opus 4.7 outputs) in one provider
rather than at the top-level client.

Opus 4.7 quirks preserved here:
  - `budget_tokens` is forbidden (400). Use adaptive thinking only.
  - `temperature` and `top_p` are forbidden (400).
  - Always stream; consume via `get_final_message`.
  - `thinking.display = "summarized"` to surface reasoning in the
    response. Default on 4.7 is "omitted".
"""

from __future__ import annotations

from typing import Any

from anthropic import AsyncAnthropic

from ...provenance import TokenUsage
from .base import (
    CompletionResult,
    LLMProvider,
    ProviderAPIError,
)

#: Adaptive is the only valid thinking mode on Opus 4.7.
ADAPTIVE_THINKING: dict[str, str] = {"type": "adaptive", "display": "summarized"}

#: USD per 1M tokens. Refresh PRICING_AS_OF in umbris.provenance when prices change.
PRICING_USD_PER_MTOK: dict[str, dict[str, float]] = {
    "claude-opus-4-7":   {"input": 5.00, "output": 25.00, "cache_write": 6.25, "cache_read": 0.50},
    "claude-opus-4-6":   {"input": 5.00, "output": 25.00, "cache_write": 6.25, "cache_read": 0.50},
    "claude-sonnet-4-6": {"input": 3.00, "output": 15.00, "cache_write": 3.75, "cache_read": 0.30},
    "claude-haiku-4-5":  {"input": 1.00, "output":  5.00, "cache_write": 1.25, "cache_read": 0.10},
}


class AnthropicProvider(LLMProvider):
    """Production-grade Anthropic backend. The original UMBRIS client."""

    name = "anthropic"

    def __init__(self, *, api_key: str | None = None) -> None:
        # SDK reads ANTHROPIC_API_KEY from env when api_key is None.
        self._client = AsyncAnthropic(api_key=api_key)

    @property
    def default_models(self) -> dict[str, str]:
        return {
            "worker":   "claude-opus-4-7",
            "scout":    "claude-sonnet-4-6",
            "judge":    "claude-opus-4-7",
            "verifier": "claude-opus-4-7",
        }

    def estimate_cost(self, model: str, usage: TokenUsage) -> float:
        table = PRICING_USD_PER_MTOK.get(model)
        if table is None:
            return 0.0
        return (
            usage.input_tokens             * table["input"]       / 1_000_000
            + usage.output_tokens          * table["output"]      / 1_000_000
            + usage.cache_creation_tokens  * table["cache_write"] / 1_000_000
            + usage.cache_read_tokens      * table["cache_read"]  / 1_000_000
        )

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
        request_kwargs: dict[str, Any] = {
            "model": model,
            "max_tokens": max_tokens,
            "system": _build_system(system, cache=cache_system),
            "messages": [{"role": "user", "content": user}],
            "output_config": {"effort": effort},
        }
        if thinking:
            request_kwargs["thinking"] = ADAPTIVE_THINKING

        try:
            async with self._client.messages.stream(**request_kwargs) as stream:
                message = await stream.get_final_message()
        except Exception as e:  # noqa: BLE001 · surface upstream errors uniformly
            raise ProviderAPIError(f"Anthropic stream failed: {e}") from e

        text = "".join(b.text for b in message.content if b.type == "text")
        thinking_text = "\n".join(
            b.thinking for b in message.content
            if b.type == "thinking" and getattr(b, "thinking", None)
        ) or None

        usage = TokenUsage(
            input_tokens=message.usage.input_tokens,
            output_tokens=message.usage.output_tokens,
            cache_creation_tokens=getattr(message.usage, "cache_creation_input_tokens", 0) or 0,
            cache_read_tokens=getattr(message.usage, "cache_read_input_tokens", 0) or 0,
        )
        cost = self.estimate_cost(model, usage)

        return CompletionResult(
            text=text,
            thinking=thinking_text,
            model=model,
            usage=usage,
            cost_usd=cost,
            stop_reason=message.stop_reason,
            provider=self.name,
        )

    async def aclose(self) -> None:
        await self._client.close()


def _build_system(text: str, *, cache: bool) -> list[dict[str, Any]] | str:
    """Wrap system text with cache_control when caching is on.

    Prompt caching is a strict prefix match · the cache_control marker
    on the system text caches `tools + system` together, so every planet
    call against the same role prompt reads from cache after the first.
    """
    if not cache:
        return text
    return [{"type": "text", "text": text, "cache_control": {"type": "ephemeral"}}]
