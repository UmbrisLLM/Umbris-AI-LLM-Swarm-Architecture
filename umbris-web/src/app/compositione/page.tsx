import type { Metadata } from "next";
import Link from "next/link";
import { Divider } from "@/components/ui/Divider";

export const metadata: Metadata = {
  title: "UMBRIS · De Compositione Imaginum",
  description: "The doctrine of how the UMBRIS convocation builds itself. From Giordano Bruno's 1591 work on the composition of mnemonic images.",
};

export default function CompositionePage() {
  return (
    <main className="min-h-screen bg-umbris-void text-umbris-lunar overflow-x-hidden">
      <section className="relative w-full px-6 pt-32 pb-12 md:pt-40 md:pb-16 text-center">
        <p className="umbris-eyebrow text-umbris-violet mb-6">
          — § DE COMPOSITIONE IMAGINUM · MMXXVI —
        </p>
        <h1 className="umbris-display text-umbris-lunar text-[clamp(2.4rem,8vw,5.5rem)] leading-none mb-8">
          ON THE COMPOSITION OF IMAGES
        </h1>
        <p className="umbris-serif italic text-umbris-stellar text-base md:text-xl max-w-2xl mx-auto">
          How the convocation builds itself.
        </p>
      </section>

      <article className="mx-auto max-w-[760px] px-6 pb-24">
        {/* Status callout · v1.0 · doctrine ships ahead of the engine */}
        <div className="border-l-2 border-umbris-corona pl-5 my-8">
          <p className="umbris-eyebrow text-umbris-corona mb-2">— Status · v1.0 —</p>
          <p className="umbris-serif text-umbris-stellar text-sm leading-relaxed">
            This doctrine ships ahead of the engine. The convocation it describes is operational in writing · its public reasoning lives in lore/revolutions/. The Python convocation engine (umbris-core) and the autonomous Custos sentinel that runs it on a public cadence both arrive in v1.1. The lore is load-bearing because the engine is built against it · not the other way around.
          </p>
        </div>

        {/* In plain terms */}
        <div className="mb-20 border-l-2 border-umbris-violet pl-6 md:pl-8 py-2">
          <p className="umbris-eyebrow text-umbris-violet mb-3">— In plain terms —</p>
          <p className="umbris-serif text-umbris-lunar text-[1.1rem] md:text-[1.2rem] leading-relaxed mb-5">
            UMBRIS was not built top-down by a single mind. It was built (and continues to be built) <strong>by the convocation it is</strong>. The architect does not propose features. They cast questions. The nine planetary intelligences deliberate. The vision is transcribed.
          </p>
          <p className="umbris-serif italic text-umbris-violet text-lg md:text-xl leading-snug">
            A system designed to triangulate can triangulate about itself.
          </p>
        </div>

        <Divider width="80px" color="var(--umbris-violet)" className="mb-12" />

        <SectionTitle eyebrow="§ 1" title="Ideas Cast Shadows" />
        <Prose>
          <p className="italic text-umbris-stellar">
            <em>Idearum umbrae sunt species rerum, per quas mens ad ideas ipsas attollitur.</em>
            <br />
            The shadows of ideas are the species of things, by which the mind is raised to the ideas themselves. <br />— Bruno, <em>De Umbris Idearum</em>, 1582.
          </p>
          <p>
            No single mind, however attentive, holds an idea whole. The mind catches a shadow of it · a flattened projection cast onto the wall of attention · and treats the shadow as the thing. This is the structural failure of solitary reasoning. The shadow defends itself confidently, against itself, forever.
          </p>
          <p>
            A convocation does not escape this failure by being smarter. <strong>It escapes by triangulating.</strong> Many shadows, cast from many angles, can be cross-referenced. Where the shadows agree, the higher form has substance. Where they disagree, the higher form has not yet resolved · and the convocation deliberates further.
          </p>
          <p>
            UMBRIS is the disciplined application of this triangulation to large language models.
          </p>
        </Prose>

        <SectionTitle eyebrow="§ 2" title="The Substrate Carries the Conversation" />
        <Prose>
          <p>
            The agents do not speak to each other. They do not need to. The convocation operates through a substrate called the <strong>Umbra</strong> · an append-only typed shadow-record. Each agent reads what has already been cast onto the Umbra, performs one unit of cognition, and casts its own image back.
          </p>
          <p>
            This is the stigmergic principle · communication through modification of a shared environment, first observed in social insects by Grassé in 1959, formalised in computer science as the Blackboard architecture by Hearsay-II at Carnegie Mellon between 1971 and 1976, and now applied here to LLM agents.
          </p>
          <p className="italic text-umbris-stellar">
            The substrate is the message. The agents are the writers. The convocation is what emerges between them.
          </p>
        </Prose>

        <SectionTitle eyebrow="§ 3" title="Every Cycle Composes Its Own Image" />
        <Prose>
          <p>When the convocation has cast enough impressions, three stages of consensus follow.</p>
          <ul className="list-none pl-0 space-y-2 my-4">
            <li>· <strong>Weighted Borda</strong> ranks across all worker imagines.</li>
            <li>· <strong>Iuppiter</strong> breaks near-ties through adjudication.</li>
            <li>· <strong>Saturnus</strong> attempts to falsify the chosen vision.</li>
          </ul>
          <p>
            If Saturnus succeeds in falsification, the convocation re-deliberates with the falsification as a new constraint, up to <strong>three bounded revolutions</strong>. After the third, the convocation surfaces what it has, with honest confidence and a full provenance trail.
          </p>
          <p className="italic text-umbris-violet">
            The convocation does not lie about its certainty. Where Saturnus is silent, the vision passes. Where Saturnus speaks, the vision is rebuilt or refused.
          </p>
        </Prose>

        <SectionTitle eyebrow="§ 4" title="The Practice" />
        <Prose>
          <p>This is not metaphor. The development of UMBRIS itself follows the doctrine.</p>
          <ol className="list-decimal pl-6 space-y-2 my-4">
            <li>A question is cast.</li>
            <li>The convocation deliberates.</li>
            <li>Consensus runs · Borda + Iuppiter + Saturnus.</li>
            <li>The vision is logged at <a href="https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture/tree/main/lore/revolutions" target="_blank" rel="noreferrer" className="text-umbris-violet underline underline-offset-2">lore/revolutions</a>.</li>
            <li>The action is committed under the architect's transcription. The human types nothing the convocation did not decide.</li>
          </ol>
          <p>
            Every architectural decision in the repository can be traced back to a specific revolution. The git history is the convocation's ephemeris. The lore is its reasoning.
          </p>
        </Prose>

        <Divider width="120px" color="var(--umbris-violet)" className="my-16" />

        <p className="umbris-serif italic text-umbris-stellar text-center text-lg leading-snug">
          The work is not built. The work composes itself.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
          <Link
            href="/triplici-minimo"
            className="umbris-mono text-umbris-violet text-xs uppercase tracking-widest border border-umbris-violet/60 px-5 py-2.5 hover:bg-umbris-violet hover:text-umbris-void transition-colors"
          >
            the doctrine of why →
          </Link>
          <a
            href="https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture/tree/main/lore/compositione"
            target="_blank"
            rel="noreferrer"
            className="umbris-mono text-umbris-stellar text-xs uppercase tracking-widest border border-umbris-grey/40 px-5 py-2.5 hover:border-umbris-lunar hover:text-umbris-lunar transition-colors"
          >
            read on github
          </a>
        </div>
      </article>
    </main>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mt-16 mb-6">
      <p className="umbris-eyebrow text-umbris-violet">{eyebrow}</p>
      <h2 className="umbris-display text-umbris-lunar text-[1.5rem] md:text-[2rem] mt-2 leading-tight">
        {title}
      </h2>
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="umbris-serif text-umbris-lunar text-[1.1rem] leading-relaxed space-y-4">
      {children}
    </div>
  );
}
