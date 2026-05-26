"""Tests for the Blackboard · append, read with filters, snapshot."""

from __future__ import annotations

import pytest

from umbris.blackboard import (
    AgentRole,
    InMemoryBlackboard,
    Record,
    RecordType,
)


def _record(
    agent_id: str = "test",
    role: AgentRole = AgentRole.MERCURIUS,
    rtype: RecordType = RecordType.OBSERVATION,
    content: str = "hello",
    confidence: float = 0.7,
) -> Record:
    return Record(
        agent_id=agent_id,
        agent_role=role,
        type=rtype,
        content=content,
        confidence=confidence,
    )


@pytest.mark.asyncio
async def test_append_and_snapshot_in_order():
    bb = InMemoryBlackboard()
    r1 = _record(agent_id="a", content="first")
    r2 = _record(agent_id="b", content="second")
    await bb.append(r1)
    await bb.append(r2)

    snap = bb.snapshot()
    assert len(snap) == 2
    assert snap[0].agent_id == "a"
    assert snap[1].agent_id == "b"


@pytest.mark.asyncio
async def test_read_filters_by_type():
    bb = InMemoryBlackboard()
    await bb.append(_record(rtype=RecordType.OBSERVATION, content="o"))
    await bb.append(_record(rtype=RecordType.HYPOTHESIS, content="h"))
    await bb.append(_record(rtype=RecordType.CRITIQUE, content="c"))

    obs = await bb.read(types=[RecordType.OBSERVATION])
    assert len(obs) == 1
    assert obs[0].content == "o"

    h_or_c = await bb.read(types=[RecordType.HYPOTHESIS, RecordType.CRITIQUE])
    assert len(h_or_c) == 2


@pytest.mark.asyncio
async def test_read_filters_by_role():
    bb = InMemoryBlackboard()
    await bb.append(_record(role=AgentRole.MERCURIUS, content="s"))
    await bb.append(_record(role=AgentRole.VENUS, content="r"))

    scouts = await bb.read(roles=[AgentRole.MERCURIUS])
    assert len(scouts) == 1
    assert scouts[0].content == "s"


@pytest.mark.asyncio
async def test_records_are_frozen():
    r = _record()
    with pytest.raises(Exception):  # pydantic raises ValidationError
        r.content = "mutated"


@pytest.mark.asyncio
async def test_record_confidence_bounds():
    # Pydantic should reject out-of-range confidence.
    with pytest.raises(Exception):
        Record(
            agent_id="x",
            agent_role=AgentRole.MERCURIUS,
            type=RecordType.NOOP,
            content="",
            confidence=1.5,
        )
