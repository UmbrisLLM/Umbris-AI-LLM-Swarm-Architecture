"""
umbris.cli · typer entrypoint.

    umbris cast "<your question>"
    umbris cast "<your question>" --budget-usd 1.50
    umbris query "<your question>"              # alias for cast
    umbris serve                                # boot local web UI
    umbris serve --port 9000 --provider ollama
"""

from __future__ import annotations

import asyncio
import os
from pathlib import Path
from typing import Any

import typer
from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel

from .agents.base import Budget
from .blackboard import RecordType
from .umbra import Umbra
from .llm.client import LLMClient
from .llm.providers import auto_provider

app = typer.Typer(
    help="UMBRIS · Ars Memoriae. A hermetic-cosmic multi-agent LLM convocation for collective reasoning.",
    no_args_is_help=True,
)
console = Console()


def _run_query_impl(
    prompt: str,
    budget_usd: float | None,
    n_scouts: int,
    n_researchers: int,
    n_critics: int,
    n_synthesisers: int,
    provenance_dir: Path,
    verbose: bool,
) -> None:
    load_dotenv()
    if not os.environ.get("ANTHROPIC_API_KEY"):
        console.print(
            "[red]ANTHROPIC_API_KEY is not set.[/red] "
            "Copy .env.example → .env and paste your key."
        )
        raise typer.Exit(code=1)

    asyncio.run(_run_query(
        prompt=prompt,
        budget_usd=budget_usd,
        n_scouts=n_scouts,
        n_researchers=n_researchers,
        n_critics=n_critics,
        n_synthesisers=n_synthesisers,
        provenance_dir=provenance_dir,
        verbose=verbose,
    ))


@app.command()
def cast(
    prompt: str = typer.Argument(..., help="The question for the convocation."),
    budget_usd: float | None = typer.Option(None, "--budget-usd", "-b", help="Hard USD ceiling."),
    n_scouts: int = typer.Option(3, "--scouts"),
    n_researchers: int = typer.Option(2, "--researchers"),
    n_critics: int = typer.Option(2, "--critics"),
    n_synthesisers: int = typer.Option(1, "--synthesisers"),
    provenance_dir: Path = typer.Option(Path("provenance"), help="Where to write the JSONL trace."),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Print the full Record trace."),
) -> None:
    """Cast a question into the convocation. Writes a JSONL trace and prints vision + cost."""
    _run_query_impl(
        prompt, budget_usd, n_scouts, n_researchers, n_critics, n_synthesisers,
        provenance_dir, verbose,
    )


@app.command()
def query(
    prompt: str = typer.Argument(..., help="The question for the convocation."),
    budget_usd: float | None = typer.Option(None, "--budget-usd", "-b", help="Hard USD ceiling."),
    n_scouts: int = typer.Option(3, "--scouts"),
    n_researchers: int = typer.Option(2, "--researchers"),
    n_critics: int = typer.Option(2, "--critics"),
    n_synthesisers: int = typer.Option(1, "--synthesisers"),
    provenance_dir: Path = typer.Option(Path("provenance"), help="Where to write the JSONL trace."),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Print the full Record trace."),
) -> None:
    """Alias for `cast`. Preserved for compatibility with the OPUS register."""
    _run_query_impl(
        prompt, budget_usd, n_scouts, n_researchers, n_critics, n_synthesisers,
        provenance_dir, verbose,
    )


async def _run_query(
    *,
    prompt: str,
    budget_usd: float | None,
    n_scouts: int,
    n_researchers: int,
    n_critics: int,
    n_synthesisers: int,
    provenance_dir: Path,
    verbose: bool,
) -> None:
    llm = LLMClient(budget_usd=budget_usd)
    try:
        umbra = Umbra(
            llm=llm,
            n_scouts=n_scouts,
            n_researchers=n_researchers,
            n_critics=n_critics,
            n_synthesisers=n_synthesisers,
            provenance_dir=provenance_dir,
        )
        budget = Budget(max_total_usd=budget_usd)

        console.print(Panel(
            f"[bold]{prompt}[/bold]",
            title="[cyan]UMBRIS · Cast[/cyan]",
            border_style="cyan",
        ))

        with console.status("[cyan]The convocation deliberates...[/cyan]", spinner="dots"):
            result = await umbra.run(prompt, budget=budget)

        console.print()
        console.print(Panel(
            _format_answer(result.answer),
            title=("[green]Vision (verified)[/green]" if result.accepted
                   else "[yellow]Vision (best remaining · not verified)[/yellow]"),
            border_style=("green" if result.accepted else "yellow"),
        ))

        console.print()
        console.print(f"[bold]Confidence:[/bold]    {result.confidence:.2f}")
        console.print(f"[bold]Cost:[/bold]          [green]${result.summary.total_cost_usd:.4f}[/green]")
        console.print(f"[bold]Wall time:[/bold]     {result.summary.wall_seconds:.1f}s")
        console.print(f"[bold]Records:[/bold]       {result.summary.total_records}")
        if result.provenance_path:
            console.print(f"[bold]Trace:[/bold]         {result.provenance_path}")

        if verbose:
            console.print()
            console.print("[bold]Trace:[/bold]")
            for r in result.blackboard.snapshot():
                if r.type == RecordType.PROVENANCE_SUMMARY:
                    continue
                body = (r.content if isinstance(r.content, str)
                        else (r.content.get("answer", str(r.content))
                              if isinstance(r.content, dict) else str(r.content)))
                short = (body[:160] + "…") if len(body) > 160 else body
                console.print(
                    f"  [dim]{r.timestamp.strftime('%H:%M:%S')}[/dim] "
                    f"[cyan]{r.agent_role.value:>12}/{r.agent_id:<28}[/cyan] "
                    f"[magenta]{r.type.value:<22}[/magenta] "
                    f"conf={r.confidence:.2f}  ${r.cost_estimate:.4f}\n"
                    f"      {short}"
                )
    finally:
        await llm.aclose()


def _format_answer(answer: Any) -> str:
    if isinstance(answer, dict):
        if "answer" in answer:
            limitations = answer.get("limitations")
            if limitations:
                return f"{answer['answer']}\n\n[dim]Limitations: {limitations}[/dim]"
            return str(answer["answer"])
        return str(answer)
    return str(answer)


@app.command()
def custos(
    interval: str = typer.Option("2h", "--interval", "-i",
        help="How often Custos cycles. Accepts 30m / 2h / 1d / bare seconds."),
    repo: Path = typer.Option(Path("."), "--repo", help="Repository root to operate on."),
    provider: str = typer.Option("auto", "--provider",
        help="LLM provider: auto | anthropic | openai | ollama."),
    dry_run: bool = typer.Option(False, "--dry-run", help="Do everything except commit + push."),
    once: bool = typer.Option(False, "--once", help="Run a single revolution, then exit."),
    no_commit: bool = typer.Option(False, "--no-commit",
        help="Apply changes but never commit/push. Implies --dry-run for safety."),
    no_tests: bool = typer.Option(False, "--no-tests",
        help="Skip the pytest gate (use for repos without a pytest suite)."),
    no_build: bool = typer.Option(False, "--no-build",
        help="Skip the npm build gate even when web files were touched."),
    cost_cap_cycle: float = typer.Option(5.0, "--cost-cap-per-cycle",
        help="Max USD per revolution. Custos refuses to start a revolution that would exceed it."),
    cost_cap_day: float = typer.Option(50.0, "--cost-cap-per-day",
        help="Max USD per UTC day. Custos halts new revolutions when reached."),
    remote: str = typer.Option("origin", "--remote"),
    branch: str = typer.Option("main", "--branch"),
    webhook: str | None = typer.Option(None, "--webhook-url",
        help="Optional Slack/Discord webhook POSTed JSON per revolution."),
) -> None:
    """Run the autonomous Custos sentinel.

    First-time setup: ALWAYS start with --dry-run --once and read the
    full log before flipping commit/push on. See docs/custos.md.
    """
    load_dotenv()

    # Resolve provider
    if provider == "auto":
        chosen = auto_provider()
    else:
        chosen = auto_provider(provider)  # type: ignore[arg-type]
    llm = LLMClient(provider=chosen)

    # Safety: --no-commit implies --dry-run (no point applying without committing)
    effective_dry_run = dry_run or no_commit

    # Late import so this module loads even when daemon deps aren't present.
    from .daemon import Daemon, DaemonConfig

    cfg = DaemonConfig(
        repo_root=repo.resolve(),
        interval=interval,
        dry_run=effective_dry_run,
        once=once,
        commit_and_push=not no_commit and not dry_run,
        run_tests=not no_tests,
        run_build_when_web_touched=not no_build,
        cost_cap_per_cycle_usd=cost_cap_cycle,
        cost_cap_per_day_usd=cost_cap_day,
        remote=remote,
        branch=branch,
        webhook_url=webhook,
    )

    console.print(Panel(
        f"[bold cyan]UMBRIS · Custos Sentinel[/bold cyan]\n\n"
        f"  Repo:        [yellow]{cfg.repo_root}[/yellow]\n"
        f"  Provider:    [yellow]{llm.provider_name}[/yellow]\n"
        f"  Interval:    [yellow]{cfg.interval}[/yellow]\n"
        f"  Mode:        [yellow]"
        f"{'DRY-RUN' if cfg.dry_run else ('COMMIT+PUSH' if cfg.commit_and_push else 'APPLY-ONLY')}"
        f"[/yellow]\n"
        f"  Cost caps:   [yellow]${cost_cap_cycle}/revolution · ${cost_cap_day}/day[/yellow]\n"
        f"  State dir:   [yellow]{cfg.repo_root / '.umbris-custos'}[/yellow]\n\n"
        f"[dim]Ctrl+C to stop after the current revolution finishes.[/dim]",
        title="The convocation takes the hands off",
        border_style="cyan",
    ))

    daemon_instance = Daemon(llm=llm, config=cfg)
    exit_code = daemon_instance.run()
    raise typer.Exit(code=exit_code)


@app.command("custos-status")
def custos_status(
    repo: Path = typer.Option(Path("."), "--repo"),
    n: int = typer.Option(5, "--n", help="How many recent revolutions to display."),
) -> None:
    """Show the last few revolutions' outcomes from a running (or recently-run)
    Custos sentinel."""
    from .daemon import load_status_snapshot
    snap = load_status_snapshot(repo.resolve())
    if not snap:
        console.print("[yellow]No Custos state found at[/yellow] "
                      f"[cyan]{repo}/.umbris-custos/[/cyan]")
        raise typer.Exit(code=1)

    console.print(Panel(
        f"[bold]Started:[/bold]            {snap.get('started_at')}\n"
        f"[bold]Revolutions completed:[/bold]   {snap.get('cycles_completed')}\n"
        f"[bold]Last event at:[/bold]      {snap.get('last_event_iso')}\n"
        f"[bold]Halted:[/bold]             {snap.get('halted')}",
        title="Custos status",
        border_style="cyan",
    ))

    last = snap.get("last_event") or {}
    if last:
        console.print()
        console.print(f"[bold]Last revolution (#{last.get('cycle')}):[/bold]")
        console.print(f"  Status:        [yellow]{last.get('status')}[/yellow]")
        console.print(f"  Reason:        {last.get('reason')}")
        console.print(f"  Files changed: {last.get('files_changed')}")
        console.print(f"  Commit:        {last.get('commit_hash')}")
        console.print(f"  Cost:          [green]${last.get('cost_usd', 0):.4f}[/green]")
        console.print(f"  Wall:          {last.get('wall_seconds')}s")


@app.command("custos-reset")
def custos_reset(
    repo: Path = typer.Option(Path("."), "--repo"),
) -> None:
    """Force-reset today's cost cap. Use when you've manually verified the
    state and want Custos to resume."""
    from .daemon import reset_cost_ledger
    reset_cost_ledger(repo.resolve())
    console.print(f"[green]Cost ledger reset[/green] at "
                  f"[cyan]{repo}/.umbris-custos/cost-ledger.json[/cyan].")


@app.command()
def serve(
    host: str = typer.Option("127.0.0.1", "--host", help="Interface to bind. Use 0.0.0.0 to expose on LAN."),
    port: int = typer.Option(8000, "--port", "-p", help="Port to listen on."),
    provider: str = typer.Option(
        "auto",
        "--provider",
        help="LLM provider: auto | anthropic | openai | ollama. "
             "Default reads keys from env; falls back to local Ollama.",
    ),
    no_browser: bool = typer.Option(False, "--no-browser", help="Do not open the browser."),
) -> None:
    """Boot the local UMBRIS web UI on http://HOST:PORT.

    Anyone with a terminal can now spin up their own convocation in one
    command. The UI streams the deliberation live; the URL is opened
    in your default browser automatically (unless --no-browser).
    """
    load_dotenv()

    # Pick a provider. "auto" honours env vars; explicit names go straight through.
    if provider == "auto":
        chosen = auto_provider()
    else:
        chosen = auto_provider(provider)  # type: ignore[arg-type]

    llm = LLMClient(provider=chosen)

    url = f"http://{host}:{port}"
    console.print(Panel(
        f"[bold cyan]UMBRIS · Local[/bold cyan]\n\n"
        f"  Provider: [yellow]{llm.provider_name}[/yellow]\n"
        f"  URL:      [green]{url}[/green]\n"
        f"  Models:   {llm.default_worker_model} · {llm.default_scout_model} · "
        f"{llm.default_judge_model} · {llm.default_verifier_model}\n\n"
        f"[dim]Ctrl+C to stop.[/dim]",
        title="The convocation is waking",
        border_style="cyan",
    ))

    # Importing the server is deferred so the [serve] extra is only
    # required if the user actually runs this command.
    try:
        from .server import run_server
    except ImportError as e:
        console.print(
            "[red]ERROR:[/red] the [serve] extra is not installed.\n"
            "Install with: [cyan]pip install -e \".[serve]\"[/cyan]"
        )
        raise typer.Exit(code=1) from e

    run_server(llm, host=host, port=port, open_browser=not no_browser)


if __name__ == "__main__":
    app()
