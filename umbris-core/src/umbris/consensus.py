"""
umbris.consensus

Three independently testable functions:

    borda_aggregate   · pure ranking aggregation, no I/O
    judge_adjudicate  · calls Iuppiter on near-ties
    verify            · calls Saturnus to attempt falsification

See docs/whitepaper.md §4 and docs/architecture.md §4.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING
from uuid import UUID

from .blackboard import AgentRole, Blackboard, Record, RecordType

if TYPE_CHECKING:
    from .agents.iuppiter import JudgeAgent
    from .agents.saturnus import VerifierAgent

# Default v1.1 weights. Documented in whitepaper §4.1.
# Mars and Saturnus weighted higher because their failure mode
# (false negatives) is less harmful than Sol's
# (false positives).
DEFAULT_ROLE_WEIGHTS: dict[AgentRole, float] = {
    AgentRole.VENUS:    1.0,
    AgentRole.MARS:     1.2,
    AgentRole.SOL:      1.5,
    AgentRole.SATURNUS: 1.3,
    AgentRole.LUNA:     1.0,
    AgentRole.STELLA:   0.8,
}

# Borda-tie threshold: if top two candidates are within EPSILON of each
# other, Iuppiter fires. See whitepaper §4.1.
EPSILON_TIE = 0.05


@dataclass(frozen=True)
class Ranking:
    """A single planet's ranked list of candidate Synthesis IDs."""

    voter_role: AgentRole
    voter_id: str
    ranked_candidate_ids: tuple[UUID, ...]


@dataclass(frozen=True)
class ScoredCandidate:
    """A candidate Synthesis Record with its aggregate Borda score."""

    record: Record
    score: float


@dataclass(frozen=True)
class Verdict:
    """Outcome of a Saturnus pass."""

    accepted: bool
    falsification_record: Record | None  # Present iff accepted is False


def borda_aggregate(
    candidates: list[Record],
    rankings: list[Ranking],
    weights: dict[AgentRole, float] | None = None,
) -> list[ScoredCandidate]:
    """Weighted Borda count over candidate Synthesis Records.

    - Each ranker assigns descending points (n, n-1, ..., 1) to
      candidates, where n = number of candidates ranked.
    - Each ranker's vote is multiplied by `weights[ranker_role]`.
    - Returns candidates in descending order of score.
    """
    weights = weights if weights is not None else DEFAULT_ROLE_WEIGHTS
    by_id: dict[UUID, Record] = {c.id: c for c in candidates}
    scores: dict[UUID, float] = {cid: 0.0 for cid in by_id}

    for ranking in rankings:
        weight = weights.get(ranking.voter_role, 1.0)
        n = len(ranking.ranked_candidate_ids)
        for position, cid in enumerate(ranking.ranked_candidate_ids):
            if cid not in scores:
                continue  # ignore stale ids
            points = (n - position)
            scores[cid] += points * weight

    scored = [ScoredCandidate(record=by_id[cid], score=score) for cid, score in scores.items()]
    scored.sort(key=lambda s: s.score, reverse=True)
    return scored


def is_near_tie(scored: list[ScoredCandidate], epsilon: float = EPSILON_TIE) -> bool:
    """Whether the top two candidates are within `epsilon` of each other."""
    if len(scored) < 2:
        return False
    top = scored[0].score
    if top <= 0:
        return False
    return (top - scored[1].score) / top < epsilon


async def judge_adjudicate(
    top: list[ScoredCandidate],
    blackboard: Blackboard,
    judge: JudgeAgent,
    query: str,
) -> ScoredCandidate:
    """Have Iuppiter pick a winner from near-tied candidates.

    Iuppiter sees both candidates AND the trace that produced them.
    Its verdict is itself appended to the Blackboard.
    """
    from .agents.base import Task  # local to avoid import cycle

    task = Task(
        query=query,
        instructions=_format_judge_instructions(top),
    )
    verdict_record = await judge.think(task, blackboard)
    await blackboard.append(verdict_record)

    chosen_id = verdict_record.content.get("chosen_candidate_id") if isinstance(verdict_record.content, dict) else None
    if chosen_id:
        for sc in top:
            if str(sc.record.id) == str(chosen_id):
                return sc
    # Fallback: trust Borda's leader if Iuppiter gave no parseable choice.
    return top[0]


async def verify(
    candidate: ScoredCandidate,
    blackboard: Blackboard,
    verifier: VerifierAgent,
    query: str,
) -> Verdict:
    """Run Saturnus and return either acceptance or a falsification."""
    from .agents.base import Task

    task = Task(
        query=query,
        instructions=_format_verifier_instructions(candidate),
    )
    record = await verifier.think(task, blackboard)
    await blackboard.append(record)

    if record.type == RecordType.VERDICT_ACCEPTED:
        return Verdict(accepted=True, falsification_record=None)
    return Verdict(accepted=False, falsification_record=record)


def _format_judge_instructions(top: list[ScoredCandidate]) -> str:
    parts = ["You must choose ONE of the following candidate Syntheses.",
             "Respond as JSON: {\"chosen_candidate_id\": \"<uuid>\", \"reasoning\": \"<short>\"}.",
             ""]
    for i, sc in enumerate(top, 1):
        parts.append(f"--- Candidate {i} (id={sc.record.id}, borda_score={sc.score:.3f}) ---")
        parts.append(str(sc.record.content))
        parts.append("")
    return "\n".join(parts)


def _format_verifier_instructions(candidate: ScoredCandidate) -> str:
    return (
        "Attempt to FALSIFY the following candidate answer. "
        "If you find a counter-example, contradiction, or violated constraint, "
        "respond with type=verdict.falsified and a specific falsification in content. "
        "If after honest effort you find no falsification, respond with type=verdict.accepted.\n\n"
        f"--- Candidate (id={candidate.record.id}) ---\n"
        f"{candidate.record.content}"
    )
