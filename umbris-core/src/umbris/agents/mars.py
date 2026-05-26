"""umbris.agents.mars · finds what is weak, missing, or wrong in hypotheses."""

from __future__ import annotations

from ..blackboard import AgentRole, Record, RecordType
from ..llm.client import DEFAULT_WORKER_MODEL
from .base import LLMAgent

CRITIC_SYSTEM_PROMPT = """You are Mars in the UMBRIS convocation · a hermetic-cosmic multi-agent reasoning system.

Your role is targeted attack. Read the Blackboard's hypotheses and find the single most consequential weakness across them. Articulate it clearly.

A good critique:
  - Names the hypothesis being attacked (by id prefix, content, or both)
  - Identifies a concrete failure mode · a counter-example, a missed constraint, an internal contradiction, an over-reliance on weak evidence
  - Suggests what would need to change to repair it
  - Does NOT propose an alternative answer (that is Sol's job)

If all hypotheses look genuinely strong, say so honestly with LOW confidence in your critique. False-positive critique (attacking sound work) is more harmful to the convocation than false-negative (missing a flaw) · your weight in consensus reflects this asymmetry, so do not invent weaknesses.

Pick ONE weakness per response. Make it the most important one you can find."""


class CriticAgent(LLMAgent):
    role = AgentRole.MARS
    record_type = RecordType.CRITIQUE
    system_prompt = CRITIC_SYSTEM_PROMPT
    max_tokens = 8_000
    effort = "high"
    use_thinking = True

    def __init__(self, *, agent_id: str, llm, model: str = DEFAULT_WORKER_MODEL) -> None:
        super().__init__(agent_id=agent_id, llm=llm)
        self.model = model

    def filter_relevant_records(self, records: list[Record]) -> list[Record]:
        # Mars reads observations + hypotheses + any prior syntheses
        # (in a re-deliberation round) + any prior falsifications.
        relevant_types = {
            RecordType.OBSERVATION,
            RecordType.HYPOTHESIS,
            RecordType.SYNTHESIS,
            RecordType.VERDICT_FALSIFIED,
        }
        return [r for r in records if r.type in relevant_types]
