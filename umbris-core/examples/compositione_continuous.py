"""
examples/compositione_continuous.py

The full compositione loop, end-to-end:

  1. The convocation scans its own repository (`RepoAnalyst`).
  2. The convocation deliberates which gaps are the highest-conviction
     next moves (`surface_bottlenecks`).
  3. The convocation enters a `CompositioneLoop` against that verdict
     as the goal · deciding, implementing, verifying each step.
  4. Each verified step lands in a commit_handler the user controls
     (here: writes a JSON record to disk; in production: opens a PR).

This is the script that makes the compositione doctrine concrete.
Point it at any repository, give it credit on the Anthropic key,
and watch the convocation work on its own codebase.

Usage:

    cd umbris-core
    cp .env.example .env       # paste your ANTHROPIC_API_KEY
    pip install -e ".[dev]"
    python examples/compositione_continuous.py

Cost: roughly $2-$6 for one full revolution (one scan deliberation +
two compositione iterations). Default below is two iterations.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import time
from pathlib import Path

# Allow running without an install from inside umbris-core.
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from dotenv import load_dotenv  # noqa: E402
from rich.console import Console  # noqa: E402
from rich.panel import Panel  # noqa: E402
from rich.rule import Rule  # noqa: E402
from rich.table import Table  # noqa: E402

from umbris.compositione import CompositioneLoop, Step  # noqa: E402
from umbris.umbra import Umbra  # noqa: E402
from umbris.introspection import RepoAnalyst, surface_bottlenecks  # noqa: E402
from umbris.llm.client import LLMClient  # noqa: E402


# Point this at any repository you want the convocation to work on.
# Default is the UMBRIS repo itself · fully compositione.
REPO_ROOT = Path(__file__).resolve().parents[2]
MAX_COMPOSITIONE_ITERATIONS = 2
OUTPUT_DIR = REPO_ROOT / ".compositione-output"


async def main() -> None:
    load_dotenv()
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY is not set.")
        print("Copy .env.example to .env and paste your key.")
        sys.exit(1)

    console = Console()
    console.print(Panel(
        f"[bold cyan]UMBRIS · continuous compositione[/bold cyan]\n\n"
        f"[bold]Repository:[/bold] {REPO_ROOT}\n"
        f"[bold]Max iterations:[/bold] {MAX_COMPOSITIONE_ITERATIONS}\n"
        f"[bold]Output:[/bold]      {OUTPUT_DIR}",
        title="The convocation is about to work on itself",
        border_style="cyan",
    ))

    # ── 1. Scan the repository ──────────────────────────────────
    console.print()
    console.print(Rule("Step 1 · scan", style="cyan"))

    analyst = RepoAnalyst(repo_root=REPO_ROOT)
    t0 = time.time()
    observations = analyst.scan()
    elapsed = time.time() - t0

    by_kind: dict[str, int] = {}
    for o in observations:
        by_kind[o.kind] = by_kind.get(o.kind, 0) + 1

    table = Table(show_header=True, header_style="bold")
    table.add_column("Kind")
    table.add_column("Count", justify="right")
    for kind, count in sorted(by_kind.items()):
        table.add_row(kind, str(count))
    console.print(table)
    console.print(
        f"[dim]Scanned in {elapsed:.2f}s. "
        f"Top 5 observations follow.[/dim]"
    )
    for o in observations[:5]:
        console.print(f"  [yellow]→[/yellow] {o.as_line()}")

    # ── 2. Surface bottlenecks ──────────────────────────────────
    console.print()
    console.print(Rule("Step 2 · surface bottlenecks", style="cyan"))

    llm = LLMClient()
    try:
        umbra = Umbra(llm=llm)

        console.print("[dim]Convocation deliberating which observations matter most...[/dim]")
        verdict = await surface_bottlenecks(umbra, observations, n=3)
        console.print(Panel(
            str(verdict.answer),
            title="[bold]Convocation verdict · top 3 next moves[/bold]",
            border_style="green" if verdict.accepted else "yellow",
        ))
        console.print(
            f"[dim]Surface cost: ${verdict.summary.total_cost_usd:.4f}[/dim]"
        )

        # ── 3. Enter compositione loop with the verdict as the goal ──
        console.print()
        console.print(Rule("Step 3 · compositione loop", style="cyan"))

        # We extract a clean goal sentence from the verdict.
        goal = (
            "Address the top bottlenecks the convocation just surfaced:\n\n"
            f"{verdict.answer}"
        )

        loop = CompositioneLoop(hive=umbra, goal=goal)

        OUTPUT_DIR.mkdir(exist_ok=True)

        async def commit_handler(step: Step) -> None:
            # In production this is where you open a PR, write to a
            # file, push to a queue, etc. Here we write a JSON record
            # to disk so the run leaves a verifiable trail.
            out = OUTPUT_DIR / f"step-{step.iteration:03d}.json"
            out.write_text(json.dumps({
                "iteration": step.iteration,
                "goal": step.goal,
                "plan": step.plan_answer,
                "change": step.change_answer,
                "verified": step.verified,
                "limitations": step.limitations,
                "cost_usd": step.total_cost_usd,
            }, indent=2))
            console.print()
            console.print(Rule(
                f"Iteration {step.iteration} · "
                + ("verified ✓" if step.verified else "unverified"),
                style="green" if step.verified else "yellow",
            ))
            console.print(f"  [bold]Plan:[/bold]   {step.plan_answer[:140]}")
            console.print(f"  [bold]Change:[/bold] {step.change_answer[:140]}")
            console.print(
                f"  [dim]Cost: ${step.total_cost_usd:.4f}  ·  "
                f"wrote {out.relative_to(REPO_ROOT)}[/dim]"
            )

        steps = await loop.run(
            max_iterations=MAX_COMPOSITIONE_ITERATIONS,
            commit_handler=commit_handler,
            cooldown_seconds=1.0,
        )
    finally:
        await llm.aclose()

    # ── 4. Summary ──────────────────────────────────────────────
    console.print()
    console.print(Rule("Run summary", style="cyan"))
    total = verdict.summary.total_cost_usd + sum(s.total_cost_usd for s in steps)
    verified = sum(1 for s in steps if s.verified)
    console.print(
        f"  [bold]Observations scanned:[/bold] {len(observations)}\n"
        f"  [bold]Bottlenecks surfaced:[/bold] 3\n"
        f"  [bold]Iterations:[/bold]           {len(steps)}\n"
        f"  [bold]Verified:[/bold]             {verified}/{len(steps)}\n"
        f"  [bold]Total cost:[/bold]           [green]${total:.4f}[/green]\n"
        f"  [bold]Output:[/bold]               {OUTPUT_DIR}"
    )


if __name__ == "__main__":
    asyncio.run(main())
