"""
umbris.blackboard

The append-only, typed event log that is the only communication
medium between planets in UMBRIS. Poetically called the Umbra
substrate; in code it stays `Blackboard` for clarity.

Append-only buys us a causal DAG (via parent_ids), time-travel
debugging, complete provenance, and optimistic concurrency for free.
See docs/whitepaper.md §3 and docs/architecture.md §3.
"""

from __future__ import annotations

import abc
from datetime import datetime, timezone
from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class AgentRole(StrEnum):
    MERCURIUS = "mercurius"
    VENUS = "venus"
    MARS = "mars"
    SOL = "sol"
    LUNA = "luna"
    STELLA = "stella"
    SATURNUS = "saturnus"
    IUPPITER = "iuppiter"
    UMBRA = "umbra"


class RecordType(StrEnum):
    TASK = "task"
    OBSERVATION = "observation"
    HYPOTHESIS = "hypothesis"
    CRITIQUE = "critique"
    SYNTHESIS = "synthesis"
    PLAN = "plan"
    ACTION = "action"
    VERDICT_ACCEPTED = "verdict.accepted"
    VERDICT_FALSIFIED = "verdict.falsified"
    BUDGET_EXHAUSTED = "verdict.budget_exhausted"
    PROVENANCE_SUMMARY = "provenance.summary"
    NOOP = "noop"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Record(BaseModel):
    """A single immutable entry on the Blackboard."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    id: UUID = Field(default_factory=uuid4)
    agent_id: str
    agent_role: AgentRole
    parent_ids: tuple[UUID, ...] = ()
    type: RecordType
    content: Any
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    model: str | None = None
    cost_estimate: float = Field(default=0.0, ge=0.0)
    timestamp: datetime = Field(default_factory=_utcnow)


class Blackboard(abc.ABC):
    """Abstract interface so backends (in-memory, Redis, CRDT) can be swapped."""

    @abc.abstractmethod
    async def append(self, record: Record) -> None: ...

    @abc.abstractmethod
    async def read(
        self,
        *,
        types: list[RecordType] | None = None,
        roles: list[AgentRole] | None = None,
        since: datetime | None = None,
    ) -> list[Record]: ...

    @abc.abstractmethod
    def snapshot(self) -> tuple[Record, ...]:
        """Return all records in append order."""


class InMemoryBlackboard(Blackboard):
    """The v1.1 backend: a single-process append-only list.

    Thread-safety: not safe across OS threads. Safe within a single
    asyncio event loop because list.append is atomic at the C level
    in CPython. See whitepaper §3.3.
    """

    def __init__(self) -> None:
        self._records: list[Record] = []

    async def append(self, record: Record) -> None:
        self._records.append(record)

    async def read(
        self,
        *,
        types: list[RecordType] | None = None,
        roles: list[AgentRole] | None = None,
        since: datetime | None = None,
    ) -> list[Record]:
        records: list[Record] = list(self._records)
        if types is not None:
            type_set = set(types)
            records = [r for r in records if r.type in type_set]
        if roles is not None:
            role_set = set(roles)
            records = [r for r in records if r.agent_role in role_set]
        if since is not None:
            records = [r for r in records if r.timestamp >= since]
        return records

    def snapshot(self) -> tuple[Record, ...]:
        return tuple(self._records)

    def __len__(self) -> int:
        return len(self._records)
