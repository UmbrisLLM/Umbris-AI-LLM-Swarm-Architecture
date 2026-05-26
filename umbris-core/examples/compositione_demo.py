"""
examples/compositione_demo.py

A minimal end-to-end demonstration of `umbris.compositione.CompositioneLoop`.

The convocation is handed a *goal* (not a question) and runs the
deliberation pattern recursively for N iterations: deciding what to do
next, implementing it, verifying it, and handing each verified step to
a `commit_handler` you supply.

This demo's `commit_handler` just prints the step. In real use you'd
replace it with anything: open a PR, write to a file, drop the change
in Slack, send it to a queue. The convocation surfaces verdicts; you decide
where they land.

Usage:

    cd umbris-core
    cp .env.example .env       # paste your ANTHROPIC_API_KEY
    pip install -e ".[dev]"
    python examples/compositione_demo.py

Cost: approximately $1–$3 per iteration (two full Umbra deliberations
each). Default below runs 2 iterations.
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

# Allow `python examples/compositione_demo.py` from the umbris-core dir
# without an install.
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from dotenv import load_dotenv  # noqa: E402
from rich.console import Console  # noqa: E402
from rich.panel import Panel  # noqa: E402
from rich.rule import Rule  # noqa: E402

from umbris.compositione import CompositioneLoop, Step  # noqa: E402
from umbris.umbra import Umbra  # noqa: E402
from umbris.llm.client import LLMClient  # noqa: E402


GOAL = (
    "Improve the documentation of umbris-core for first-time users. "
    "Surface what is unclear and propose concrete, honest fixes."
)

MAX_ITERATIONS = 2


async def main() -> None:
    load_dotenv()
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY is not set.")
        print("Copy .env.example to .env and paste your key.")
        sys.exit(1)

    console = Console()
    console.print(Panel(
        f"[bold cyan]UMBRIS · compositione demo[/bold cyan]\n\n"
        f"[bold]Goal:[/bold] {GOAL}\n"
        f"[bold]Max iterations:[/bold] {MAX_ITERATIONS}",
        title="Compositione Loop",
        border_style="cyan",
    ))

    llm = LLMClient()
    try:
        umbra = Umbra(
            llm=llm,
            n_scouts=3,
            n_researchers=2,
            n_critics=2,
            n_synthesisers=1,
        )

        loop = CompositioneLoop(hive=umbra, goal=GOAL)

        # The commit_handler is where YOU decide what to do with each
        # verified step. Here we just print it. In a real compositione
        # setup this is where you'd open a PR, write to a file, etc.
        async def apply(step: Step) -> None:
            console.print()
            console.print(Rule(f"Iteration {step.iteration} · verified ✓",
                               style="green"))
            console.print(Panel(
                f"[bold]Plan:[/bold]\n{step.plan_answer}\n\n"
                f"[bold]Implementation:[/bold]\n{step.change_answer}",
                title="Verified step",
                border_style="green",
            ))
            console.print(
                f"[dim]Step cost: ${step.total_cost_usd:.4f}"
                f"  ·  iteration {step.iteration}[/dim]"
            )

        steps = await loop.run(
            max_iterations=MAX_ITERATIONS,
            commit_handler=apply,
            cooldown_seconds=1.0,
        )
    finally:
        await llm.aclose()

    console.print()
    console.print(Rule("Run summary", style="cyan"))
    total = sum(s.total_cost_usd for s in steps)
    verified = sum(1 for s in steps if s.verified)
    console.print(
        f"  [bold]Iterations:[/bold]   {len(steps)}\n"
        f"  [bold]Verified:[/bold]     {verified}/{len(steps)}\n"
        f"  [bold]Total cost:[/bold]   [green]${total:.4f}[/green]"
    )


if __name__ == "__main__":
    asyncio.run(main())
