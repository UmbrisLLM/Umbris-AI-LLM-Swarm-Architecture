"""
umbris.umbra

The Umbra Core: orchestrates one revolution end-to-end.

Lifecycle (whitepaper §6):

    spawn_mercurii ─▶ planets (rounds) ─▶ consensus ─▶ verify
                                                          │
                                falsified ──┐             │
                                            ▼             │
                                  re-deliberate ─ loop ───┘
                                  (max 3 attempts)
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from .agents.base import Budget, Task
from .agents.mars import CriticAgent
from .agents.iuppiter import JudgeAgent
from .agents.venus import ResearcherAgent
from .agents.mercurius import ScoutAgent
from .agents.sol import SynthesiserAgent
from .agents.saturnus import VerifierAgent
from .blackboard import (
    AgentRole,
    Blackboard,
    InMemoryBlackboard,
    Record,
    RecordType,
)
from .consensus import (
    Ranking,
    ScoredCandidate,
    borda_aggregate,
    is_near_tie,
    judge_adjudicate,
    verify,
)
from .llm.client import LLMClient
from .provenance import (
    RunSummary,
    make_summary_record,
    summarise,
    write_provenance_jsonl,
)

MAX_VERIFY_ATTEMPTS = 3


@dataclass(frozen=True)
class RunResult:
    query: str
    answer: Any
    confidence: float
    accepted: bool
    summary: RunSummary
    blackboard: Blackboard
    provenance_path: Path | None


class Umbra:
    """One Umbra per revolution. Owns the Blackboard for the duration."""

    def __init__(
        self,
        *,
        llm: LLMClient,
        n_scouts: int = 3,
        n_researchers: int = 2,
        n_critics: int = 2,
        n_synthesisers: int = 1,
        provenance_dir: Path = Path("provenance"),
    ) -> None:
        self.llm = llm
        self.n_scouts = n_scouts
        self.n_researchers = n_researchers
        self.n_critics = n_critics
        self.n_synthesisers = n_synthesisers
        self.provenance_dir = provenance_dir

    async def run(
        self,
        query: str,
        *,
        budget: Budget | None = None,
        blackboard: Blackboard | None = None,
    ) -> RunResult:
        """Run one deliberation.

        Pass ``blackboard`` to inject a pre-constructed Blackboard so an
        outside consumer (e.g. the local server's SSE stream) can poll
        records as they appear. Defaults to a fresh InMemoryBlackboard.
        """
        budget = budget or Budget()
        bb = blackboard if blackboard is not None else InMemoryBlackboard()
        started_at = datetime.now(timezone.utc)
        query_id = str(uuid4())

        await bb.append(Record(
            agent_id="umbra",
            agent_role=AgentRole.UMBRA,
            type=RecordType.TASK,
            content=query,
            confidence=1.0,
        ))

        # ─── 1. Mercurii (parallel) ──────────────────────────────────
        scout_task = Task(
            query=query,
            instructions=(
                "Bring back ONE distinctive observation. Other messengers are "
                "running in parallel; pick an angle they are unlikely to take."
            ),
            budget=budget,
        )
        scouts = [
            ScoutAgent(agent_id=f"mercurius_{i:02d}", llm=self.llm)
            for i in range(self.n_scouts)
        ]
        scout_records = await asyncio.gather(
            *(s.think(scout_task, bb) for s in scouts),
            return_exceptions=False,
        )
        for r in scout_records:
            await bb.append(r)

        # ─── 2. Planet rounds with verification loop ─────────────────
        verifier = VerifierAgent(agent_id="saturnus_00", llm=self.llm)
        judge = JudgeAgent(agent_id="iuppiter_00", llm=self.llm)

        winner: ScoredCandidate | None = None
        accepted = False

        for attempt in range(MAX_VERIFY_ATTEMPTS):
            if self.llm.is_budget_exhausted():
                await bb.append(Record(
                    agent_id="umbra",
                    agent_role=AgentRole.UMBRA,
                    type=RecordType.BUDGET_EXHAUSTED,
                    content=f"Budget exhausted before round {attempt + 1}.",
                    confidence=1.0,
                ))
                break

            await self._run_worker_round(bb, query, budget, attempt)

            syntheses = await bb.read(types=[RecordType.SYNTHESIS])
            if not syntheses:
                break

            if len(syntheses) == 1:
                winner = ScoredCandidate(record=syntheses[0], score=1.0)
            else:
                rankings = self._build_rankings(syntheses)
                scored = borda_aggregate(syntheses, rankings)
                if is_near_tie(scored):
                    winner = await judge_adjudicate(scored[:2], bb, judge, query)
                else:
                    winner = scored[0]

            verdict = await verify(winner, bb, verifier, query)
            if verdict.accepted:
                accepted = True
                break
            # Falsification record is on bb; next round reads it as a constraint.

        # ─── 3. Provenance summary ───────────────────────────────────
        summary = summarise(bb, query_id=query_id, started_at=started_at)
        await bb.append(make_summary_record(summary))

        provenance_path: Path | None = None
        try:
            provenance_path = write_provenance_jsonl(
                bb, path=self.provenance_dir / f"{query_id}.jsonl"
            )
        except OSError:
            # Don't fail the run if disk write fails; surface in stdout instead.
            provenance_path = None

        if winner is None:
            return RunResult(
                query=query,
                answer={"error": "no_synthesis_produced"},
                confidence=0.0,
                accepted=False,
                summary=summary,
                blackboard=bb,
                provenance_path=provenance_path,
            )

        return RunResult(
            query=query,
            answer=winner.record.content,
            confidence=winner.record.confidence,
            accepted=accepted,
            summary=summary,
            blackboard=bb,
            provenance_path=provenance_path,
        )

    async def _run_worker_round(
        self,
        bb: Blackboard,
        query: str,
        budget: Budget,
        attempt: int,
    ) -> None:
        round_label = f"r{attempt + 1:02d}"

        # Venus · parallel
        researcher_task = Task(
            query=query,
            instructions=(
                "Generate ONE distinctive hypothesis. Read the Blackboard "
                "for prior observations and any falsifications from earlier "
                "rounds · incorporate falsifications as hard constraints."
            ),
            budget=budget,
        )
        researchers = [
            ResearcherAgent(agent_id=f"venus_{round_label}_{i:02d}", llm=self.llm)
            for i in range(self.n_researchers)
        ]
        researcher_records = await asyncio.gather(
            *(r.think(researcher_task, bb) for r in researchers)
        )
        for r in researcher_records:
            await bb.append(r)

        # Mars · parallel
        critic_task = Task(
            query=query,
            instructions=(
                "Find the single most consequential weakness across the "
                "hypotheses on the Blackboard. Be specific."
            ),
            budget=budget,
        )
        critics = [
            CriticAgent(agent_id=f"mars_{round_label}_{i:02d}", llm=self.llm)
            for i in range(self.n_critics)
        ]
        critic_records = await asyncio.gather(
            *(c.think(critic_task, bb) for c in critics)
        )
        for r in critic_records:
            await bb.append(r)

        # Sol · parallel
        synth_task = Task(
            query=query,
            instructions=(
                "Integrate the Blackboard into ONE coherent candidate "
                "answer. Accommodate the critiques. Be specific enough "
                "that Saturnus can attempt to falsify your synthesis."
            ),
            budget=budget,
        )
        synthesisers = [
            SynthesiserAgent(agent_id=f"sol_{round_label}_{i:02d}", llm=self.llm)
            for i in range(self.n_synthesisers)
        ]
        synth_records = await asyncio.gather(
            *(s.think(synth_task, bb) for s in synthesisers)
        )
        for r in synth_records:
            await bb.append(r)

    def _build_rankings(self, syntheses: list[Record]) -> list[Ranking]:
        # v1.1: each Synthesis "votes for itself first" then orders the rest
        # by self-reported confidence. Future: have Mars + Venus also produce
        # explicit rankings, weighted in Borda.
        rankings: list[Ranking] = []
        for s in syntheses:
            others = sorted(
                [t for t in syntheses if t.id != s.id],
                key=lambda r: r.confidence,
                reverse=True,
            )
            ordered = [s.id] + [t.id for t in others]
            rankings.append(
                Ranking(
                    voter_role=AgentRole.SOL,
                    voter_id=s.agent_id,
                    ranked_candidate_ids=tuple(ordered),
                )
            )
        return rankings
