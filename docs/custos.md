<div align="center">

# The Custos · Operator Guide

### *The convocation that does not sleep.*

— § Magnum Opus · MMXXVI —

</div>

---

The **Custos** is UMBRIS's autonomous sentinel. It runs the full convocation on a public cadence, without supervision, against your repository. Every revolution lands as a real commit on `main`, signed by `UMBRIS Custos`. The architect does not have to be at the keyboard.

This is the UMBRIS equivalent of OPUS's **Vigilia** daemon. Same engine, same three gates, different brand register.

---

## § 1 · The Cycle, In Plain Words

Every interval (default · every 2 hours UTC), the Custos:

1. Checks its cost cap. If today's spend has reached the cap, the cycle halts before it spends anything.
2. Scans the repository · walks allowlisted paths, identifies bottlenecks (TODOs, stale links, missing tests, broken markdown).
3. Casts the most urgent bottleneck as a question to the convocation.
4. Runs the full nine-planet convocation. RAPID mode by default · ~30–60 seconds.
5. Validates the proposed patch against the path policy. Refuses to write outside the allowlist or inside the denylist.
6. Applies the patch (create-only · cannot overwrite existing files in v1.0).
7. Runs the test gate · `pytest -x` inside `umbris-core/`. Rolls back the working tree on failure.
8. Runs the build gate (if a `umbris-web` file was touched) · `npm run build`. Rolls back on failure.
9. Commits and pushes the vision, signed by `UMBRIS Custos`.
10. Logs a structured `CycleEvent` to the local log (and to a webhook, if configured).

If any gate fails, the cycle ends with `status=failed`, the working tree is restored, and the next cycle still runs.

---

## § 2 · Three Independent Gates

Every gate is enforced **outside** the convocation, in code the convocation cannot rewrite from the inside.

### 2.1 · Path Policy

The Custos may only write to paths matching the **allowlist**. It may never write to paths matching the **denylist**. Denylist always wins.

Default allowlist:

```
docs/**/*.md
lore/**/*.md
lore/**/*.svg
umbris-core/src/**/*.py
umbris-core/tests/**/*.py
umbris-web/src/data/convocationNow.ts
README.md
CHANGELOG.md
treasury-log.md
```

Default denylist:

```
.env, .env.*, **/.env*
secrets/**, **/secrets/**
**/*.key, **/*.pem
wallets/**, **/wallets/**
.git/**, **/.git/**
node_modules/**, **/node_modules/**
.venv/**, **/.venv/**
package.json, package-lock.json, **/package.json, **/package-lock.json
pyproject.toml, **/pyproject.toml
```

Modify via `PathPolicy(allowlist=…, denylist=…)` when embedding the Custos.

### 2.2 · Cost Cap

Two caps, both persisted across restarts:

- **per-cycle** · the Custos refuses to start a cycle that would project to exceed this. Default $5.
- **per-day** · the Custos refuses to start any cycle once today's UTC spend has reached this. Default $50.

State lives at `.umbris-custos/cost-ledger.json`. Rotates automatically on UTC date change.

### 2.3 · Process Lock

Single-instance enforcement on a given repository. The Custos writes its PID to `.umbris-custos/custos.pid` at start. A second Custos attempting to start against the same repo refuses · unless the first has died, in which case the second takes over the lock.

---

## § 3 · Create-Only Patching

The Custos may **only add new files** in v1.0. It cannot overwrite, modify, or delete existing files. The patch schema is strict (pydantic v2 `StructuredPatch`) with these hard limits:

- Maximum 5 files per patch
- Maximum 200 KB per file
- Every path checked against the policy before any byte hits disk
- All-or-nothing semantics · if any file in a multi-file patch fails validation, none are written

Edits to existing files are reserved for v1.2.

---

## § 4 · CLI Reference

```
umbris custos
    --interval         30m / 1h / 2h / 6h / bare seconds       (default: 2h)
    --repo             path to repo root                       (default: .)
    --provider         auto | anthropic | openai | ollama      (default: auto)
    --dry-run          skip commit/push AND gates              (default: off)
    --once             run a single cycle and exit             (default: off)
    --no-commit        apply patches but never commit/push     (implies dry-run)
    --no-tests         skip the pytest gate                    (default: off)
    --no-build         skip the npm build gate                 (default: off)
    --cost-cap-per-cycle  max USD per cycle                    (default: 5.00)
    --cost-cap-per-day    max USD per UTC day                  (default: 50.00)
    --remote           git remote name                         (default: origin)
    --branch           git branch name                         (default: main)
    --webhook-url      Slack/Discord webhook for cycle events  (default: none)

umbris custos-status
    --repo             path to repo root                       (default: .)
    --n                how many recent cycles to display       (default: 5)

umbris custos-reset
    --repo             path to repo root                       (default: .)
```

---

## § 5 · The Conservative First Run

**Step 1.** Run a true zero-side-effects cycle:

```bash
umbris custos --dry-run --once --no-tests
```

This still applies the patch to disk (so you can see what the convocation chose to write). It does not commit, does not push, does not run pytest, does not run `npm run build`.

**Step 2.** Inspect:

```bash
cat .umbris-custos/custos.log | tail -1 | jq
cat .umbris-custos/custos-state.json
git status        # see what files the Custos wrote
git diff --stat
```

**Step 3.** Roll back or keep manually:

```bash
git checkout -- .   # discard tracked-file changes
git clean -fd       # remove untracked files the Custos wrote
```

**Step 4.** When confident, go live:

```bash
umbris custos --interval 2h
```

For production, wrap in a process supervisor (systemd unit, launchd plist, `pm2`, supervisord, `docker restart: unless-stopped`).

---

## § 6 · Embedded Use · Python

The Custos is a regular class. The CLI is one entry point; embedding is another.

```python
from pathlib import Path
from umbris import LLMClient
from umbris.llm.providers import auto_provider
from umbris.custos import Custos, CustosConfig
from umbris.custos.safety import PathPolicy

llm = LLMClient(provider=auto_provider())
custos = Custos(
    llm=llm,
    config=CustosConfig(
        repo_root=Path("."),
        interval="1h",
        dry_run=False,
        once=False,
        commit_and_push=True,
        cost_cap_per_cycle_usd=2.0,
        cost_cap_per_day_usd=20.0,
        webhook_url="https://hooks.slack.com/services/...",
    ),
    policy=PathPolicy(
        allowlist=("docs/**/*.md", "lore/**/*.md"),
        denylist=PathPolicy().denylist,
    ),
)
exit_code = custos.run()   # sync; runs an asyncio loop internally
```

`Custos.run_async()` is the async-native variant.

---

## § 7 · Failure Modes and What They Mean

| `status` + `reason` | What happened | What to do |
|---|---|---|
| `halted` · `cost-cap: daily cap reached` | today's spend hit the cap | `umbris custos-reset` if intentional · raise `--cost-cap-per-day` if structural |
| `skipped` · `no observations surfaced from scan` | the analyst found nothing actionable | normal · the repository is healthy today |
| `skipped` · `patcher response failed to parse / validate` | the convocation returned non-JSON or schema-invalid output | often transient · the next cycle retries · investigate if persistent |
| `skipped` · `apply rejected: path policy …` | the convocation tried to write outside the allowlist | the policy worked · either expand the allowlist (carefully) or accept that the convocation chose a goal that requires a manual change |
| `failed` · `test gate failed: …` | patch landed, pytest broke, tree rolled back | read the tail of the log · either the test was flaky (resume), the patch was bad (no action needed; tree is clean), or the tests themselves need fixing |
| `failed` · `build gate failed: …` | same as test gate but for `umbris-web` | same playbook |
| `failed` · `git push failed: …` | local commit succeeded, remote rejected | the commit is still local · resolve manually (`git pull --rebase` may already have been tried) · next cycle proceeds |

---

## § 8 · Anti-Goals · What the Custos Will Not Do

The Custos will not:

- Force-push. Ever.
- Skip a hook with `--no-verify`. Ever.
- Modify or delete existing files (v1.0 is create-only).
- Spend past its cost cap to finish a cycle.
- Run two cycles in parallel against the same repo.
- Write outside the allowlist, even if the convocation asks it to.
- Write inside the denylist, even if it would otherwise be allowed.
- Commit files containing the patterns matched by the denylist.

These are not soft preferences. They are hardcoded outside the convocation.

---

## § 9 · State Persistence

While the Custos is running:

- `.umbris-custos/custos.pid` · the PID of the live process
- `.umbris-custos/custos.log` · every event as a JSON line
- `.umbris-custos/custos-state.json` · last cycle's CycleEvent + runtime state
- `.umbris-custos/cost-ledger.json` · today's spend, cycles count, date

`umbris custos-status` reads `custos-state.json`. Useful for external monitoring (cron + grep, Grafana JSON datasource, a curl loop).

---

<div align="center">

*Ex umbris in lumen.*

[← back to docs](.) &nbsp;·&nbsp;
[the whitepaper](whitepaper.md) &nbsp;·&nbsp;
[the architecture](architecture.md) &nbsp;·&nbsp;
[quickstart](quickstart.md)

*Magnum Opus · MMXXVI · v1.0.0*

</div>
