"""
umbris.memory.vector

Qdrant client wrapper. v1.1 stub · interface only, no concrete adapter.

The Umbra does not depend on memory in v1.1; this module exists so the
extension seam is visible from day one. Wire to Qdrant in a later revolution.
"""

from __future__ import annotations

import abc
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class VectorHit:
    id: str
    score: float
    payload: dict[str, Any]


class VectorMemory(abc.ABC):
    """Abstract vector-memory interface. Concrete adapters (Qdrant,
    pgvector, in-memory) implement this without touching planet code."""

    @abc.abstractmethod
    async def upsert(self, *, id: str, vector: list[float], payload: dict[str, Any]) -> None: ...

    @abc.abstractmethod
    async def search(self, *, vector: list[float], k: int = 5) -> list[VectorHit]: ...


class NullVectorMemory(VectorMemory):
    """v1.1 default: stores nothing, returns nothing. Lets planets call the
    interface without crashing before a real backend is wired."""

    async def upsert(self, *, id: str, vector: list[float], payload: dict[str, Any]) -> None:
        return None

    async def search(self, *, vector: list[float], k: int = 5) -> list[VectorHit]:
        return []
