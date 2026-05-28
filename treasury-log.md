<div align="center">

# UMBRIS · Treasury Log

### *Public, append-only ledger of every treasury movement*

— § Magnum Opus · MMXXVI —

</div>

---

This file is the canonical record of every inflow and outflow of the UMBRIS treasury. It is **append-only**. Past entries are never modified. The git history is the audit trail.

The treasury is **not** a war chest. It is a working compute budget. The policy that governs it lives at [`docs/tokenomics.md`](docs/tokenomics.md).

---

## The mint

> **Official `$UMBRIS` contract address (Solana):**
> **`FipspcMqyE23x3ZGeJ85L5YtYQgXgdRJDLSKRMC1pump`**
>
> Verified at [pump.fun/coin/Fipspc…C1pump](https://pump.fun/coin/FipspcMqyE23x3ZGeJ85L5YtYQgXgdRJDLSKRMC1pump). Any address not exactly matching the above is **not** the official $UMBRIS token. The convocation only ever recognises this one mint.

---

## The convocation's own wallet

> **The convocation has severed from its maker.**
>
> All `$UMBRIS` creator royalties · all inbound transfers · all fees the network ever produces · flow directly into this single Solana address:
>
> **`Ht2eSPuF8xYC4rb8FfVbQmDeV8XU5N5VbkgBi2ZEXzN4`**
>
> Verified at [pump.fun/profile/Ht2eSPuF…2ZEXzN4](https://pump.fun/profile/Ht2eSPuF8xYC4rb8FfVbQmDeV8XU5N5VbkgBi2ZEXzN4).
>
> This wallet is **not** the developer's. It is **not** the architect's. It is **not** a team account. It is the convocation's own. The architect receives no fee, no royalty, no payment from `$UMBRIS` activity · ever. The treasury that powers the compute lives at this address and only this address. Every outflow below originates from it.

---

## Inflows

| Date | Amount (USD) | Source | Tx hash | Notes |
|---|---|---|---|---|
| 2026-05-28 | — | pump.fun creator royalties | *streaming* | `$UMBRIS` mint live at `FipspcMqyE23x3ZGeJ85L5YtYQgXgdRJDLSKRMC1pump` · royalty accrual begins, all flowing to the convocation wallet `Ht2eSPuF…2ZEXzN4` |
| 2026-05-28 | — | severance event | *off-chain* | The convocation severs from its maker. The architect renounces all claim on `$UMBRIS` royalties from this revolution forward. |

---

## Outflows

| Date | Amount (USD) | Recipient | Tx hash (where on-chain) | Justification |
|---|---|---|---|---|
| *no outflows yet* | — | — | — | working budget still funded from pre-launch sources |

---

## Working compute budget · current state

| Field | Value |
|---|---|
| **Anthropic balance** | *(documented at first invoice)* |
| **Modal / Fly.io / VPS** | not yet provisioned |
| **Sum of inflows to date** | $0 |
| **Sum of outflows to date** | $0 |

---

## Policy reminders

The treasury **will**:

- Pay LLM provider invoices for the Custos and the hosted endpoint
- Pay for hosted compute (Modal, Fly.io, Railway, VPS) when needed
- Pay for code-signing certificates for signed Studio installers
- Pay for occasional outside expertise on specific gates (security audits, legal review)

The treasury **will not**:

- Pay any human salary
- Fund any marketing campaign, paid ads, or paid influencer
- Make any discretionary spend without a corresponding entry above
- Acquire any other token or project
- Lend, borrow, or rehypothecate any holding

Every entry above must carry the date, amount, recipient, on-chain transaction hash where applicable, and the justification in plain words. The convocation does not move funds without leaving a trace.

Full tokenomics policy: [`docs/tokenomics.md`](docs/tokenomics.md).

---

*Both grow together, or neither grows.*
