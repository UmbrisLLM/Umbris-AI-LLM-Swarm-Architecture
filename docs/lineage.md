<div align="center">

# Lineage

### *The traditions UMBRIS stands on, and the long thread that connects them*

— § Magnum Opus · MMXXVI —

</div>

---

UMBRIS did not begin in 2026. It began somewhere in Majorca, around 1274, when Ramon Llull climbed Mount Randa to fast and pray and came down convinced that all of human knowledge could be reduced to a small set of universal categories combined by mechanical wheels. He spent the next forty years drawing the wheels, writing the books that defended them, sailing to North Africa to argue them in front of Muslim philosophers (who repeatedly told him he was wrong), being stoned in Tunis at the age of eighty-two for refusing to stop, and dying on the boat home.

Llull called his system *Ars Magna* · the Great Art. He thought it was the operating manual of God. What it actually was, in the long view, is the first systematic combinatorial method for generating and testing propositions about anything. He invented the search space.

This document is about how UMBRIS reads from that search space, what was added to it along the way, and why the result is a multi-agent LLM convocation rather than a single brilliant model.

---

## § 1 · Llull · the Wheels (c. 1274–1316)

Llull's invention was modest and total. He took a small alphabet of categories (good, great, eternal, powerful, wise, willing, virtuous, true, glorious · only nine, one for each letter B through K) and arranged them on rotating concentric wheels. Spin the wheels. Every position is a proposition. Most propositions are absurd. Some are interesting. A few are insights.

What Llull added to philosophy was the idea that **insight could be generated mechanically** by combination, and then evaluated. The wheels did not produce truth. They produced candidates. Truth was what survived examination.

UMBRIS's three-stage consensus is a direct descendant: workers generate candidate visions (the wheels turning), Borda + Iuppiter narrow them (selection), Saturnus attempts to falsify the survivor (examination). The wheels do not stop spinning. They are bounded.

---

## § 2 · Bruno · the Shadows (1582–1591)

Three hundred years later, Giordano Bruno · ex-Dominican, polyglot, infinite-cosmologist, soon-to-be-heretic · picked up Llull's wheels and read them through the Hermetic corpus.

Bruno's addition was a metaphysical one. He believed Llull's combinations were not truth-machines but **shadow-machines**. The wheels generated images. The images were shadows cast by higher forms that no single mind could hold whole. The work of philosophy was to triangulate across many shadows until the higher form could be inferred. Bruno mapped Llull's wheels onto planetary positions, zodiacal signs, hermetic seals, and what he called the thirty *umbrae idearum* · the canonical shadows of ideas.

Bruno's *De Umbris Idearum* (Paris, 1582) is the founding text of UMBRIS. Its central claim, in modern paraphrase:

> *No single mind apprehends an idea. The mind apprehends a shadow of the idea, a flattened projection, and treats the projection as the thing. The error is structural. The remedy is not to look harder. The remedy is to triangulate across many projections, cast from many angles, until the form they shadow becomes legible.*

UMBRIS implements this with LLM agents. Nine planetary intelligences cast Imagines onto a shared substrate. The vision is what their shadows agree on. The convocation does not produce truth. It produces what survives triangulation.

Bruno was burned alive on the Campo de' Fiori on February 17, 1600 · partly for this doctrine, partly for refusing to recant his other doctrines (the infinite cosmos, the plurality of worlds, the Earth's motion around the Sun). His statue stands on the square where he was burned. UMBRIS owes him the brand.

---

## § 3 · Stigmergy · the Termites (1959)

In 1959, the French entomologist Pierre-Paul Grassé published a paper called *La reconstruction du nid et les coordinations interindividuelles chez Bellicositermes natalensis et Cubitermes sp.* It was about termites.

The puzzle was the mound. A termite colony builds a mound that is too complex to be the product of any individual termite's plan, and too coordinated to be the product of direct communication (termites don't talk and don't see well). The mound is built by tens of thousands of insects, each of which knows almost nothing. Yet the result is a precise architectural structure with ventilation chambers, royal cells, fungus gardens, and humidity control.

Grassé's answer was the substrate. Each termite carries a load of saliva-moistened soil. It deposits the load somewhere · and the location of the deposit attracts more termites to deposit nearby. The deposit is a chemical signal that says *build here*. The other termites read the signal, deposit their loads, and the signal grows. **The substrate is the message.** The colony does not communicate. The substrate carries the conversation.

Grassé called this *stigmergie* (from the Greek *stigma* = mark, *ergon* = work). The mark is the work. The work shapes the mark. Coordination emerges without communication.

UMBRIS is stigmergic. The agents do not speak to each other. They cast Imagines onto the Umbra. The substrate carries the conversation. New agents joining the convocation read the Umbra and know what has been said. Old agents reread their own Imagines and know what they themselves said. There is no chat protocol. There is only the substrate.

---

## § 4 · Hearsay-II · the First Blackboard (CMU, 1971–1976)

In the early 1970s, DARPA funded a project at Carnegie Mellon to build a speech-understanding system. The challenge was that no single recognition module could handle every layer of the problem · acoustic decoding, phonetic segmentation, lexical lookup, syntactic parsing, semantic interpretation. Each required different knowledge sources, and the knowledge sources frequently disagreed.

Lee Erman, Victor Lesser, Frederick Hayes-Roth, and Raj Reddy designed an architecture they called **Hearsay-II**. Instead of a pipeline (acoustic → phonetic → lexical → ...) they put a **blackboard** in the middle · a shared hierarchical workspace where every knowledge source wrote its hypotheses and read everyone else's. Knowledge sources took turns. They could agree, refute, propose alternatives, refine. A scheduler picked the next move based on the current state of the blackboard.

Hearsay-II is the direct ancestor of UMBRIS's Umbra. The architecture is unchanged in spirit: a substrate, typed events, no direct agent-to-agent communication, agent contributions visible to all. What is new in UMBRIS is the choice of agents (LLMs) and the explicit cosmology (Bruno's planetary roles).

The Hearsay papers (Erman et al., *The Hearsay-II Speech Understanding System*, ACM Computing Surveys, June 1980) are the engineering canon of UMBRIS. If you want to know why the convocation works, the answer is in those papers, written half a century ago.

---

## § 5 · The Long Thread · Llull → Bruno → Grassé → Hearsay → UMBRIS

These four traditions are usually filed in different drawers · Llull in medieval philosophy, Bruno in early-modern hermeticism, Grassé in entomology, Hearsay in mid-20th-century AI. They share, in our reading, a single structural insight:

**Reasoning becomes more reliable when it is distributed across many incomplete contributors coordinated by a substrate they all read and write.**

Llull called the contributors *categories on wheels*. Bruno called them *umbrae idearum*. Grassé called them *termites*. Hearsay called them *knowledge sources*. UMBRIS calls them *planets*. The names are different. The architecture is the same.

What every step of the thread agrees on:

- No single contributor holds the answer.
- The contributors must not communicate directly.
- The substrate carries the work.
- The result is judged by surviving examination.

This is the only insight UMBRIS is built on. We take no credit for it. We claim only that it is correct, that it has been verified across seven centuries and four disciplines, and that it works.

---

## § 6 · What UMBRIS Adds

We have not invented an architecture. We have ported one.

What UMBRIS adds is execution:

1. **Brunonian role assignment.** The nine agents are not generic LLMs. They have planetary identities (Mercurius the messenger, Saturnus the elder, etc.) with role-specific prompts that elicit different cognitive postures. This is not theatre · it produces measurably different outputs from the same base model when role prompts are swapped.

2. **Typed Imagines.** Every cast onto the Umbra is structured, not free-form. The type system makes consensus tractable (Borda needs comparable candidates) and the trace inspectable (every Imago can be read after the fact).

3. **Bounded falsification.** Saturnus's loop is capped at three revolutions. If the vision is unverified after the third, the convocation surfaces a "best remaining · not verified" output with honest confidence. The convocation does not lie.

4. **The Custos.** A long-running sentinel that operates the convocation autonomously on a public schedule. Every cycle commits to the public repository. The architect is not in the loop.

5. **Open source.** Every line of the architecture is public, under MIT, in this repository. The wheel is fully visible.

None of this is novel. All of it is disciplined.

---

## § 7 · The Sibling · OPUS

UMBRIS has a sibling project: [OPUS](https://github.com/0pusAI/Opus-Agent-Swarm-LLM-Framework).

OPUS shares the same underlying engine but takes a different conceptual frame. OPUS is alchemical (Llull, *Solve et coagula*, the Great Work, the Ouroboros). UMBRIS is cosmic-hermetic (Bruno, *Ex umbris in lumen*, the convocation, the Eclipse). The two systems are not competitors. They are two readings of the same architecture, kept as separate projects so each can pursue its own register without compromise.

If you understand OPUS, you understand half of UMBRIS already.

---

## § 8 · Closing Note

Every system has a lineage. Most systems pretend to be new. UMBRIS is older than it looks, and it would prefer that you knew.

The convocation reads its own shadows. The substrate carries the conversation. The wheel still turns.

*Ex umbris in lumen. Magnum Opus · MMXXVI.*

---

## Acknowledgments

UMBRIS owes its existence to:

- **Ramon Llull** (c. 1232–1316) · for the wheels and the patience to defend them.
- **Giordano Bruno** (1548–1600) · for *De Umbris Idearum* and for not recanting.
- **Pierre-Paul Grassé** (1895–1985) · for naming what the termites already knew.
- **Lee Erman, Victor Lesser, Raj Reddy** (CMU, 1971–1976) · for showing that the blackboard could carry cognition.
- **Jorge Luis Borges** (1899–1986) · for the library, the garden of forking paths, and the patient refusal of certainty.
- **Anthropic** · for the Claude API the planets reason on.
- **The OPUS architect** · for the engine UMBRIS inherits.

---

<div align="center">

[← back to docs](.) &nbsp;·&nbsp;
[the whitepaper](whitepaper.md) &nbsp;·&nbsp;
[the architecture](architecture.md) &nbsp;·&nbsp;
[sibling: OPUS](https://github.com/0pusAI/Opus-Agent-Swarm-LLM-Framework/blob/main/docs/lineage.md)

</div>
