"""
umbris.agents.base

The Agent contract. Every concrete planet is a subclass with a single
required method:

    async def think(self, task: Task, blackboard: Blackboard) -> Record

See docs/architecture.md §2 for the constraints (no private channels,
no global mutable state, one Record per think, bounded cost).

This file also provides `LLMAgent`, a concrete base that handles the
common read-Blackboard / call-LLM / parse-Record loop. Most planets
inherit from `LLMAgent` and only override role-specific bits:
  - filter_relevant_records: which records this role should read
  - parse_response: how to turn the LLM's JSON into Record content
"""

from __future__ import annotations

import abc
import json
import re
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any
from uuid import UUID

from ..blackboard import AgentRole, Blackboard, Record, RecordType

if TYPE_CHECKING:
    from ..llm.client import LLMClient


@dataclass(frozen=True)
class Budget:
    """Hard ceilings enforced by the Umbra Core for a single revolution."""

    max_agents: int = 16
    max_worker_rounds: int = 3
    max_total_usd: float | None = None  # None = unbounded for v1.1


@dataclass(frozen=True)
class Task:
    """The unit of work handed to a planet.

    `query` is the user's original prompt. `instructions` is the
    role-specific instruction the Umbra synthesises for this planet.
    """

    query: str
    instructions: str
    budget: Budget = field(default_factory=Budget)


class Agent(abc.ABC):
    """Abstract base for every UMBRIS planet.

    Planets are stateless across revolutions. All per-revolution state lives on
    the Blackboard. Long-term memory (vector, graph) is read-only
    during cognition; writes go through the Umbra.
    """

    role: AgentRole
    model: str
    system_prompt: str

    def __init__(self, *, agent_id: str, llm: LLMClient) -> None:
        self.agent_id = agent_id
        self.llm = llm

    @abc.abstractmethod
    async def think(self, task: Task, blackboard: Blackboard) -> Record:
        """Read the Blackboard, do one unit of cognition, return one Record.

        If the planet has nothing useful to add, return a Record of type
        `noop` with a reason in `content`.
        """


# ──────────────────────────────────────────────────────────────────
# LLMAgent · concrete base for planets that call Claude
# ──────────────────────────────────────────────────────────────────


class LLMAgent(Agent):
    """Concrete base that wraps the read / call / parse / record loop.

    Subclasses override:
      - `record_type` (class attr): the RecordType this planet emits.
      - `filter_relevant_records`: which records to feed into the prompt.
      - Optionally `parse_response` if the JSON shape is non-default.
    """

    record_type: RecordType
    max_tokens: int = 8_000
    effort: str = "high"
    use_thinking: bool = True

    @abc.abstractmethod
    def filter_relevant_records(self, records: list[Record]) -> list[Record]:
        """Return the subset of records this planet should reason from."""

    async def think(self, task: Task, blackboard: Blackboard) -> Record:
        all_records = await blackboard.read()
        relevant = self.filter_relevant_records(all_records)
        context = format_records_as_context(relevant)
        user_message = self._build_user_message(task, context)

        result = await self.llm.complete(
            system=self.system_prompt,
            user=user_message,
            model=self.model,
            max_tokens=self.max_tokens,
            thinking=self.use_thinking,
            effort=self.effort,
        )

        content, confidence, parsed_extras = self.parse_response(result.text)

        return Record(
            agent_id=self.agent_id,
            agent_role=self.role,
            parent_ids=tuple(r.id for r in relevant),
            type=parsed_extras.get("record_type", self.record_type),
            content=content,
            confidence=confidence,
            model=result.model,
            cost_estimate=result.cost_usd,
        )

    def _build_user_message(self, task: Task, context: str) -> str:
        return (
            f"# Query\n{task.query}\n\n"
            f"# Your role-specific instructions\n{task.instructions}\n\n"
            f"# Blackboard (records from earlier planets)\n{context}\n\n"
            f"# Response format\n{self._response_format_instructions()}"
        )

    def _response_format_instructions(self) -> str:
        return (
            "Respond with a single JSON object, and ONLY that object · no\n"
            "preamble, no markdown fences, no commentary. Schema:\n"
            "{\n"
            '  "content": <your output as string or object>,\n'
            '  "confidence": <float 0.0 to 1.0, your self-assessed confidence>\n'
            "}"
        )

    def parse_response(self, text: str) -> tuple[Any, float, dict[str, Any]]:
        """Default parser: extract a JSON object with `content` + `confidence`.

        Returns (content, confidence, extras_dict). Subclasses can override
        to return additional fields via the extras dict · e.g. Saturnus
        sets `record_type` based on whether the candidate was falsified.
        """
        payload = _extract_json_object(text)
        content = payload.get("content", text)
        confidence = float(payload.get("confidence", 0.5))
        confidence = max(0.0, min(1.0, confidence))
        return content, confidence, {}


# ──────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────


def format_records_as_context(records: list[Record]) -> str:
    """Render a list of Records as a human-readable context block."""
    if not records:
        return "(no prior records)"
    parts: list[str] = []
    for r in records:
        header = (
            f"--- [{r.type.value}] from {r.agent_role.value}/{r.agent_id} "
            f"(confidence={r.confidence:.2f}, id={str(r.id)[:8]}) ---"
        )
        body = r.content if isinstance(r.content, str) else json.dumps(r.content, indent=2)
        parts.append(header)
        parts.append(body)
        parts.append("")
    return "\n".join(parts)


_JSON_OBJECT_RE = re.compile(r"\{.*\}", re.DOTALL)


def _extract_json_object(text: str) -> dict[str, Any]:
    """Best-effort JSON extraction.

    Models occasionally wrap JSON in markdown fences or add preamble
    even when told not to. We strip fences first, then try whole-text
    parse, then fall back to the first {...} match.
    """
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        result = json.loads(cleaned)
        if isinstance(result, dict):
            return result
    except json.JSONDecodeError:
        pass

    match = _JSON_OBJECT_RE.search(cleaned)
    if match:
        try:
            result = json.loads(match.group(0))
            if isinstance(result, dict):
                return result
        except json.JSONDecodeError:
            pass

    # Last resort: wrap whatever we got as content with mid confidence.
    return {"content": text, "confidence": 0.3}


__all__ = [
    "Agent",
    "Budget",
    "LLMAgent",
    "Task",
    "format_records_as_context",
]
