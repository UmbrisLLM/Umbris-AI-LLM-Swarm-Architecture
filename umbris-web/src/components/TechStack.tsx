"use client";

import { motion } from "framer-motion";
import { Divider } from "./ui/Divider";
import { fadeUp } from "@/lib/motion";

interface Row {
  label: string;
  desc: string;
  status: "ACTIVE" | "LIVE" | "PLANNED";
}

const ROWS: Row[] = [
  { label: "claude-opus-4-7", desc: "the convocation's primary workers", status: "ACTIVE" },
  { label: "claude-sonnet-4-6", desc: "scouts and lightweight critique", status: "ACTIVE" },
  { label: "umbris-core (Python)", desc: "the convocation engine", status: "LIVE" },
  { label: "umbris-design", desc: "brand single source", status: "LIVE" },
  { label: "Next.js 14 + Three.js + GSAP + Lenis", desc: "this site", status: "LIVE" },
  { label: "umbris-studio (Tauri + Next.js)", desc: "the Sphere of Shadows HUD", status: "PLANNED" },
  { label: "The Custos", desc: "autonomous sentinel", status: "PLANNED" },
  { label: "Qdrant", desc: "vector memory (stubbed)", status: "PLANNED" },
  { label: "Neo4j", desc: "graph memory (stubbed)", status: "PLANNED" },
  { label: "OpenTelemetry", desc: "distributed tracing", status: "PLANNED" },
];

const STATUS_COLOR: Record<Row["status"], string> = {
  ACTIVE: "border-umbris-lunar text-umbris-lunar",
  LIVE: "border-umbris-violet text-umbris-violet",
  PLANNED: "border-umbris-grey text-umbris-grey",
};

export function TechStack() {
  return (
    <section
      id="stack"
      className="relative w-full bg-umbris-void px-6 py-32 md:py-48"
      aria-label="Materials"
    >
      <div className="mx-auto max-w-4xl">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="umbris-eyebrow mb-4 text-center"
        >
          §8 · Stack
        </motion.p>
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="umbris-display text-umbris-lunar text-[clamp(2rem,5vw,3.5rem)] text-center mb-16"
        >
          Materials
        </motion.h2>

        <div className="space-y-1">
          {ROWS.map((r, i) => (
            <motion.div
              key={r.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-5% 0px" }}
              variants={fadeUp}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className="grid grid-cols-12 items-baseline gap-4 py-4 border-b border-umbris-grey/40"
            >
              <div className="col-span-12 sm:col-span-4 umbris-mono text-umbris-lunar text-sm">
                {r.label}
              </div>
              <div className="col-span-9 sm:col-span-6 umbris-serif text-umbris-stellar text-base italic">
                {r.desc}
              </div>
              <div className="col-span-3 sm:col-span-2 text-right">
                <span
                  className={`inline-block px-2 py-1 umbris-mono text-[0.65rem] uppercase tracking-widest border ${STATUS_COLOR[r.status]}`}
                >
                  {r.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <Divider className="mt-20" width="100px" />
      </div>
    </section>
  );
}
