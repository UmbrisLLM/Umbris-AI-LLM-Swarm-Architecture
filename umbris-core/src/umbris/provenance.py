"""
umbris.provenance

Cost ledger and DAG serialisation. Every Record carries its own
cost_estimate; this module aggregates them, plus prices LLM calls
in plain USD using the official Anthropic pricing table.

Prices are versioned with a `PRICING_AS_OF` constant so we know
when to refresh.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .blackboard import AgentRole, Blackboard, Record, RecordType

# Pricing in USD per 1M tokens. Source: https://www.anthropic.com/pricing
# Cache write multiplier is 1.25x input (5-minute TTL); cache read is ~0.1x input.
# Refresh PRICING_AS_OF when models or prices change.
PRICING_AS_OF = "2026-05"

PRICING_USD_PER_MTOK: dict[str, dict[str, float]] = {
    "claude-opus-4-7":   {"input": 5.00, "output": 25.00, "cache_write": 6.25, "cache_read": 0.50},
    "claude-opus-4-6":   {"input": 5.00, "output": 25.00, "cache_write": 6.25, "cache_read": 0.50},
    "claude-sonnet-4-6": {"input": 3.00, "output": 15.00, "cache_write": 3.75, "cache_read": 0.30},
    "claude-haiku-4-5":  {"input": 1.00, "output":  5.00, "cache_write": 1.25, "cache_read": 0.10},
}


@dataclass(frozen=True)
class TokenUsage:
    input_tokens: int = 0
    output_tokens: int = 0
    cache_creation_tokens: int = 0
    cache_read_tokens: int = 0


def estimate_cost_usd(model: str, usage: TokenUsage) -> float:
    """Estimate USD cost for a single LLM call."""
    table = PRICING_USD_PER_MTOK.get(model)
    if table is None:
        # Unknown model · return 0 rather than guessing. Caller decides.
        return 0.0
    return (
        usage.input_tokens          * table["input"]       / 1_000_000
        + usage.output_tokens       * table["output"]      / 1_000_000
        + usage.cache_creation_tokens * table["cache_write"] / 1_000_000
        + usage.cache_read_tokens   * table["cache_read"]  / 1_000_000
    )


@dataclass(frozen=True)
class RunSummary:
    query_id: str
    started_at: datetime
    finished_at: datetime
    wall_seconds: float
    total_records: int
    records_by_role: dict[str, int]
    records_by_type: dict[str, int]
    total_cost_usd: float
    cost_by_model: dict[str, float]


def summarise(blackboard: Blackboard, *, query_id: str, started_at: datetime) -> RunSummary:
    """Aggregate the Blackboard's snapshot into a structured summary."""
    finished = datetime.now(timezone.utc)
    snap = blackboard.snapshot()

    by_role: dict[str, int] = {}
    by_type: dict[str, int] = {}
    cost_by_model: dict[str, float] = {}
    total_cost = 0.0

    for r in snap:
        by_role[r.agent_role.value] = by_role.get(r.agent_role.value, 0) + 1
        by_type[r.type.value] = by_type.get(r.type.value, 0) + 1
        if r.model:
            cost_by_model[r.model] = cost_by_model.get(r.model, 0.0) + r.cost_estimate
        total_cost += r.cost_estimate

    return RunSummary(
        query_id=query_id,
        started_at=started_at,
        finished_at=finished,
        wall_seconds=(finished - started_at).total_seconds(),
        total_records=len(snap),
        records_by_role=by_role,
        records_by_type=by_type,
        total_cost_usd=round(total_cost, 6),
        cost_by_model={k: round(v, 6) for k, v in cost_by_model.items()},
    )


def write_provenance_jsonl(blackboard: Blackboard, *, path: Path) -> Path:
    """Serialise the full Blackboard snapshot to JSONL for replay."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for record in blackboard.snapshot():
            f.write(_record_to_json(record) + "\n")
    return path


def _record_to_json(r: Record) -> str:
    payload: dict[str, Any] = {
        "id": str(r.id),
        "agent_id": r.agent_id,
        "agent_role": r.agent_role.value,
        "parent_ids": [str(p) for p in r.parent_ids],
        "type": r.type.value,
        "content": r.content,
        "confidence": r.confidence,
        "model": r.model,
        "cost_estimate": r.cost_estimate,
        "timestamp": r.timestamp.isoformat(),
    }
    return json.dumps(payload, ensure_ascii=False, default=str)


def make_summary_record(summary: RunSummary) -> Record:
    """Wrap a RunSummary as a Record so it lives on the Blackboard too."""
    return Record(
        agent_id="umbra",
        agent_role=AgentRole.UMBRA,
        type=RecordType.PROVENANCE_SUMMARY,
        content={
            "query_id": summary.query_id,
            "started_at": summary.started_at.isoformat(),
            "finished_at": summary.finished_at.isoformat(),
            "wall_seconds": summary.wall_seconds,
            "total_records": summary.total_records,
            "records_by_role": summary.records_by_role,
            "records_by_type": summary.records_by_type,
            "total_cost_usd": summary.total_cost_usd,
            "cost_by_model": summary.cost_by_model,
            "pricing_as_of": PRICING_AS_OF,
        },
        confidence=1.0,
    )
