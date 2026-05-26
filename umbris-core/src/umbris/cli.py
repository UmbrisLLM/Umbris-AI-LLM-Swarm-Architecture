"""
umbris.cli · typer entrypoint.

  umbris query "<your question>"            run one convocation revolution
  umbris serve                              boot local web UI on http://127.0.0.1:8000
  umbris custos                             start the autonomous sentinel
  umbris custos-status                      show the last few cycle outcomes
  umbris custos-reset                       force-reset today's cost cap

Full implementation lands in v1.1. The CLI shell below establishes the
public command surface so embedding code can target the right interface.
"""

from __future__ import annotations

import typer
from rich.console import Console
from rich.panel import Panel

app = typer.Typer(
    help="UMBRIS · a hermetic-cosmic multi-agent LLM convocation for collective reasoning.",
    no_args_is_help=True,
)
console = Console()


@app.command()
def query(
    prompt: str = typer.Argument(..., help="The question for the convocation."),
    mode: str = typer.Option("STANDARD", "--mode", "-m", help="RAPID | STANDARD | DEEP"),
    budget_usd: float | None = typer.Option(None, "--budget-usd", "-b"),
) -> None:
    """Cast a question into the convocation. v1.1 wires the full engine."""
    console.print(Panel(
        f"[bold]UMBRIS Studio[/bold]\n\n"
        f"Cast: [italic]{prompt}[/italic]\n"
        f"Mode: [yellow]{mode}[/yellow]   Budget: [yellow]"
        f"{('$' + str(budget_usd)) if budget_usd else 'unset'}[/yellow]\n\n"
        f"[dim]The full convocation engine lands in v1.1.[/dim]\n"
        f"[dim]For today, use opus-core directly:[/dim]\n\n"
        f"[cyan]opus query \"{prompt}\" --budget-usd {budget_usd or 1.0}[/cyan]",
        title="[cyan]I AM UMBRIS[/cyan]",
        border_style="magenta",
    ))


@app.command()
def serve(
    host: str = typer.Option("127.0.0.1", "--host"),
    port: int = typer.Option(8000, "--port", "-p"),
) -> None:
    """Boot the local UMBRIS web UI. v1.1 wires the full server."""
    console.print(
        f"[yellow]`umbris serve` ships in v1.1.[/yellow]\n"
        f"For today, use `opus serve --port {port}` and read the trace through "
        f"the OPUS local UI.\n\n"
        f"The UMBRIS Studio desktop app (Tauri) is the recommended client for v1.0."
    )


@app.command()
def custos(
    interval: str = typer.Option("2h", "--interval", "-i"),
    dry_run: bool = typer.Option(False, "--dry-run"),
    once: bool = typer.Option(False, "--once"),
) -> None:
    """The autonomous sentinel. v1.1 wires the full Custos loop.

    Operator guide at docs/custos.md."""
    console.print(
        f"[yellow]`umbris custos` ships in v1.1.[/yellow]\n"
        f"For today, use `opus daemon --interval {interval}"
        f"{' --dry-run' if dry_run else ''}{' --once' if once else ''}` "
        f"and rename committed files manually to UMBRIS conventions."
    )


@app.command("custos-status")
def custos_status() -> None:
    """Show recent Custos cycle outcomes. v1.1."""
    console.print("[yellow]`umbris custos-status` ships in v1.1.[/yellow]")


@app.command("custos-reset")
def custos_reset() -> None:
    """Force-reset today's cost cap. v1.1."""
    console.print("[yellow]`umbris custos-reset` ships in v1.1.[/yellow]")


if __name__ == "__main__":
    app()
