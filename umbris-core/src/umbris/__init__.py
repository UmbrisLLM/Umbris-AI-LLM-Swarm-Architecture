"""
umbris · a hermetic-cosmic multi-agent LLM convocation for collective reasoning.

The public API surface for the UMBRIS engine. The reference orchestration
inherits the OPUS engine semantics with planetary role-name substitution.
The full standalone implementation lands in v1.1.

  from umbris import Convocation, LLMClient
  from umbris.llm.providers import auto_provider

  llm = LLMClient(provider=auto_provider())
  convocation = Convocation(llm=llm)
  vision = await convocation.cast("In one sentence, what is stigmergy?")
  print(vision.answer)
  print(f"Confidence: {vision.confidence}  Cost: ${vision.cost_usd:.4f}")
"""

from __future__ import annotations

__version__ = "1.0.0"

# Public surface · placeholders until v1.1 lands the full engine
__all__ = [
    "__version__",
]
