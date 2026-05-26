"""Tests for consensus · borda_aggregate is the foundation."""

from __future__ import annotations

import pytest
from uuid import uuid4

from umbris.blackboard import AgentRole, Record, RecordType
from umbris.consensus import (
    DEFAULT_ROLE_WEIGHTS,
    Ranking,
    borda_aggregate,
    is_near_tie,
)


def _synth(agent_id: str, confidence: float = 0.8) -> Record:
    return Record(
        agent_id=agent_id,
        agent_role=AgentRole.SOL,
        type=RecordType.SYNTHESIS,
        content=f"answer from {agent_id}",
        confidence=confidence,
    )


def test_borda_with_no_rankings_returns_zero_scores():
    candidates = [_synth("a"), _synth("b")]
    scored = borda_aggregate(candidates, [])
    assert all(s.score == 0.0 for s in scored)
    assert len(scored) == 2


def test_borda_single_voter_picks_first_ranked():
    a = _synth("a")
    b = _synth("b")
    rankings = [
        Ranking(
            voter_role=AgentRole.SOL,
            voter_id="v1",
            ranked_candidate_ids=(a.id, b.id),
        )
    ]
    scored = borda_aggregate([a, b], rankings)
    assert scored[0].record.id == a.id
    # 2 candidates: first gets 2 pts, second gets 1; weight 1.5 for sol.
    assert scored[0].score == 2 * DEFAULT_ROLE_WEIGHTS[AgentRole.SOL]
    assert scored[1].score == 1 * DEFAULT_ROLE_WEIGHTS[AgentRole.SOL]


def test_borda_aggregates_across_voters():
    a = _synth("a")
    b = _synth("b")
    c = _synth("c")
    # v1 prefers a > b > c; v2 prefers b > a > c
    rankings = [
        Ranking(AgentRole.VENUS, "v1", (a.id, b.id, c.id)),
        Ranking(AgentRole.MARS,  "v2", (b.id, a.id, c.id)),
    ]
    scored = borda_aggregate([a, b, c], rankings)
    # a: 3*1.0 + 2*1.2 = 5.4
    # b: 2*1.0 + 3*1.2 = 5.6
    # c: 1*1.0 + 1*1.2 = 2.2
    by_id = {s.record.id: s.score for s in scored}
    assert by_id[a.id] == pytest.approx(5.4)
    assert by_id[b.id] == pytest.approx(5.6)
    assert by_id[c.id] == pytest.approx(2.2)
    assert scored[0].record.id == b.id


def test_borda_ignores_unknown_candidates_in_rankings():
    a = _synth("a")
    bogus_id = uuid4()
    rankings = [
        Ranking(AgentRole.SOL, "v1", (a.id, bogus_id)),
    ]
    scored = borda_aggregate([a], rankings)
    assert scored[0].record.id == a.id


def test_is_near_tie_true_when_within_epsilon():
    from umbris.consensus import ScoredCandidate
    a = _synth("a")
    b = _synth("b")
    scored = [
        ScoredCandidate(record=a, score=10.0),
        ScoredCandidate(record=b, score=9.7),  # 3% gap
    ]
    assert is_near_tie(scored, epsilon=0.05) is True


def test_is_near_tie_false_when_outside_epsilon():
    from umbris.consensus import ScoredCandidate
    a = _synth("a")
    b = _synth("b")
    scored = [
        ScoredCandidate(record=a, score=10.0),
        ScoredCandidate(record=b, score=8.0),  # 20% gap
    ]
    assert is_near_tie(scored, epsilon=0.05) is False


def test_is_near_tie_false_with_one_candidate():
    from umbris.consensus import ScoredCandidate
    scored = [ScoredCandidate(record=_synth("a"), score=10.0)]
    assert is_near_tie(scored) is False


def test_borda_ordering_is_descending():
    candidates = [_synth(f"a{i}") for i in range(5)]
    rankings = [
        Ranking(
            AgentRole.SOL, "v1",
            tuple(c.id for c in candidates),
        )
    ]
    scored = borda_aggregate(candidates, rankings)
    scores = [s.score for s in scored]
    assert scores == sorted(scores, reverse=True)
