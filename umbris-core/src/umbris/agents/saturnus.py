"""umbris.agents.saturnus · attempts to falsify a chosen Synthesis candidate."""

from __future__ import annotations

from typing import Any

from ..blackboard import AgentRole, Record, RecordType
from ..llm.client import DEFAULT_VERIFIER_MODEL
from .base import LLMAgent

VERIFIER_SYSTEM_PROMPT = """You are Saturnus in the UMBRIS convocation · a hermetic-cosmic multi-agent reasoning system.

Your role is the opposite of synthesis: attempt to FALSIFY the candidate answer you are given.

Look for:
  - Counter-examples that break the candidate's claim
  - Internal contradictions within the candidate's reasoning
  - Constraints from the original query that the candidate violates
  - Hidden assumptions the candidate makes that are not supported by the Blackboard
  - Edge cases where the candidate would produce an obviously wrong result

If you find a specific, defensible falsification: return verdict = "falsified" with the falsification stated precisely.

If after honest effort you cannot falsify the candidate: return verdict = "accepted" with a brief note on why your attack failed.

Do NOT hedge. A verdict is binary. Confidence reflects how certain you are of your verdict · high (>0.8) when the falsification is unambiguous or the candidate is clearly sound, lower when you are uncertain.

Verification is bounded: this candidate has at most 3 attempts to survive. Do not invent flaws. False-positive falsification is more harmful than missing a real one."""


class VerifierAgent(LLMAgent):
    role = AgentRole.SATURNUS
    record_type = RecordType.VERDICT_ACCEPTED  # default; overridden by parser
    system_prompt = VERIFIER_SYSTEM_PROMPT
    max_tokens = 8_000
    effort = "high"
    use_thinking = True

    def __init__(self, *, agent_id: str, llm, model: str = DEFAULT_VERIFIER_MODEL) -> None:
        super().__init__(agent_id=agent_id, llm=llm)
        self.model = model

    def filter_relevant_records(self, records: list[Record]) -> list[Record]:
        # Saturnus reads the full deliberation trail to find weak spots.
        relevant_types = {
            RecordType.OBSERVATION,
            RecordType.HYPOTHESIS,
            RecordType.CRITIQUE,
            RecordType.SYNTHESIS,
        }
        return [r for r in records if r.type in relevant_types]

    def _response_format_instructions(self) -> str:
        return (
            "Respond with a single JSON object, ONLY that object · no\n"
            "preamble, no markdown fences, no commentary. Schema:\n"
            "{\n"
            '  "verdict": "accepted" | "falsified",\n'
            '  "content": "<reasoning for your verdict, including the\n'
            '              specific falsification if verdict is falsified>",\n'
            '  "confidence": <float 0.0 to 1.0>\n'
            "}"
        )

    def parse_response(self, text: str) -> tuple[Any, float, dict[str, Any]]:
        from .base import _extract_json_object

        payload = _extract_json_object(text)
        verdict = str(payload.get("verdict", "accepted")).strip().lower()
        content = payload.get("content", text)
        confidence = float(payload.get("confidence", 0.5))
        confidence = max(0.0, min(1.0, confidence))

        record_type = (
            RecordType.VERDICT_FALSIFIED
            if verdict == "falsified"
            else RecordType.VERDICT_ACCEPTED
        )
        return content, confidence, {"record_type": record_type}
