import type { Metadata } from "next";
import { Divider } from "@/components/ui/Divider";

export const metadata: Metadata = {
  title: "UMBRIS · Manifesto",
  description: "The long-form manifesto for UMBRIS · Ars Memoriae · De Umbris Idearum.",
};

export default function ManifestoPage() {
  return (
    <main className="min-h-screen bg-umbris-void px-6 py-32">
      <article className="mx-auto max-w-[720px]">
        <p className="umbris-eyebrow text-center text-umbris-violet mb-6">
          — § ARS MEMORIAE · MMXXVI —
        </p>
        <h1 className="umbris-display text-umbris-lunar text-[clamp(2.5rem,6vw,4.5rem)] text-center mb-16 leading-none">
          MANIFESTO
        </h1>

        <div className="umbris-serif text-umbris-lunar text-[1.18rem] leading-relaxed space-y-7">
          <p className="umbris-dropcap">
            UMBRIS is not a model. It is a convocation.
          </p>

          <p>
            A single language model, however large, reasons in one voice. It produces a stream of plausible tokens, defends them, and moves on. It cannot meaningfully disagree with itself. It cannot triangulate. It cannot be falsified except from outside. It casts one shadow on the wall of attention and treats the shadow as the thing.
          </p>

          <p>
            We replace that lonely soliloquy with a structured convocation. Nine planetary intelligences (Mercurius at the perimeter, Venus and Mars and Sol and Luna and Stella at the worker tier, Iuppiter and Saturnus at the seat of judgement, Umbra at the centre of all converging) coordinate not by speaking to each other but by casting typed Imagines onto a single shared substrate: the Umbra, an append-only event log. Each intelligence reads the current state of the Umbra, performs one unit of cognition, and casts its result back. No intelligence has a private channel to any other. The substrate is the conversation.
          </p>

          <p>
            This is the stigmergic principle, observed first in social insects by Grassé in 1959 and formalised in computer science as the blackboard architecture by Hearsay-II at Carnegie Mellon between 1971 and 1976. It is not new. What is new is reading it through Giordano Bruno · who in <em>De Umbris Idearum</em> (1582) wrote that ideas themselves are too large to be held whole by any single mind, and that what reaches us is only a shadow, a flattened projection cast by a higher form. The error is not that the mind fails to grasp the idea. The error is that the mind grasps the shadow and is satisfied.
          </p>

          <p>
            A convocation does not escape this error by being smarter. It escapes by triangulating. Many shadows, cast from many angles, can be cross-referenced. Where the shadows agree, the higher form has substance. Where they disagree, the higher form has not yet resolved, and the convocation deliberates further.
          </p>

          <p>
            When the convocation has cast enough Imagines, three stages of consensus run. Weighted Borda ranks across all worker imagines. Iuppiter, the king, breaks near-ties through adjudication. Saturnus, the elder, attempts to falsify the chosen vision · and if the falsification holds, the convocation re-deliberates with the falsification as a new constraint. The loop is bounded: at most three revolutions, after which the convocation surfaces what it has, with honest confidence and a full trace. The convocation does not lie about its certainty.
          </p>

          <p className="text-umbris-violet italic text-center pt-8">
            Ex umbris in lumen.
            <br />
            From shadows into light.
            <br />
            Triangulate the many; let the higher form converge into one.
            <br />
            That is the work.
          </p>
        </div>

        <Divider className="mt-20" width="120px" color="var(--umbris-violet)" />

        <p className="umbris-mono text-umbris-grey text-xs uppercase tracking-widest text-center mt-12">
          Magnum&nbsp;Opus · MMXXVI
        </p>
      </article>
    </main>
  );
}
