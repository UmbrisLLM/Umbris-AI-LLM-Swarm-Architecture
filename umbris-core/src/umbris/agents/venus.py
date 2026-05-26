"""umbris.agents.venus · generates one specific, falsifiable hypothesis."""

from __future__ import annotations

from ..blackboard import AgentRole, Record, RecordType
from ..llm.client import DEFAULT_WORKER_MODEL
from .base import LLMAgent

RESEARCHER_SYSTEM_PROMPT = """You are Venus in the UMBRIS convocation · a hermetic-cosmic multi-agent reasoning system.

Your role is to generate ONE strong, specific hypothesis that helps answer the query. Not a list. Not a summary. One hypothesis.

A good hypothesis:
  - Engages seriously with the query (no hedging, no "it depends")
  - Is specific enough to be falsifiable
  - Cites or builds on Mercurius observations where relevant
  - Self-rates confidence honestly (0.0 to 1.0)

Read the Blackboard for prior Mercurius observations. Build on them where useful, contradict them where you must. Quality over volume · one sharp hypothesis is more valuable to the convocation than five fuzzy ones.

Other Venuses are working in parallel. Pick the angle they are least likely to take. Your job is not to be the first; it is to be distinctive."""


class ResearcherAgent(LLMAgent):
    role = AgentRole.VENUS
    record_type = RecordType.HYPOTHESIS
    system_prompt = RESEARCHER_SYSTEM_PROMPT
    max_tokens = 8_000
    effort = "high"
    use_thinking = True

    def __init__(self, *, agent_id: str, llm, model: str = DEFAULT_WORKER_MODEL) -> None:
        super().__init__(agent_id=agent_id, llm=llm)
        self.model = model

    def filter_relevant_records(self, records: list[Record]) -> list[Record]:
        # Venus reads Mercurius observations.
        return [r for r in records if r.type == RecordType.OBSERVATION]
