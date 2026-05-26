"""
umbris.compositione · the convocation directing itself.

Implements the *compositione loop*: a small, well-typed orchestration on top
of `Umbra` that lets the convocation pose its own next move, deliberate it,
verify it, and (optionally) commit the result. The same pattern UMBRIS itself
uses to ship its own updates.

Two modes:

    * **Directed**     · you give the convocation a question, it returns a verdict.
                         (For that, just call `umbra.run(query)` directly.)

    * **Autonomous**   · you give the convocation a *goal*, and it loops:
                         decide → implement → verify → hand back to you.
                         Each step is a `Step` you can choose to apply or skip.

This module deliberately does **not** call git or write to disk. The
`commit_handler` callback you pass to `run()` is where you decide what to do
with each verified step · open a PR, write to a file, drop it in Slack,
publish it, ignore it. The convocation surfaces verdicts; you decide where they
land.

Typical usage:

    >>> from umbris import Umbra, LLMClient, CompositioneLoop
    >>>
    >>> llm = LLMClient()
    >>> umbra = Umbra(llm=llm)
    >>>
    >>> loop = CompositioneLoop(
    ...     hive=umbra,
    ...     goal="Improve and document this repository, honestly.",
    ... )
    >>>
    >>> async def apply(step):
    ...     print(f"[{step.iteration}] {step.plan_answer[:80]}")
    ...     # ... open a PR, write a file, anything ...
    >>>
    >>> await loop.run(max_iterations=5, commit_handler=apply)

The whole file is type-hinted, has zero external dependencies beyond
the rest of `umbris`, and is small enough to read top-to-bottom.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Optional

from .agents.base import Budget
from .umbra import Umbra

__all__ = ["CompositioneLoop", "Step", "CommitHandler"]

log = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────
# Types
# ──────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class Step:
    """The result of one full iteration of the loop.

    The convocation deliberates twice per iteration:

      1. *Plan* · "given the goal, what should we do next?"
      2. *Change* · "implement that plan as a concrete change."

    Both deliberations are full Umbra runs, each with their own verdict,
    cost, and provenance trace. If the convocation falsifies the change
    (verification fails after 3 bounded attempts), `verified` is False
    and the step is surfaced honestly · you decide whether to commit.
    """

    iteration: int
    goal: str

    plan_answer: str
    plan_cost_usd: float

    change_answer: str
    change_cost_usd: float

    verified: bool
    limitations: Optional[str] = None

    # Total cost of *this* iteration (plan + change)
    total_cost_usd: float = field(init=False)

    def __post_init__(self) -> None:
        object.__setattr__(
            self,
            "total_cost_usd",
            self.plan_cost_usd + self.change_cost_usd,
        )


CommitHandler = Callable[[Step], Awaitable[None]]
"""Async callback invoked for each verified step.

Receives the full `Step` so you can inspect the plan, the implementation,
verification status, and cost · then decide what to do (open a PR,
write to disk, send to Slack, ignore, etc.).
"""


# ──────────────────────────────────────────────────────────────────
# The loop itself
# ──────────────────────────────────────────────────────────────────


class CompositioneLoop:
    """The convocation directing itself.

    Wraps an `Umbra` and applies the deliberation pattern recursively:
    *what should we do?* → *do it* → *verify it* → *hand back to you*.

    The loop is intentionally synchronous from the user's perspective:
    you start it, it runs N iterations, you get back the full transcript
    of `Step`s for the run. Nothing happens in the background. Nothing
    is committed without your callback.

    Parameters
    ----------
    hive
        A configured `Umbra` instance. Reused across all iterations.
    goal
        A single sentence describing what the convocation should work toward.
        Open and adversarial works best · *"Improve and document this
        repository, honestly,"* not *"Add a login page."*
    budget
        Optional `Budget` cap applied to *each* sub-deliberation.
        Defaults to the Umbra's default.
    """

    def __init__(
        self,
        hive: Umbra,
        goal: str,
        *,
        budget: Optional[Budget] = None,
    ) -> None:
        self.hive = hive
        self.goal = goal
        self.budget = budget or Budget()
        self._iteration = 0

    # ── single iteration ──────────────────────────────────────────

    async def step(self) -> Step:
        """Run one full iteration: plan + change. Returns the `Step`."""
        self._iteration += 1
        i = self._iteration
        log.info("compositione iteration %d · goal: %s", i, self.goal)

        # 1. Plan: ask the convocation what should be done next.
        plan_query = (
            f"Goal: {self.goal}\n\n"
            "What is the single most valuable next move toward this goal? "
            "Be specific, concrete, and adversarial about what could go wrong."
        )
        plan_result = await self.hive.run(plan_query, budget=self.budget)
        plan_answer = _extract_text(plan_result.answer)

        # 2. Change: ask the convocation to implement that plan.
        change_query = (
            f"Goal: {self.goal}\n\n"
            f"Plan (decided by prior deliberation):\n{plan_answer}\n\n"
            "Implement the plan above as a concrete, complete change. "
            "Write the actual code/text/configuration, not a description "
            "of it. Saturnus will attempt to falsify your output."
        )
        change_result = await self.hive.run(change_query, budget=self.budget)
        change_answer = _extract_text(change_result.answer)

        # Extract limitations (if any) from the change result.
        limitations: Optional[str] = None
        if isinstance(change_result.answer, dict):
            raw_lim = change_result.answer.get("limitations")
            if raw_lim:
                limitations = str(raw_lim)

        return Step(
            iteration=i,
            goal=self.goal,
            plan_answer=plan_answer,
            plan_cost_usd=plan_result.summary.total_cost_usd,
            change_answer=change_answer,
            change_cost_usd=change_result.summary.total_cost_usd,
            verified=change_result.accepted,
            limitations=limitations,
        )

    # ── the full loop ─────────────────────────────────────────────

    async def run(
        self,
        *,
        max_iterations: int = 10,
        commit_handler: Optional[CommitHandler] = None,
        stop_on_unverified: bool = False,
        cooldown_seconds: float = 0.0,
    ) -> list[Step]:
        """Run the loop for up to `max_iterations` and return all steps.

        Parameters
        ----------
        max_iterations
            Hard cap on the number of iterations. Default 10 · the loop
            never runs forever unless you ask it to.
        commit_handler
            Async callable invoked once per *verified* step. Use it to
            apply the change (open a PR, write a file, etc.). If you
            don't supply one, verified steps still surface in the
            returned list · you can apply them yourself afterward.
        stop_on_unverified
            If True, halt the loop the first time the convocation fails to
            verify a change. If False (default), surface the unverified
            step and continue · sometimes the next iteration recovers.
        cooldown_seconds
            Optional sleep between iterations. Useful when running
            against rate-limited backends or when you want a visible
            human-paced cadence in the log.
        """
        steps: list[Step] = []
        for _ in range(max_iterations):
            step = await self.step()
            steps.append(step)

            if step.verified and commit_handler is not None:
                await commit_handler(step)

            if not step.verified and stop_on_unverified:
                log.warning(
                    "compositione stopped at iteration %d · unverified change",
                    step.iteration,
                )
                break

            if cooldown_seconds > 0:
                await asyncio.sleep(cooldown_seconds)

        return steps


# ──────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────


def _extract_text(answer: Any) -> str:
    """Umbra answers come back as either `str` or `{"answer": str, ...}`.

    Normalise to a plain string for the compositione loop's internal
    plumbing. The caller still has access to the raw answer via the
    underlying `RunResult` if they need it.
    """
    if isinstance(answer, str):
        return answer
    if isinstance(answer, dict) and "answer" in answer:
        return str(answer["answer"])
    return str(answer)
