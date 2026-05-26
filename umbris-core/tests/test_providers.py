"""Tests for umbris.llm.providers · the multi-provider abstraction.

No live API calls. Anthropic / OpenAI / Ollama paths are exercised
against an httpx MockTransport so the convocation tests stay deterministic,
cheap, and runnable without keys.
"""

from __future__ import annotations

import os
from unittest.mock import patch

import httpx
import pytest

from umbris.llm.client import LLMClient
from umbris.llm.providers import (
    AnthropicProvider,
    CompletionResult,
    MockProvider,
    OllamaProvider,
    OpenAIProvider,
    ProviderAPIError,
    ProviderConfigurationError,
    auto_provider,
)
from umbris.llm.providers.openai import PRICING_USD_PER_MTOK as OPENAI_PRICES
from umbris.provenance import TokenUsage


# ──────────────────────────────────────────────────────────────────
# MockProvider · the building block every other provider test relies on
# ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_mock_provider_cycles_responses():
    provider = MockProvider(responses=["alpha", "beta", "gamma"])
    r1 = await provider.complete(system="s", user="u", model="x")
    r2 = await provider.complete(system="s", user="u", model="x")
    r3 = await provider.complete(system="s", user="u", model="x")
    r4 = await provider.complete(system="s", user="u", model="x")
    assert [r.text for r in (r1, r2, r3, r4)] == ["alpha", "beta", "gamma", "alpha"]


@pytest.mark.asyncio
async def test_mock_provider_records_calls():
    provider = MockProvider(responses=["ok"])
    await provider.complete(system="SYS", user="hello", model="mock-worker")
    assert provider.call_count == 1
    call = provider.calls[0]
    assert call.system == "SYS"
    assert call.user == "hello"
    assert call.model == "mock-worker"


@pytest.mark.asyncio
async def test_mock_provider_responder_callable():
    def respond(role: str, system: str, user: str) -> str:
        return f"{role}:{user}"

    provider = MockProvider(responder=respond)
    r = await provider.complete(system="s", user="ping", model="mock-scout")
    assert r.text == "scout:ping"


@pytest.mark.asyncio
async def test_mock_provider_reset_clears_state():
    provider = MockProvider(responses=["a", "b"])
    await provider.complete(system="s", user="u", model="x")
    provider.reset()
    assert provider.call_count == 0
    r = await provider.complete(system="s", user="u", model="x")
    assert r.text == "a"  # back to first response


@pytest.mark.asyncio
async def test_mock_provider_default_models():
    provider = MockProvider()
    defaults = provider.default_models
    assert set(defaults) == {"worker", "scout", "judge", "verifier"}


@pytest.mark.asyncio
async def test_mock_provider_zero_cost():
    provider = MockProvider()
    r = await provider.complete(system="s", user="u", model="x")
    assert r.cost_usd == 0.0


# ──────────────────────────────────────────────────────────────────
# CompletionResult · shape contract
# ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_completion_result_is_frozen_dataclass():
    provider = MockProvider(responses=["x"])
    r = await provider.complete(system="s", user="u", model="m")
    assert isinstance(r, CompletionResult)
    with pytest.raises(Exception):
        r.text = "changed"  # type: ignore[misc]


@pytest.mark.asyncio
async def test_completion_result_provider_field_set():
    r = await MockProvider(responses=["x"]).complete(system="s", user="u", model="m")
    assert r.provider == "mock"


# ──────────────────────────────────────────────────────────────────
# OpenAIProvider · via httpx MockTransport, no real network
# ──────────────────────────────────────────────────────────────────


def _openai_success_handler(request: httpx.Request) -> httpx.Response:
    """A canned OpenAI Chat Completions response."""
    return httpx.Response(
        200,
        json={
            "id": "chatcmpl-test",
            "object": "chat.completion",
            "choices": [{
                "index": 0,
                "message": {"role": "assistant", "content": "OpenAI says hello."},
                "finish_reason": "stop",
            }],
            "usage": {
                "prompt_tokens": 50,
                "completion_tokens": 80,
                "total_tokens": 130,
            },
        },
    )


def _openai_error_handler(request: httpx.Request) -> httpx.Response:
    return httpx.Response(500, json={"error": {"message": "boom"}})


@pytest.mark.asyncio
async def test_openai_provider_requires_api_key():
    with patch.dict(os.environ, {}, clear=True):
        with pytest.raises(ProviderConfigurationError):
            OpenAIProvider()


@pytest.mark.asyncio
async def test_openai_provider_completes_against_mock_transport():
    provider = OpenAIProvider(api_key="test-key")
    # Replace its httpx client with one using a mock transport.
    await provider._client.aclose()
    provider._client = httpx.AsyncClient(
        transport=httpx.MockTransport(_openai_success_handler),
    )
    r = await provider.complete(
        system="You are helpful.",
        user="Hello!",
        model="gpt-4o",
        max_tokens=200,
    )
    assert r.provider == "openai"
    assert r.text == "OpenAI says hello."
    assert r.usage.input_tokens == 50
    assert r.usage.output_tokens == 80
    assert r.stop_reason == "stop"
    # Cost should be computed from the gpt-4o pricing table.
    expected_cost = (
        50 * OPENAI_PRICES["gpt-4o"]["input"] / 1_000_000
        + 80 * OPENAI_PRICES["gpt-4o"]["output"] / 1_000_000
    )
    assert r.cost_usd == pytest.approx(expected_cost)
    await provider.aclose()


@pytest.mark.asyncio
async def test_openai_provider_surfaces_api_errors():
    provider = OpenAIProvider(api_key="test-key")
    await provider._client.aclose()
    provider._client = httpx.AsyncClient(
        transport=httpx.MockTransport(_openai_error_handler),
    )
    with pytest.raises(ProviderAPIError) as excinfo:
        await provider.complete(system="s", user="u", model="gpt-4o")
    assert excinfo.value.status_code == 500
    await provider.aclose()


@pytest.mark.asyncio
async def test_openai_provider_uses_max_completion_tokens_for_o_series():
    """o1/o3 require `max_completion_tokens`, not `max_tokens`."""
    seen: dict[str, object] = {}

    def capture_request(request: httpx.Request) -> httpx.Response:
        seen["body"] = request.content
        return _openai_success_handler(request)

    provider = OpenAIProvider(api_key="test-key")
    await provider._client.aclose()
    provider._client = httpx.AsyncClient(
        transport=httpx.MockTransport(capture_request),
    )
    await provider.complete(system="s", user="u", model="o1-mini", max_tokens=500, effort="medium")
    body_text = seen["body"].decode() if isinstance(seen["body"], bytes) else str(seen["body"])
    # httpx serialises JSON compactly (no whitespace after colons/commas),
    # so the actual body contains `"reasoning_effort":"medium"`.
    assert '"max_completion_tokens":500' in body_text
    assert '"max_tokens"' not in body_text
    assert '"reasoning_effort":"medium"' in body_text
    await provider.aclose()


@pytest.mark.asyncio
async def test_openai_provider_default_models():
    provider = OpenAIProvider(api_key="test-key")
    defaults = provider.default_models
    assert defaults["worker"] == "gpt-4o"
    assert defaults["scout"] == "gpt-4o-mini"
    await provider.aclose()


# ──────────────────────────────────────────────────────────────────
# OllamaProvider · local backend, also via MockTransport
# ──────────────────────────────────────────────────────────────────


def _ollama_success_handler(request: httpx.Request) -> httpx.Response:
    return httpx.Response(
        200,
        json={
            "model": "llama3.3",
            "message": {"role": "assistant", "content": "Local llama speaks."},
            "done": True,
            "prompt_eval_count": 30,
            "eval_count": 45,
        },
    )


@pytest.mark.asyncio
async def test_ollama_provider_completes():
    provider = OllamaProvider()
    await provider._client.aclose()
    provider._client = httpx.AsyncClient(
        transport=httpx.MockTransport(_ollama_success_handler),
    )
    r = await provider.complete(
        system="You are helpful.",
        user="Hi!",
        model="llama3.3",
    )
    assert r.provider == "ollama"
    assert r.text == "Local llama speaks."
    assert r.usage.input_tokens == 30
    assert r.usage.output_tokens == 45
    assert r.cost_usd == 0.0
    assert r.stop_reason == "stop"
    await provider.aclose()


@pytest.mark.asyncio
async def test_ollama_provider_surfaces_connection_errors():
    """If Ollama isn't running, error should be clear."""
    def conn_error_handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("Connection refused")

    provider = OllamaProvider()
    await provider._client.aclose()
    provider._client = httpx.AsyncClient(
        transport=httpx.MockTransport(conn_error_handler),
    )
    with pytest.raises(ProviderAPIError) as excinfo:
        await provider.complete(system="s", user="u", model="llama3.3")
    assert "Is Ollama running" in str(excinfo.value)
    await provider.aclose()


@pytest.mark.asyncio
async def test_ollama_provider_default_models():
    provider = OllamaProvider()
    defaults = provider.default_models
    assert defaults["worker"] == "llama3.3"
    await provider.aclose()


@pytest.mark.asyncio
async def test_ollama_provider_honours_base_url_override():
    provider = OllamaProvider(base_url="http://example.com:11434")
    assert provider._base_url == "http://example.com:11434"
    await provider.aclose()


# ──────────────────────────────────────────────────────────────────
# AnthropicProvider · just verify it constructs and exposes defaults.
# (Network behaviour is exercised by the existing test_hive suite.)
# ──────────────────────────────────────────────────────────────────


def test_anthropic_provider_default_models():
    # No network: just check the metadata.
    with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test"}, clear=False):
        provider = AnthropicProvider()
        defaults = provider.default_models
        assert defaults["worker"] == "claude-opus-4-7"
        assert defaults["scout"] == "claude-sonnet-4-6"


def test_anthropic_provider_estimates_cost():
    with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test"}, clear=False):
        provider = AnthropicProvider()
        usage = TokenUsage(input_tokens=1_000_000, output_tokens=1_000_000)
        cost = provider.estimate_cost("claude-opus-4-7", usage)
        # 5 USD in + 25 USD out
        assert cost == pytest.approx(30.0)


def test_anthropic_provider_unknown_model_zero_cost():
    with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test"}, clear=False):
        provider = AnthropicProvider()
        usage = TokenUsage(input_tokens=1_000, output_tokens=1_000)
        assert provider.estimate_cost("imaginary-model", usage) == 0.0


# ──────────────────────────────────────────────────────────────────
# auto_provider() · env-based selection
#
# Uses pytest's monkeypatch rather than `patch.dict(clear=True)` so
# we only manipulate the specific keys we care about · the Anthropic
# SDK reads HOME/APPDATA on construction and crashes if either is
# missing, which `clear=True` would do on Windows.
# ──────────────────────────────────────────────────────────────────


def _clear_provider_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Strip any provider-related env vars without touching the rest."""
    for key in ("UMBRIS_PROVIDER", "ANTHROPIC_API_KEY", "OPENAI_API_KEY", "OLLAMA_HOST"):
        monkeypatch.delenv(key, raising=False)


def test_auto_provider_explicit_name(monkeypatch: pytest.MonkeyPatch):
    _clear_provider_env(monkeypatch)
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test")
    provider = auto_provider("anthropic")
    assert isinstance(provider, AnthropicProvider)


def test_auto_provider_picks_ollama_when_no_keys(monkeypatch: pytest.MonkeyPatch):
    _clear_provider_env(monkeypatch)
    provider = auto_provider()
    assert isinstance(provider, OllamaProvider)


def test_auto_provider_picks_anthropic_first(monkeypatch: pytest.MonkeyPatch):
    """When both keys are present, Anthropic wins by resolution order."""
    _clear_provider_env(monkeypatch)
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test")
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    provider = auto_provider()
    assert isinstance(provider, AnthropicProvider)


def test_auto_provider_picks_openai_when_only_openai_key(monkeypatch: pytest.MonkeyPatch):
    _clear_provider_env(monkeypatch)
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    provider = auto_provider()
    assert isinstance(provider, OpenAIProvider)


def test_auto_provider_honours_umbris_provider_env(monkeypatch: pytest.MonkeyPatch):
    """UMBRIS_PROVIDER env var takes precedence over auto-detection."""
    _clear_provider_env(monkeypatch)
    monkeypatch.setenv("UMBRIS_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test")
    provider = auto_provider()
    assert isinstance(provider, OpenAIProvider)


# ──────────────────────────────────────────────────────────────────
# LLMClient · backward-compat + provider override
# ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_llm_client_uses_mock_provider_when_passed():
    mock = MockProvider(responses=["client routed correctly"])
    llm = LLMClient(provider=mock)
    r = await llm.complete(system="s", user="u")
    assert r.text == "client routed correctly"
    assert r.provider == "mock"
    assert llm.provider_name == "mock"


@pytest.mark.asyncio
async def test_llm_client_picks_provider_default_models():
    """Per-role defaults should come from the provider when not overridden."""
    mock = MockProvider()
    llm = LLMClient(provider=mock)
    assert llm.default_worker_model == "mock-worker"
    assert llm.default_scout_model == "mock-scout"
    assert llm.default_judge_model == "mock-judge"
    assert llm.default_verifier_model == "mock-verifier"


@pytest.mark.asyncio
async def test_llm_client_explicit_model_overrides_default():
    mock = MockProvider()
    llm = LLMClient(
        provider=mock,
        default_worker_model="explicit-worker",
    )
    assert llm.default_worker_model == "explicit-worker"


@pytest.mark.asyncio
async def test_llm_client_tracks_spent_usd():
    mock = MockProvider(responses=["a", "b", "c"])
    llm = LLMClient(provider=mock)
    for _ in range(3):
        await llm.complete(system="s", user="u")
    # MockProvider returns 0.0 cost · spent should stay 0.
    assert llm.spent_usd == 0.0


@pytest.mark.asyncio
async def test_llm_client_default_model_used_when_none_passed():
    mock = MockProvider()
    llm = LLMClient(provider=mock)
    await llm.complete(system="s", user="u")
    # The MockProvider should have been called with the worker default.
    assert mock.calls[0].model == "mock-worker"


@pytest.mark.asyncio
async def test_llm_client_budget_remaining():
    mock = MockProvider()
    llm = LLMClient(provider=mock, budget_usd=10.0)
    assert llm.budget_remaining_usd == 10.0
    assert not llm.is_budget_exhausted()


@pytest.mark.asyncio
async def test_llm_client_aclose_propagates_to_provider():
    mock = MockProvider()
    llm = LLMClient(provider=mock)
    # Should not raise.
    await llm.aclose()
