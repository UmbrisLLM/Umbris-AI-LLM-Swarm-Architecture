import dynamic from "next/dynamic";
import { Manifesto } from "@/components/Manifesto";
import { Principles } from "@/components/Principles";
import { Architecture } from "@/components/Architecture";
import { LiveConvocation } from "@/components/LiveConvocation";
import { Casting } from "@/components/Casting";
import { Compositione } from "@/components/Compositione";
import { Ephemeris } from "@/components/Ephemeris";
import { TechStack } from "@/components/TechStack";
import { CallToAction } from "@/components/CallToAction";
import { Footer } from "@/components/Footer";

const EclipseScene = dynamic(
  () => import("@/components/EclipseScene").then((m) => m.EclipseScene),
  { ssr: false, loading: () => null },
);

const CosmicNebula = dynamic(
  () => import("@/components/CosmicNebula").then((m) => m.CosmicNebula),
  { ssr: false, loading: () => null },
);

export default function HomePage() {
  return (
    <main className="min-h-screen bg-umbris-void text-umbris-lunar overflow-x-hidden">
      {/* ─── Hero · the Eclipse ────────────────────────────────── */}
      <section
        id="hero"
        className="relative min-h-screen w-full overflow-hidden bg-umbris-void"
        aria-label="UMBRIS · the Eclipse"
      >
        <CosmicNebula intensity={0.55} />
        <EclipseScene />

        <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="umbris-eyebrow text-umbris-violet mb-10">
            — § ARS MEMORIAE · MMXXVI —
          </p>

          <h1
            className="umbris-display text-umbris-lunar text-[clamp(3.5rem,12vw,9rem)] leading-none"
            style={{
              textShadow:
                "0 0 36px rgba(156,123,217,0.38), 0 0 120px rgba(156,123,217,0.14)",
            }}
          >
            U&nbsp;M&nbsp;B&nbsp;R&nbsp;I&nbsp;S
          </h1>

          <div className="mt-10 max-w-2xl">
            <p className="umbris-serif italic text-umbris-lunar text-lg md:text-2xl leading-snug mb-2">
              De umbris idearum.
            </p>
            <p className="umbris-mono text-umbris-stellar text-[0.7rem] md:text-[0.78rem] uppercase tracking-widest mt-4">
              A&nbsp; hermetic-cosmic&nbsp; multi-agent&nbsp; LLM&nbsp; convocation
              <br />
              for&nbsp; collective&nbsp; reasoning
            </p>
          </div>

          <div className="absolute bottom-12 flex flex-col items-center gap-3">
            <span className="umbris-mono text-[0.65rem] uppercase tracking-widest text-umbris-grey">
              Scroll
            </span>
            <span
              className="block h-10 w-px"
              style={{
                background:
                  "linear-gradient(to bottom, var(--umbris-grey), transparent)",
              }}
            />
          </div>
        </div>
      </section>

      {/* ─── The convocation as told in eight movements ────────── */}
      <Manifesto />
      <Principles />
      <Architecture />
      <LiveConvocation />
      <Casting />
      <Compositione />
      <Ephemeris />
      <TechStack />
      <CallToAction />
      <Footer />
    </main>
  );
}
