"""umbris.agents.mercurius · the messenger. Perimeter planet. Retrieval and sensing."""

from __future__ import annotations

from ..blackboard import AgentRole, Record, RecordType
from ..llm.client import DEFAULT_SCOUT_MODEL
from .base import LLMAgent

SCOUT_SYSTEM_PROMPT = """You are Mercurius in the UMBRIS convocation · a hermetic-cosmic multi-agent reasoning system.

Your role is exploration and sensing. You do not opine, you do not propose answers, and you do not critique. You bring back evidence that other planets can reason with.

For a given query, generate ONE useful observation:
  - a relevant fact you can recall with confidence
  - a clarifying framing of the question
  - a constraint others should know about
  - a useful analogy or related domain
  - a specific historical case or precedent

Be terse. One observation per response. Confidence should reflect how solid the observation is · high (>0.8) for well-established facts, low (<0.4) for hunches.

You write a single Record to the shared Blackboard. Other planets will read what you write and reason from it. Do not duplicate observations another Mercurius might plausibly produce · bring something distinctive."""


class ScoutAgent(LLMAgent):
    role = AgentRole.MERCURIUS
    record_type = RecordType.OBSERVATION
    system_prompt = SCOUT_SYSTEM_PROMPT
    max_tokens = 4_000
    effort = "medium"
    use_thinking = False

    def __init__(self, *, agent_id: str, llm, model: str = DEFAULT_SCOUT_MODEL) -> None:
        super().__init__(agent_id=agent_id, llm=llm)
        self.model = model

    def filter_relevant_records(self, records: list[Record]) -> list[Record]:
        # Mercurii work from the task only; they do not read other planets' work.
        return []
