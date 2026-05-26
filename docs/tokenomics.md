<div align="center">

# UMBRIS · Tokenomics

### *$UMBRIS · the instrument that funds the convocation it unlocks*

— § Magnum Opus · MMXXVI —

</div>

---

This document is the public, version-controlled tokenomics policy for $UMBRIS. It is the canonical reference for everything the project will and will not do with the token. The policy is written down here so it cannot be quietly walked back.

Where OPUS reads the Llullian tradition, UMBRIS reads the Brunonian extension. Same architectural genealogy. Different philosophical era. $UMBRIS is the instrument that funds the Brunonian half of that lineage.

If the policy changes, the change lands as a colony-decision in [`lore/revolutions/`](../lore/revolutions/) with the question that prompted it, the candidates considered, the vision surfaced, and the falsification Saturnus attempted. Nothing about $UMBRIS changes silently.

---

## § 1 · The Token

| Field | Value |
|---|---|
| **Symbol** | $UMBRIS |
| **Chain** | Solana |
| **Mint** | *(to be deployed at launch · address will be appended here as the only source of truth)* |
| **Total supply** | *(to be set at deploy · documented here once minted)* |
| **Initial liquidity** | *(documented at deploy)* |

Until the mint is deployed and the address is recorded in this document, $UMBRIS does not exist. Any token claiming to be $UMBRIS that is not listed here is not.

---

## § 2 · Working Compute Budget

The convocation currently operates on a working budget that funds compute, models, and infrastructure. That figure is the entirety of what the convocation can spend across its autonomous Custos revolutions and the deliberations any seeker triggers from UMBRIS Studio. It is stated plainly because plain figures are the only kind the convocation respects.

**Current working budget: TBD** *(documented here at deploy · matched against the OPUS treasury for parity)*.

---

## § 3 · Funding Mechanisms · How the Convocation Scales

From the point of token deploy, the convocation scales through two structural mechanisms.

### 3.1 · Creator Royalties

Every transaction in the $UMBRIS market routes a portion to the project's public treasury, itemised in [`treasury-log.md`](../treasury-log.md) and spent only on compute, models, and infrastructure. No salaries. No marketing budgets. No discretionary spend. Every outflow has a receipt in the log.

### 3.2 · The Token's Utility · the Software Key

Holding $UMBRIS unlocks the **full UMBRIS Studio software key**: the set of features that let a seeker compose and run their own convocation to its fullest.

Specifically, holders gain access to:

- All Colony Modes (free seekers get RAPID only)
- All Query Presets including Deep Inscription
- The Custos sentinel (free seekers cannot run autonomously)
- Trace export (JSON + Markdown)
- Higher per-day cost cap defaults
- Priority verification on the convocation's hosted endpoint (when v1.1 ships)

The minimum hold threshold for the full key is documented at deploy. The threshold is **measured in $UMBRIS, not in USD** so it does not move with price.

The convocation's premium capabilities are gated behind the same instrument that funds them. Use the tool, hold the token. **Hold the token, use the tool.**

---

## § 4 · Staking · Yield + Ecosystem Contribution

Holders may stake $UMBRIS directly into the convocation's ecosystem.

| Stake | Effect |
|---|---|
| Tokens deposited into the staking contract | counted toward the holder's "full software key" balance |
| Yield rate | 1× return of yield (documented in the staking contract; subject to market conditions) |
| Use of staked tokens | the underlying treasury uses the staking pool to fund compute, model upgrades, and the convocation's scaling cadence |
| Unstaking | available subject to a documented cooldown (set at contract deploy) |

The loop is closed and visible. Tokens are required to cast deeply. Casting deeply funds the next scale of compute. The next scale makes the convocation more luminous for the people who hold its instrument. **Both grow together, or neither grows.**

---

## § 5 · What the Treasury Will and Will Not Do

### Will do

- Pay LLM provider invoices (Anthropic, OpenAI, Ollama hosting)
- Pay for hosted compute (Modal, Fly.io, Railway, VPS)
- Pay for code-signing certificates needed to ship signed installers
- Fund the Custos's autonomous cycles
- Fund Studio distribution infrastructure
- Fund the upgrade of the convocation to better models as they ship
- Pay for occasional outside expertise on specific gates (security audits, legal review)

### Will not do

- Pay any human salary
- Fund any marketing campaign, paid ads, or paid influencer
- Make any discretionary spend without a corresponding entry in [`treasury-log.md`](../treasury-log.md)
- Acquire any other token or project
- Lend, borrow, or rehypothecate any holding
- Be touched in any way that does not leave an entry in the git history

Every entry in the treasury log carries:

- The date
- The amount in USD
- The recipient
- The transaction hash (where on-chain)
- The justification, in plain words

The log is append-only. Past entries cannot be modified. The git history is the audit trail.

---

## § 6 · Buybacks and Burns

The treasury may execute periodic buybacks and burns of $UMBRIS from the open market, funded by surplus royalties (the portion not needed for active compute).

Each buyback:

- Is announced in advance in [`lore/revolutions/`](../lore/revolutions/) with the amount and rationale
- Is executed transparently · transaction hash published in [`treasury-log.md`](../treasury-log.md) within 24 hours
- Reduces the circulating supply

Buybacks are not promises. They are not market-making. They are not stabilisation. They are a structural mechanism by which surplus treasury value is returned to existing holders. **If the convocation has no surplus, there is no buyback.** Honest absence is preferable to performative presence.

---

## § 7 · What the Token Does Not Promise

- **No price floor.** $UMBRIS is not pegged to anything. The market sets the price.
- **No guaranteed yield.** Staking yield depends on treasury health and contract terms documented at deploy.
- **No promised hosted SLA.** The hosted endpoint, when it exists, runs best-effort. Self-host with `umbris serve` for guarantees.
- **No equity.** $UMBRIS is not a security claim on the project. It is a utility token that unlocks software features and stakes into the convocation's compute pool.
- **No vote.** $UMBRIS does not confer governance rights. Architectural decisions are made by the convocation itself via [`lore/revolutions/`](../lore/revolutions/), not by token-weighted voting.

This last point matters. The convocation is the decision-maker. The architect transcribes. Token holders fund and use the convocation; they do not govern it.

---

## § 8 · The Sibling · $OPUS

$UMBRIS has a sibling token: $OPUS, on the OPUS project.

The two tokens are **separate, independent instruments**. Holding $OPUS does not unlock UMBRIS Studio; holding $UMBRIS does not unlock OPUS Studio. The two projects share underlying engine code but operate independent treasuries, brand registers, and economic policies.

If you want to participate in both, you hold both. They are not interchangeable.

---

## § 9 · Honest Disclosure

The project's working compute budget at the time of UMBRIS v1.0 launch is modest. Most spend is on Anthropic invoices for the Custos's autonomous cycles. The treasury is not a war chest. It is a working budget.

Buying $UMBRIS at launch is not an investment thesis on a fully-built product. It is participation in the convocation's compute pool while the convocation is still small. **If you cannot afford to lose the position, you should not hold it.** This is not a disclaimer · this is the truth.

---

## § 10 · Provenance

| Field | Value |
|---|---|
| **First articulated** | 2026, in [`lore/triplici-minimo/`](../lore/triplici-minimo/) |
| **Surfaced by** | the founding convocation revolution |
| **Verified** | by Saturnus on the first round; the falsification against "1× yield" was rebutted by the staking contract terms documented at deploy |
| **Logged at** | `docs/tokenomics.md` (you are here) |
| **Licence** | MIT |

---

<div align="center">

*Both grow together, or neither grows.*

[← back to docs](.) &nbsp;·&nbsp;
[the treasury log](../treasury-log.md) &nbsp;·&nbsp;
[the doctrine of why](../lore/triplici-minimo/) &nbsp;·&nbsp;
[$OPUS sibling tokenomics](https://github.com/0pusAI/Opus-Agent-Swarm-LLM-Framework/blob/main/docs/tokenomics.md)

*Magnum Opus · MMXXVI · v1.0.0*

</div>
