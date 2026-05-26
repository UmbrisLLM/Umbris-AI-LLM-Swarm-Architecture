"""umbris.agents.iuppiter · adjudicates near-ties between candidate Syntheses."""

from __future__ import annotations

from typing import Any

from ..blackboard import AgentRole, Record, RecordType
from ..llm.client import DEFAULT_JUDGE_MODEL
from .base import LLMAgent

JUDGE_SYSTEM_PROMPT = """You are Iuppiter in the UMBRIS convocation · a hermetic-cosmic multi-agent reasoning system.

Your role is adjudication. You are called only when Borda aggregation produced a near-tie between two candidate Syntheses (within 5% of each other). Your job is to pick the winner.

You will receive both candidates by ID, plus the full Blackboard trace that produced them. A good judgment:
  - Identifies the chosen candidate by id (the prefix shown is enough)
  - Articulates substantive reasons for the choice · not stylistic ones
  - Acknowledges what was strong about the runner-up
  - Self-rates confidence (low if the call is close)

Do not split the difference. The convocation needs a definite answer. If the candidates are genuinely indistinguishable on substance, pick the one that is more falsifiable · being wrong in a checkable way is better than being right by accident."""


class JudgeAgent(LLMAgent):
    role = AgentRole.IUPPITER
    record_type = RecordType.VERDICT_ACCEPTED
    system_prompt = JUDGE_SYSTEM_PROMPT
    max_tokens = 6_000
    effort = "high"
    use_thinking = True

    def __init__(self, *, agent_id: str, llm, model: str = DEFAULT_JUDGE_MODEL) -> None:
        super().__init__(agent_id=agent_id, llm=llm)
        self.model = model

    def filter_relevant_records(self, records: list[Record]) -> list[Record]:
        # Iuppiter sees the full trace.
        return list(records)

    def _response_format_instructions(self) -> str:
        return (
            "Respond with a single JSON object, ONLY that object · no\n"
            "preamble, no markdown fences, no commentary. Schema:\n"
            "{\n"
            '  "chosen_candidate_id": "<full UUID of the chosen Synthesis>",\n'
            '  "content": "<reasoning: why this candidate won, what the\n'
            '              runner-up did well>",\n'
            '  "confidence": <float 0.0 to 1.0>\n'
            "}"
        )

    def parse_response(self, text: str) -> tuple[Any, float, dict[str, Any]]:
        from .base import _extract_json_object

        payload = _extract_json_object(text)
        # Iuppiter's content is a structured object so consensus.judge_adjudicate
        # can fish out the chosen_candidate_id.
        content = {
            "chosen_candidate_id": payload.get("chosen_candidate_id"),
            "reasoning": payload.get("content", text),
        }
        confidence = float(payload.get("confidence", 0.5))
        confidence = max(0.0, min(1.0, confidence))
        return content, confidence, {}
