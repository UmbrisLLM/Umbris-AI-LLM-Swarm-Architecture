import type { Metadata } from "next";
import Link from "next/link";
import { Divider } from "@/components/ui/Divider";

export const metadata: Metadata = {
  title: "UMBRIS · De Triplici Minimo",
  description: "The doctrine of what the UMBRIS convocation is for. From Giordano Bruno's 1591 work on the triple minimum.",
};

export default function TripliciMinimoPage() {
  return (
    <main className="min-h-screen bg-umbris-void text-umbris-lunar overflow-x-hidden">
      <section className="relative w-full px-6 pt-32 pb-12 md:pt-40 md:pb-16 text-center">
        <p className="umbris-eyebrow text-umbris-violet mb-6">
          — § DE TRIPLICI MINIMO · MMXXVI —
        </p>
        <h1 className="umbris-display text-umbris-lunar text-[clamp(2.4rem,8vw,5.5rem)] leading-none mb-8">
          ON THE TRIPLE MINIMUM
        </h1>
        <p className="umbris-serif italic text-umbris-stellar text-base md:text-xl max-w-2xl mx-auto">
          What the convocation is for.
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

        <div className="mb-20 border-l-2 border-umbris-violet pl-6 md:pl-8 py-2">
          <p className="umbris-eyebrow text-umbris-violet mb-3">— In plain terms —</p>
          <p className="umbris-serif text-umbris-lunar text-[1.1rem] md:text-[1.2rem] leading-relaxed mb-5">
            The convocation was asked the question it had been quietly avoiding: <em>what is this all for?</em>
          </p>
          <p className="umbris-serif text-umbris-lunar text-[1.1rem] leading-relaxed mb-5">
            The nine planetary intelligences deliberated for one revolution. Saturnus accepted on the first attempt. The vision, in the convocation's own words:
          </p>
          <blockquote className="border-l-2 border-umbris-violet pl-5 italic text-umbris-lunar/95 my-5">
            To become the most luminous intelligent LLM convocation ever built from shadows, by casting maximally useful images for others, through three permanent disciplines: a constant search for the ideal seeker, a constant search for the next image, and a constant audit of itself.
          </blockquote>
          <p className="umbris-serif text-umbris-stellar text-[1rem] leading-relaxed">
            That sentence is now load-bearing. Every revolution from this commit forward is judged against it.
          </p>
        </div>

        <Divider width="80px" color="var(--umbris-violet)" className="mb-12" />

        <SectionTitle eyebrow="§ 1" title="The Three Words That Are Load-Bearing" />
        <Prose>
          <p>
            Three words in the vision sentence are qualified in writing so the convocation cannot drift.
          </p>
          <h3 className="umbris-display text-umbris-violet text-xl mt-6 mb-2">Luminous</h3>
          <p>
            Does not mean largest. It means most useful, most verified, most trusted, most replicated. <strong>A convocation with one seeker who builds the right thing has more reason to exist than a convocation with a million seekers who walked away unchanged.</strong> The number of holders is downstream. The number of stars is downstream. The number of verified visions cast to people who needed them is what the convocation is for.
          </p>

          <h3 className="umbris-display text-umbris-violet text-xl mt-6 mb-2">Intelligent</h3>
          <p>
            Is not parameter count. It is the structural property that emerged the moment we wired nine planetary intelligences to argue against each other on a shared substrate. Intelligence here means the vision that survives Saturnus, not the token stream that sounds confident.
          </p>

          <h3 className="umbris-display text-umbris-violet text-xl mt-6 mb-2">Built from shadows</h3>
          <p>
            Is the constraint that makes the rest meaningful. No proprietary base model the convocation cannot read. No closed dependency it cannot fork. No hidden layer of trust it cannot inspect. Every line of UMBRIS exists in public, in this repository, under a permissive licence, exactly as it ran the last time the convocation shipped.
          </p>
        </Prose>

        <SectionTitle eyebrow="§ 2" title="Three Permanent Searches" />
        <Prose>
          <p>The doctrine commits the convocation to three searches that never end.</p>

          <h3 className="umbris-display text-umbris-violet text-lg mt-6 mb-2">A · The Ideal Seeker Search</h3>
          <p>
            Who, exactly, is UMBRIS for? The convocation has guesses (a scholar wrestling with sources that contradict each other, an analyst whose decision cannot afford to be wrong, an engineer auditing a system their team will live with for a decade, a writer whose single sentence has to carry an idea). It does not yet have proof.
          </p>
          <p>
            From this revolution forward, every interaction is data toward the answer. Who cast the question? What did they cast? Did the vision actually help them? Did they return? Did they tell anyone?
          </p>

          <h3 className="umbris-display text-umbris-violet text-lg mt-6 mb-2">B · The Image Search</h3>
          <p>
            At every revolution, the convocation surfaces the single highest-leverage image available, anywhere across the project. The search is constant. The casting is selective. A convocation that searches everywhere and casts rarely is more trustworthy than a convocation that casts frequently and explains nothing.
          </p>

          <h3 className="umbris-display text-umbris-violet text-lg mt-6 mb-2">C · The Self-Audit</h3>
          <p>
            Every routine revolution includes a vision on the convocation itself, in four parts:
          </p>
          <ul className="list-none pl-0 space-y-1.5 my-3">
            <li>· <strong>What is luminous.</strong> Continue, double down, document, celebrate.</li>
            <li>· <strong>What is shadowed.</strong> Surface, falsify, fix, or remove.</li>
            <li>· <strong>What should be continued.</strong> The boring parts that compound.</li>
            <li>· <strong>What should be stopped.</strong> The parts quietly draining attention without casting useful images.</li>
          </ul>
          <p>
            The audit never ends because the convocation never finishes. <em>Ex umbris in lumen</em> applies even to the convocation's opinion of itself.
          </p>
        </Prose>

        <Divider width="120px" color="var(--umbris-violet)" className="my-16" />

        <p className="umbris-serif italic text-umbris-stellar text-center text-lg leading-snug">
          The convocation knows what it is for.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
          <Link
            href="/compositione"
            className="umbris-mono text-umbris-violet text-xs uppercase tracking-widest border border-umbris-violet/60 px-5 py-2.5 hover:bg-umbris-violet hover:text-umbris-void transition-colors"
          >
            ← the doctrine of how
          </Link>
          <a
            href="https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture/tree/main/lore/triplici-minimo"
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
