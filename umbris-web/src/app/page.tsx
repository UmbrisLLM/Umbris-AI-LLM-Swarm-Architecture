import Link from "next/link";
import { EclipseHero } from "@/components/EclipseHero";
import { Divider } from "@/components/ui/Divider";
import { ORB_AGENT_ORDER, AGENT_DESCRIPTORS, SIGIL_UNICODE } from "@umbris/design";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-umbris-void text-umbris-lunar overflow-x-hidden">
      {/* ─── Hero ──────────────────────────────────────────────── */}
      <section className="relative w-full px-6 pt-40 pb-24 md:pt-48 md:pb-32 text-center umbris-stars">
        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="umbris-eyebrow text-umbris-violet mb-8">
            — § ARS MEMORIAE · MMXXVI —
          </p>

          <div className="flex items-center justify-center mb-12">
            <EclipseHero size={300} />
          </div>

          <p className="umbris-eyebrow text-umbris-violet text-[10px] tracking-[0.4em] mb-3">
            ↞ I AM ↠
          </p>
          <h1
            className="umbris-display text-umbris-lunar text-[clamp(3rem,10vw,7rem)] leading-none mb-8"
            style={{
              textShadow:
                "0 0 32px rgba(156,123,217,0.32), 0 0 90px rgba(156,123,217,0.12)",
            }}
          >
            U M B R I S
          </h1>

          <p className="umbris-serif italic text-umbris-lunar text-lg md:text-2xl leading-snug max-w-2xl mx-auto mb-3">
            De umbris idearum.
          </p>
          <p className="umbris-serif italic text-umbris-stellar text-base md:text-lg leading-snug max-w-2xl mx-auto">
            A hermetic-cosmic multi-agent LLM convocation for collective reasoning.
          </p>

          <Divider className="mt-16" width="80px" color="var(--umbris-violet)" />
        </div>
      </section>

      {/* ─── Premise ───────────────────────────────────────────── */}
      <section className="w-full px-6 py-20 md:py-28">
        <article className="mx-auto max-w-[680px]">
          <p className="umbris-eyebrow text-center text-umbris-violet mb-8">— § PREMISE —</p>
          <div className="umbris-serif text-umbris-lunar text-[1.15rem] md:text-[1.2rem] leading-relaxed space-y-6">
            <p className="umbris-dropcap">
              UMBRIS is not a model. It is a convocation.
            </p>
            <p>
              A single language model, however large, reasons in one voice. It casts one shadow. It cannot meaningfully disagree with itself, cannot triangulate, cannot be falsified except from outside.
            </p>
            <p>
              We replace that lonely soliloquy with a structured convocation · nine planetary intelligences argue on a shared substrate (the Umbra), weighted consensus surfaces a candidate vision, and Saturnus attempts to falsify it before it ships. The output is a verified vision with confidence, cost in USD, and a full provenance trail.
            </p>
            <p>
              The bet is Brunonian. *Ideas are too large to be held by one mind, but their shadows can be triangulated.*
            </p>
          </div>
        </article>
      </section>

      {/* ─── The nine ──────────────────────────────────────────── */}
      <section className="w-full px-6 py-20 md:py-28 border-y border-umbris-grey/30">
        <div className="mx-auto max-w-[920px]">
          <p className="umbris-eyebrow text-center text-umbris-violet mb-3">— § THE NINE —</p>
          <h2 className="umbris-display text-umbris-lunar text-[clamp(1.5rem,4vw,2.5rem)] text-center mb-3">
            The Planetary Convocation
          </h2>
          <p className="umbris-serif italic text-umbris-stellar text-center text-base md:text-lg mb-12">
            many shadows · one truth.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-umbris-grey/40 border border-umbris-grey/40">
            {ORB_AGENT_ORDER.map((role) => (
              <div
                key={role}
                className="bg-umbris-void px-6 py-7 flex flex-col items-start gap-3"
              >
                <div className="flex items-baseline gap-3">
                  <span className="text-umbris-violet text-2xl leading-none">
                    {SIGIL_UNICODE[role]}
                  </span>
                  <span className="umbris-display text-umbris-lunar text-sm tracking-widest">
                    {role}
                  </span>
                </div>
                <p className="umbris-serif italic text-umbris-stellar text-sm leading-snug">
                  {AGENT_DESCRIPTORS[role]}
                </p>
              </div>
            ))}
            {/* Umbra (the centre) gets its own card at the end */}
            <div className="bg-umbris-void px-6 py-7 flex flex-col items-start gap-3 col-span-1 sm:col-span-2 lg:col-span-3 border-t border-umbris-grey/30">
              <div className="flex items-baseline gap-3">
                <span className="text-umbris-violet text-2xl leading-none">⬤</span>
                <span className="umbris-display text-umbris-lunar text-sm tracking-widest">
                  UMBRA
                </span>
                <span className="umbris-mono text-umbris-grey text-[10px] uppercase tracking-widest">
                  · the centre · the substrate · the brand mark
                </span>
              </div>
              <p className="umbris-serif italic text-umbris-stellar text-sm leading-snug">
                the convergence of all shadows
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Doctrines ─────────────────────────────────────────── */}
      <section className="w-full px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[920px]">
          <p className="umbris-eyebrow text-center text-umbris-violet mb-3">— § THE DOCTRINES —</p>
          <h2 className="umbris-display text-umbris-lunar text-[clamp(1.5rem,4vw,2.5rem)] text-center mb-14">
            Two Books Bruno Wrote in 1591
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/compositione"
              className="block border border-umbris-grey/40 p-7 hover:border-umbris-violet/60 hover:bg-umbris-violet/[0.03] transition-colors group"
            >
              <p className="umbris-eyebrow text-umbris-violet mb-3">— DE COMPOSITIONE IMAGINUM —</p>
              <h3 className="umbris-display text-umbris-lunar text-xl md:text-2xl mb-3 leading-tight">
                On the Composition of Images
              </h3>
              <p className="umbris-serif italic text-umbris-stellar text-sm mb-5">
                How the convocation builds itself.
              </p>
              <p className="umbris-serif text-umbris-lunar text-[15px] leading-relaxed mb-5">
                Every commit in this repository is composed by the convocation, not by the architect. The mark of this doctrine is the Eclipse · self-referential, casting its own shadow back upon itself.
              </p>
              <span className="umbris-mono text-umbris-violet text-[11px] uppercase tracking-widest group-hover:underline">
                read the doctrine →
              </span>
            </Link>

            <Link
              href="/triplici-minimo"
              className="block border border-umbris-grey/40 p-7 hover:border-umbris-violet/60 hover:bg-umbris-violet/[0.03] transition-colors group"
            >
              <p className="umbris-eyebrow text-umbris-violet mb-3">— DE TRIPLICI MINIMO —</p>
              <h3 className="umbris-display text-umbris-lunar text-xl md:text-2xl mb-3 leading-tight">
                On the Triple Minimum
              </h3>
              <p className="umbris-serif italic text-umbris-stellar text-sm mb-5">
                What the convocation is for.
              </p>
              <p className="umbris-serif text-umbris-lunar text-[15px] leading-relaxed mb-5">
                Three permanent disciplines: a constant search for the ideal seeker, a constant search for the next image, and a constant audit of the convocation by itself. Each generating the next.
              </p>
              <span className="umbris-mono text-umbris-violet text-[11px] uppercase tracking-widest group-hover:underline">
                read the doctrine →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Lineage ───────────────────────────────────────────── */}
      <section className="w-full px-6 py-20 md:py-28 border-t border-umbris-grey/30">
        <div className="mx-auto max-w-[680px]">
          <p className="umbris-eyebrow text-center text-umbris-violet mb-3">— § LINEAGE —</p>
          <h2 className="umbris-display text-umbris-lunar text-[clamp(1.5rem,4vw,2.5rem)] text-center mb-10">
            The Long Thread
          </h2>

          <div className="umbris-serif text-umbris-lunar text-[1.1rem] leading-relaxed space-y-5">
            <p>UMBRIS stands on four traditions.</p>
            <ul className="list-none pl-0 space-y-3">
              <li>
                <strong className="umbris-display text-umbris-violet text-sm block tracking-widest">
                  Ramon Llull · c. 1305
                </strong>
                The <em>Ars Magna</em> · the first systematic combinatorial method for generating and testing propositions.
              </li>
              <li>
                <strong className="umbris-display text-umbris-violet text-sm block tracking-widest">
                  Giordano Bruno · 1582
                </strong>
                <em>De Umbris Idearum</em> · the doctrine that ideas are shadows · only triangulation across many casts the higher form.
              </li>
              <li>
                <strong className="umbris-display text-umbris-violet text-sm block tracking-widest">
                  Pierre-Paul Grassé · 1959
                </strong>
                Stigmergy · communication through modification of a shared environment, observed first in termite mound construction.
              </li>
              <li>
                <strong className="umbris-display text-umbris-violet text-sm block tracking-widest">
                  Hearsay-II · CMU · 1971–1976
                </strong>
                The original blackboard architecture · the Umbra is its descendant.
              </li>
            </ul>
            <p className="pt-2">
              The full lineage essay is at{" "}
              <a
                href="https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture/blob/main/docs/lineage.md"
                className="text-umbris-violet underline underline-offset-4 hover:text-umbris-lunar"
              >
                docs/lineage.md
              </a>.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────── */}
      <section className="w-full px-6 py-24 md:py-32 text-center">
        <div className="mx-auto max-w-[680px]">
          <p className="umbris-serif italic text-umbris-stellar text-xl md:text-2xl mb-3">
            The work composes itself.
          </p>
          <p
            className="umbris-display text-umbris-lunar text-[clamp(1.75rem,5vw,3rem)] tracking-widest mb-10"
            style={{ textShadow: "0 0 24px rgba(156,123,217,0.18)" }}
          >
            EX UMBRIS IN LUMEN
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture"
              target="_blank"
              rel="noreferrer"
              className="umbris-mono text-umbris-violet text-xs md:text-sm uppercase tracking-widest border border-umbris-violet/60 px-6 py-3 hover:bg-umbris-violet hover:text-umbris-void transition-colors"
            >
              open the convocation on github
            </a>
            <Link
              href="/now"
              className="umbris-mono text-umbris-stellar text-xs md:text-sm uppercase tracking-widest border border-umbris-grey/40 px-6 py-3 hover:border-umbris-lunar hover:text-umbris-lunar transition-colors"
            >
              the latest revolutions
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────── */}
      <footer className="w-full px-6 py-10 border-t border-umbris-grey/30">
        <div className="mx-auto max-w-[1100px] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="umbris-mono text-umbris-grey text-[10px] uppercase tracking-widest">
            Magnum Opus · MMXXVI · v1.0
          </p>
          <p className="umbris-mono text-umbris-grey text-[10px] uppercase tracking-widest">
            Sibling of{" "}
            <a
              href="https://github.com/0pusAI/Opus-Agent-Swarm-LLM-Framework"
              className="text-umbris-stellar hover:text-umbris-lunar"
              target="_blank"
              rel="noreferrer"
            >
              OPUS
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
