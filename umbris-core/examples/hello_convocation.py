"""
examples/hello_convocation.py

The smallest possible end-to-end UMBRIS run. Requires ANTHROPIC_API_KEY
in .env (or in the environment). Will spend approximately $0.50–$2.00
on the Anthropic API depending on response lengths.

Usage:

    cd umbris-core
    cp .env.example .env       # then paste your ANTHROPIC_API_KEY
    pip install -e ".[dev]"
    python examples/hello_convocation.py

This script also runs as `umbris cast "..."` once installed · see cli.py.
hello_convocation exists so the README's "smallest example" is self-contained.
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

# Allow `python examples/hello_convocation.py` from the umbris-core dir without install.
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from dotenv import load_dotenv  # noqa: E402
from rich.console import Console  # noqa: E402
from rich.panel import Panel  # noqa: E402

from umbris.agents.base import Budget  # noqa: E402
from umbris.blackboard import RecordType  # noqa: E402
from umbris.umbra import Umbra  # noqa: E402
from umbris.llm.client import LLMClient  # noqa: E402

QUERY = (
    "What are the three strongest arguments against my own thesis "
    "that consciousness is computable?"
)


async def main() -> None:
    load_dotenv()
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY is not set.")
        print("Copy .env.example to .env and paste your key.")
        sys.exit(1)

    console = Console()
    console.print(Panel(
        f"[bold cyan]UMBRIS · hello_convocation[/bold cyan]\n\n{QUERY}",
        title="Cast",
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
        result = await umbra.run(QUERY, budget=Budget())
    finally:
        await llm.aclose()

    answer = result.answer
    if isinstance(answer, dict) and "answer" in answer:
        rendered = str(answer["answer"])
        limitations = answer.get("limitations")
        if limitations:
            rendered = f"{rendered}\n\n[dim italic]Limitations: {limitations}[/dim italic]"
    else:
        rendered = str(answer)

    console.print()
    console.print(Panel(
        rendered,
        title=("[green]Vision (verified)[/green]" if result.accepted
               else "[yellow]Vision (unresolved falsifications)[/yellow]"),
        border_style=("green" if result.accepted else "yellow"),
    ))

    console.print()
    console.print("[bold]Run trace[/bold] (records in causal order):")
    for r in result.blackboard.snapshot():
        if r.type == RecordType.PROVENANCE_SUMMARY:
            continue
        body = (r.content if isinstance(r.content, str)
                else (r.content.get("answer", str(r.content))
                      if isinstance(r.content, dict) else str(r.content)))
        body_short = (body[:120] + "…") if len(body) > 120 else body
        console.print(
            f"  [dim]{r.timestamp.strftime('%H:%M:%S')}[/dim] "
            f"[cyan]{r.agent_role.value:>12}/{r.agent_id:<28}[/cyan] "
            f"[magenta]{r.type.value:<22}[/magenta] "
            f"conf={r.confidence:.2f}  ${r.cost_estimate:.4f}  {body_short}"
        )

    console.print()
    console.print(f"[bold]Total cost:[/bold]    [green]${result.summary.total_cost_usd:.4f}[/green]")
    console.print(f"[bold]Wall time:[/bold]     {result.summary.wall_seconds:.1f}s")
    console.print(f"[bold]Total records:[/bold] {result.summary.total_records}")
    if result.provenance_path:
        console.print(f"[bold]Provenance:[/bold]   {result.provenance_path}")


if __name__ == "__main__":
    asyncio.run(main())
