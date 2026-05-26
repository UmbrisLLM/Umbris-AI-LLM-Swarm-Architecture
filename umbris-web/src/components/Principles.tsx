"use client";

import { motion } from "framer-motion";
import { Divider } from "./ui/Divider";
import { fadeUp } from "@/lib/motion";

const PRINCIPLES = [
  {
    n: "I.",
    title: "Parallel Casting",
    body: "Many shadows are cast at once. None depend on the others; all write to the same Umbra. Triangulation, not sequence, is the unit of progress.",
  },
  {
    n: "II.",
    title: "Stigmergic Substrate",
    body: "Agents do not message each other. They modify a shared environment · the Umbra · and respond to its state. Communication is a side effect of work.",
  },
  {
    n: "III.",
    title: "Verified Vision",
    body: "Three stages: weighted Borda aggregation, Iuppiter adjudication, Saturnus falsification. The convocation surfaces what survives, attached to its provenance and confidence.",
  },
];

export function Principles() {
  return (
    <section
      id="principles"
      className="relative w-full bg-umbris-void px-6 py-32 md:py-48"
      aria-label="Three Principles"
    >
      <div className="mx-auto max-w-6xl">
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
          className="umbris-display text-umbris-lunar text-[clamp(2rem,5vw,3.5rem)] text-center mb-20"
        >
          The Three Principles
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {PRINCIPLES.map((p, i) => (
            <motion.div
              key={p.n}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-10% 0px" }}
              variants={fadeUp}
              transition={{ delay: i * 0.15 }}
              className="text-center md:text-left"
            >
              <div className="umbris-display text-umbris-violet text-2xl mb-6">{p.n}</div>
              <h3 className="umbris-serif text-umbris-lunar text-2xl mb-4 italic">
                {p.title}
              </h3>
              <p className="umbris-serif text-umbris-stellar leading-relaxed">
                {p.body}
              </p>
            </motion.div>
          ))}
        </div>

        <Divider className="mt-24" width="100px" />
      </div>
    </section>
  );
}
