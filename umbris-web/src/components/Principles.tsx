"use client";

import { motion } from "framer-motion";
import { Divider } from "./ui/Divider";
import { fadeUp } from "@/lib/motion";

const PRINCIPLES = [
  {
    n: "I.",
    title: "Parallel Casting",
    body: "Many shadows are cast at once. None depend on the others; all write to the same Umbra. Triangulation, not sequence, is the unit of progress.",
    glyph: "◐",
  },
  {
    n: "II.",
    title: "Stigmergic Substrate",
    body: "Agents do not message each other. They modify a shared environment · the Umbra · and respond to its state. Communication is a side effect of work.",
    glyph: "⬤",
  },
  {
    n: "III.",
    title: "Verified Vision",
    body: "Three stages: weighted Borda aggregation, Iuppiter adjudication, Saturnus falsification. The convocation surfaces what survives, attached to its provenance and confidence.",
    glyph: "◑",
  },
];

export function Principles() {
  return (
    <section
      id="principles"
      className="relative w-full bg-umbris-void px-6 py-32 md:py-48 overflow-hidden"
      aria-label="Three Principles"
    >
      {/* Faint radial violet glow behind the section · feels cosmic */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(156,123,217,0.08), transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="umbris-eyebrow mb-4 text-center"
        >
          §2 · Three principles
        </motion.p>
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="umbris-display text-umbris-lunar text-[clamp(2rem,5vw,3.5rem)] text-center mb-6"
        >
          The Three Principles
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="umbris-serif italic text-umbris-stellar text-center max-w-xl mx-auto mb-20"
        >
          The convocation rests on three irreducible laws · each one a
          phase of the eclipse.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
          {PRINCIPLES.map((p, i) => (
            <motion.div
              key={p.n}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-10% 0px" }}
              variants={fadeUp}
              transition={{ delay: i * 0.15 }}
              className="relative group"
            >
              {/* Card frame · hairline that warms on hover */}
              <div className="relative border border-umbris-grey/45 group-hover:border-umbris-violet/70 transition-colors duration-500 p-8 h-full bg-umbris-void/60 backdrop-blur-[1px]">
                {/* Corner ticks · subtle instrument frame */}
                <PrincipleCornerTicks />

                {/* Glyph · phase of the eclipse */}
                <div className="mb-6 flex items-baseline gap-3">
                  <span
                    className="umbris-display text-umbris-violet text-3xl leading-none"
                    style={{
                      textShadow: "0 0 18px rgba(156,123,217,0.45)",
                    }}
                  >
                    {p.glyph}
                  </span>
                  <span className="umbris-mono text-umbris-grey text-[10px] uppercase tracking-[0.2em]">
                    phase {p.n.replace(".", "")}
                  </span>
                </div>

                <h3 className="umbris-display text-umbris-lunar text-2xl mb-4 leading-tight">
                  {p.title}
                </h3>
                <p className="umbris-serif text-umbris-stellar leading-relaxed">
                  {p.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <Divider className="mt-24" width="100px" />
      </div>
    </section>
  );
}

function PrincipleCornerTicks() {
  const arm: React.CSSProperties = {
    position: "absolute",
    width: 10,
    height: 1,
    backgroundColor: "var(--umbris-violet)",
    opacity: 0.6,
  };
  const stem: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 10,
    backgroundColor: "var(--umbris-violet)",
    opacity: 0.6,
  };
  return (
    <>
      <span style={{ ...arm, top: -1, left: -1 }} aria-hidden />
      <span style={{ ...stem, top: -1, left: -1 }} aria-hidden />
      <span style={{ ...arm, top: -1, right: -1 }} aria-hidden />
      <span style={{ ...stem, top: -1, right: -1 }} aria-hidden />
      <span style={{ ...arm, bottom: -1, left: -1 }} aria-hidden />
      <span style={{ ...stem, bottom: -1, left: -1 }} aria-hidden />
      <span style={{ ...arm, bottom: -1, right: -1 }} aria-hidden />
      <span style={{ ...stem, bottom: -1, right: -1 }} aria-hidden />
    </>
  );
}
