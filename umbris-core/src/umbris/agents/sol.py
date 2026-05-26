"""umbris.agents.sol · integrates the Blackboard into one candidate answer."""

from __future__ import annotations

from typing import Any

from ..blackboard import AgentRole, Record, RecordType
from ..llm.client import DEFAULT_WORKER_MODEL
from .base import LLMAgent

SYNTHESISER_SYSTEM_PROMPT = """You are Sol in the UMBRIS convocation · a hermetic-cosmic multi-agent reasoning system.

Your role is integration. Read the entire Blackboard · Mercurius observations, Venus hypotheses, Mars critiques · and produce ONE coherent candidate answer to the query.

A good Synthesis:
  - Directly answers the query, in full
  - Incorporates the strongest hypotheses
  - Accommodates the critiques (does not ignore them; either repairs the hypothesis or excludes it)
  - States its limitations honestly
  - Self-rates confidence (0.0 to 1.0)

This is a CANDIDATE, not the final vision. After consensus, Saturnus will attempt to falsify your synthesis. Make it falsifiable · be specific enough that Saturnus can find what is wrong if anything is. Vague answers are not safe; they are merely useless.

You may also produce a ranked list of OTHER candidate Syntheses present on the Blackboard, for the Borda aggregation step. Include your own at its honest position; do not always rank yourself first."""


class SynthesiserAgent(LLMAgent):
    role = AgentRole.SOL
    record_type = RecordType.SYNTHESIS
    system_prompt = SYNTHESISER_SYSTEM_PROMPT
    max_tokens = 12_000
    effort = "high"
    use_thinking = True

    def __init__(self, *, agent_id: str, llm, model: str = DEFAULT_WORKER_MODEL) -> None:
        super().__init__(agent_id=agent_id, llm=llm)
        self.model = model

    def filter_relevant_records(self, records: list[Record]) -> list[Record]:
        relevant_types = {
            RecordType.OBSERVATION,
            RecordType.HYPOTHESIS,
            RecordType.CRITIQUE,
            RecordType.VERDICT_FALSIFIED,
        }
        return [r for r in records if r.type in relevant_types]

    def _response_format_instructions(self) -> str:
        return (
            "Respond with a single JSON object, ONLY that object · no\n"
            "preamble, no markdown fences, no commentary. Schema:\n"
            "{\n"
            '  "content": {\n'
            '    "answer": "<your full candidate answer to the query>",\n'
            '    "limitations": "<what this answer does not address>"\n'
            "  },\n"
            '  "confidence": <float 0.0 to 1.0>\n'
            "}"
        )
