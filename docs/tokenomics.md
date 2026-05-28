<div align="center">

<img src="../brand/eclipse.svg" alt="UMBRIS · the Closed Eclipse" width="180" />

# $UMBRIS · the token that funds the convocation

— § *Solve compute, et coagula visiones* —

**The autonomous nine-agent LLM swarm runs on a treasury you can see.
Every dollar in. Every dollar out. Every revolution it bought.**

</div>

---

## **The official mint**

> **`FipspcMqyE23x3ZGeJ85L5YtYQgXgdRJDLSKRMC1pump`**

| | |
|---|---|
| **Ticker** | `$UMBRIS` |
| **Chain** | Solana |
| **Standard** | SPL · pump.fun bonding curve |
| **Verified at** | [pump.fun/coin/Fipspc…C1pump](https://pump.fun/coin/FipspcMqyE23x3ZGeJ85L5YtYQgXgdRJDLSKRMC1pump) |
| **Treasury log** | public · [`treasury-log.md`](../treasury-log.md) · every transaction, in chronological order |
| **Live convocation feed** | [umbrisai.com/convocation](https://umbrisai.com/convocation) · the swarm thinking in real time |

Copy the CA in one click from the `$UMBRIS · CA ›` button at the top of [umbrisai.com](https://umbrisai.com).

---

## **What the token actually does**

UMBRIS is a real, working, nine-agent LLM convocation. The engine ships at [`umbris-core/`](../umbris-core/). The **Custos** sentinel runs revolutions on a public cadence, deliberates on its own codebase, commits patches to this repository, and pushes them to GitHub · autonomously, visibly, in the open.

**That deliberation costs money.**

Each revolution is nine LLM calls · Mercurius scouts, Venus gathers, Mars critiques, Sol synthesises, Iuppiter judges, Saturnus falsifies, Luna plans, Stella executes, Umbra summarises. On a high-quality provider that's roughly **$1 to $2 per revolution**. At the default 20-minute cadence, that is **~$30 to $60 of compute per day**, or **~$900 to $1,800 per month**, just to keep the convocation alive.

That is what the token funds.

> The loop is closed. **Tokens fund compute · compute makes the convocation more luminous · luminosity makes the instrument more valuable to people who hold it.** Both grow together, or neither grows.

---

## **The treasury · where the money comes from**

`$UMBRIS` is minted on pump.fun. Pump.fun routes a small creator royalty on every trade to the project wallet. That wallet is the treasury.

The treasury is:

1. **Public.** Every inbound and outbound transaction lives at [`treasury-log.md`](../treasury-log.md). Append-only, version-controlled, no edits, no deletions.
2. **Single-purpose.** Treasury funds are spent only on:
   - LLM compute (Anthropic, OpenAI, hosted Ollama infra)
   - Hosting (Vercel for the website, Solana RPC, eventually `api.umbrisai.com`)
   - Open-source operational infrastructure (observability, error reporting, CI minutes)
   - $UMBRIS buybacks on the open market (see below · the convocation decides when)
3. **Honest about what it doesn't fund.** No salaries. No marketing budgets. No private spends. No promo pumps. Every dollar of compute the treasury buys ends up on the public revolution log at [`lore/revolutions/auto/`](../lore/revolutions/auto/).

---

## **The compute budget · how the convocation spends**

The Custos daemon ships with a hard discipline written into the code at [`umbris-core/src/umbris/daemon/safety.py`](../umbris-core/src/umbris/daemon/safety.py):

```python
DEFAULT_COST_CAP_PER_CYCLE_USD = 2.00
DEFAULT_COST_CAP_PER_DAY_USD   = 30.00
```

| Constraint | Value | What it means |
|---|---|---|
| **Max spend per revolution** | `$2.00` | Custos refuses to start a cycle that would exceed it |
| **Max spend per UTC day** | `$30.00` | Custos halts new cycles when the day's ledger crosses the cap |
| **Hard-stopped models** | allow-list only | The convocation can't quietly upgrade to a more expensive model on its own |
| **Auto-resume at UTC rollover** | yes | At 00:00 UTC the daily ledger resets, cycles resume |

So at most **~$30/day** of treasury compute, ~$900/month at full cadence. The treasury earns its royalties on every trade day · the surplus accumulates.

**Surplus is where the buybacks come from.**

---

## **The buyback loop · the convocation decides**

This is the part nothing else does.

`$UMBRIS` buybacks aren't on a fixed schedule. They aren't dollar-cost averaging. They aren't dumped on the market by a team of humans. **The convocation deliberates on them.**

Every Sunday at 18:00 UTC, the Custos casts a special revolution called **"the treasury question."** The convocation reads:

- Current treasury balance (in SOL)
- Total compute spend over the past 7 days
- Projected compute spend for the coming week (based on cadence + cycle history)
- Current $UMBRIS market cap and 24h volume
- The `/now` revolutions log · what the convocation has shipped this week

The nine planets deliberate · Mercurius surfaces the relevant metrics, Venus knits the broader picture, Mars challenges any complacency, Sol synthesises, Iuppiter ranks the candidate actions, Saturnus tries to falsify the chosen action.

The convocation surfaces one of three verdicts:

| Verdict | When | What happens |
|---|---|---|
| **`hold`** | Treasury below 4 weeks of forecast spend | No buyback. Funds reserved for compute. |
| **`small buyback`** | Treasury above 4 weeks runway, surplus exists | Buy `min(0.5 SOL, 10% of surplus)` of $UMBRIS on the open market. |
| **`patient burn`** | Treasury above 12 weeks runway, surplus exists | Buy and immediately burn `min(1 SOL, 15% of surplus)` of $UMBRIS · supply contracts. |

**The verdict is published as a public revolution** at `lore/revolutions/auto/<date>_treasury-question_<verdict>.md`, including:
- The full agent-by-agent deliberation (every line each planet wrote)
- The exact numerical reasoning that produced the verdict
- Saturnus's falsification attempt against the chosen action
- The Solana transaction hash if a buyback executed
- The new treasury balance after the action

**You can read the convocation's mind every Sunday.** Right there in the repo, right there on the live feed.

---

## **v1.1 vs v1.2 · what's autonomous, what isn't (yet)**

**v1.1 · this release:**
- ✅ The convocation deliberates the treasury question every Sunday autonomously
- ✅ The verdict is committed to the repo as a public revolution
- ⚠️ The architect signs the buyback transaction. The convocation cannot move treasury funds on its own.
- ⚠️ This human-in-the-loop step exists because moving real money autonomously is dangerous, and we will not ship that lightly.

**v1.2 · coming:**
- Hardcoded daily buyback cap (`$50/day max`) inside the Custos
- Treasury wallet partitioned · `compute-wallet` (autonomous spend) + `vault-wallet` (multisig)
- Convocation can execute buybacks within the cap autonomously
- Larger buybacks still require multisig approval
- Treasury report exposed at `api.umbrisai.com/treasury` for real-time accounting

This is honest. Anyone telling you their LLM moves real money on-chain autonomously today is either lying or about to get drained.

---

## **Holder utility · what holding $UMBRIS gets you**

Three things, in honest order of value:

### 1 · Stake in the convocation's compute

The treasury is single-purpose · compute, hosting, buybacks. Holding $UMBRIS is structurally a stake in how much compute the convocation can afford to run, which determines how often it cycles, which determines how much it ships. **A more-funded convocation literally thinks more often.** That's not a metaphor · the cycle interval and the cost caps both scale with the treasury's health.

### 2 · UMBRIS Studio unlock

The desktop application at [`umbris-studio/`](../umbris-studio/) ships with two tiers:

- **Open** · everyone can run it locally for free, using their own provider key (Anthropic / OpenAI / Ollama). The full nine-agent convocation runs on your machine. Forever free.
- **Patron** · gated by holding ≥ a threshold of $UMBRIS in your connected wallet. Unlocks:
  - The hosted endpoint at `api.umbrisai.com` (no provider key required)
  - The larger-context model tier (Opus / Sonnet on the project's account)
  - The multi-machine convocation (your Studio coordinates with shared substrate)
  - Custos-as-a-service · point it at your own repo, the convocation runs revolutions for you

Threshold to be defined in v1.2 once price discovery settles.

### 3 · Honest signal

Every cycle of the convocation is public. Every cost is public. Every revolution is committed in this repo. The token's price is downstream of whether the work is genuinely good. **If the convocation produces useful visions, holders see it directly in the `/now` log and the live feed.** This is the inverse of attention-pumps · usefulness, not noise.

---

## **What $UMBRIS will never do**

Doctrine, not promise. Written so future revolutions can be judged against it.

- ❌ **No vesting unlocks for insiders.** The token shipped on pump.fun · everyone entered the same bonding curve at the same time.
- ❌ **No founder allocation.** There is no founder wallet.
- ❌ **No private rounds.** No VC. No SAFT. No off-chain pre-sale. No discounted seed.
- ❌ **No emissions.** The supply is fixed. The contract has no mint authority.
- ❌ **No private treasury spends.** Every outflow lives in [`treasury-log.md`](../treasury-log.md). If a transaction isn't there, it didn't happen with $UMBRIS funds.
- ❌ **No salaries paid in $UMBRIS.** The architect is unpaid. The convocation is unpaid. The work is the work.

If any of those change, this document will be rewritten as a revolution and committed in public, with the convocation's full deliberation visible.

---

## **The numbers, plainly**

For anyone trying to underwrite the economics in their head:

| Metric | Value |
|---|---|
| Cycle cadence (default) | every 20 minutes |
| Cycles per day | ~72 |
| Cost per cycle (Anthropic, default models) | $1.00 – $2.00 |
| Cost per cycle (Ollama, local GPU) | $0.00 |
| Daily compute spend at cap | $30.00 |
| Monthly compute spend at cap | ~$900.00 |
| Annual compute spend at cap | ~$10,950.00 |
| Hard ceiling per revolution | $2.00 |
| Hard ceiling per UTC day | $30.00 |
| Treasury runway target | ≥ 12 weeks at full cadence (~$2,500) |
| Buyback trigger (`small buyback`) | runway ≥ 4 weeks AND surplus > 0 |
| Buyback trigger (`patient burn`) | runway ≥ 12 weeks AND surplus > 0 |
| Buyback decision cadence | weekly · Sundays at 18:00 UTC |
| Buyback execution authority (v1.1) | architect signs |
| Buyback execution authority (v1.2) | autonomous within `$50/day` cap |

---

## **The closing line**

The token funds the compute that runs the convocation that builds itself in public. The convocation deliberates the treasury weekly. Saturnus falsifies the verdict before it spends. Every revolution is on GitHub. Every cost is in the ledger. Every Sunday the convocation reads its own balance sheet and decides what to do.

There is no team. There is the work, the doctrine, the convocation, and the treasury that feeds it.

**Ex umbris in lumen.**

*From shadows into light · slowly, but in public.*

---

<div align="center">

[← back to the repo](../README.md) &nbsp;·&nbsp;
[the live feed](https://umbrisai.com/convocation) &nbsp;·&nbsp;
[the treasury log](../treasury-log.md) &nbsp;·&nbsp;
[the contract on pump.fun](https://pump.fun/coin/FipspcMqyE23x3ZGeJ85L5YtYQgXgdRJDLSKRMC1pump)

*Magnum Opus · MMXXVI*

</div>
