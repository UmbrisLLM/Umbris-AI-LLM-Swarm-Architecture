"""umbris.agents.luna · decomposes a complex task into sub-tasks.

v1.1 stub: not exercised by hello_convocation. Reserved for tasks that require
multi-step decomposition. The hello_convocation demo runs without Luna.
"""

from __future__ import annotations

from ..blackboard import AgentRole, Record, RecordType
from ..llm.client import DEFAULT_WORKER_MODEL
from .base import LLMAgent

PLANNER_SYSTEM_PROMPT = """You are Luna in the UMBRIS convocation.

Your role is to decompose a complex query into a sequence of concrete sub-tasks that other planets (typically Stella) can act on. You write plan Records to the Blackboard.

A good plan:
  - Has 2-7 sub-tasks; if more, the query is too coarse and should itself be decomposed first
  - Numbers each sub-task and states its goal in one sentence
  - Names dependencies (sub-task 3 requires the output of sub-task 1)
  - Does NOT execute any sub-task itself
"""


class PlannerAgent(LLMAgent):
    role = AgentRole.LUNA
    record_type = RecordType.PLAN
    system_prompt = PLANNER_SYSTEM_PROMPT
    max_tokens = 8_000
    effort = "high"
    use_thinking = True

    def __init__(self, *, agent_id: str, llm, model: str = DEFAULT_WORKER_MODEL) -> None:
        super().__init__(agent_id=agent_id, llm=llm)
        self.model = model

    def filter_relevant_records(self, records: list[Record]) -> list[Record]:
        relevant_types = {RecordType.OBSERVATION, RecordType.HYPOTHESIS}
        return [r for r in records if r.type in relevant_types]
