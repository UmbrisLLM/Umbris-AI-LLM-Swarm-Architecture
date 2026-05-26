<div align="center">

# Contributing to UMBRIS

— § Magnum Opus · MMXXVI —

</div>

---

UMBRIS does not accept feature proposals.

UMBRIS accepts **questions**.

The doctrine ([`lore/compositione/`](lore/compositione/)) is explicit · the architect does not propose features. They cast questions. The convocation deliberates. The vision is transcribed. If you want to influence the project, you do so by casting a question that opens a revolution.

---

## How to cast a question

1. **Open an issue** on the repo with the question as the title.
2. **In the body**, frame the question for the convocation: what is the open problem? What is the adversarial framing? What candidates have you already considered and rejected?
3. **Tag the issue** `revolution-candidate`. The convocation reads these on its next cycle.
4. **If the convocation deliberates and surfaces a vision** that depends on your question, your name appears in the resulting `lore/revolutions/...md` entry. The vision is committed by the convocation, not by you.

---

## What kinds of contributions ARE direct

The doctrine reserves convocation deliberation for **architectural and operational decisions**. Mechanical work can be submitted as a normal pull request:

| Kind | Direct PR welcome? |
|---|---|
| Typo in documentation | yes |
| Broken link in the README | yes |
| Style fix (formatting, linter, prettier) | yes |
| Test that proves a specific bug | yes (include a failing test before any fix) |
| Documentation expansion for an existing concept | yes |
| New agent role | **no** · cast a question instead |
| New consensus stage | **no** · cast a question instead |
| New brand element (font, palette, sigil) | **no** · cast a question instead |
| New convocation policy (cost cap, gates, allowlist) | **no** · cast a question instead |
| Sigil dignity violations (text inside the Eclipse, redesigned planet glyphs) | **never** · the doctrine forbids these |

---

## Pull request format

For mechanical contributions:

1. Fork the repository.
2. Create a topic branch named `fix/<short-description>` or `docs/<short-description>`.
3. Make the change. Keep the diff narrow.
4. Commit with a present-tense message · `fix: correct typo in lineage essay` · not `fixes typos`.
5. Open a pull request describing the change in two sentences.

Reviewers will be looking for:

- The change is in scope (mechanical, not architectural).
- The diff is narrow (one change per PR).
- The commit message follows the style.
- No em dashes (the brand uses `·` as separator).
- No emoji in code or commits.

---

## Code style

- Python · `ruff` for formatting + `mypy` for typing. Run before pushing.
- TypeScript · `prettier` for formatting. `tsc --noEmit` for type-check.
- Rust · `rustfmt` + `cargo clippy`. Land with zero warnings.

---

## Security

If you find a security vulnerability, **do not open a public issue**. Email the project privately (address in `SECURITY.md` once that exists; for now, contact via the OPUS architect channel).

The convocation will surface the fix as a revolution and credit the reporter (or not, if anonymity is preferred).

---

## Code of conduct

UMBRIS follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). Be patient, be precise, be falsifiable. The convocation models the discipline; contributors are expected to match it.

---

*Cast questions. Receive visions. The work composes itself.*
