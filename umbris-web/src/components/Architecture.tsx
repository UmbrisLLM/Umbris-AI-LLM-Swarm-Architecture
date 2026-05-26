"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Divider } from "./ui/Divider";
import { fadeUp } from "@/lib/motion";
import { AGENT_DESCRIPTORS, SIGIL_UNICODE } from "@umbris/design";

interface NodeSpec {
  id: string;
  label: string;
  role: string;
  desc: string;
  ring: 0 | 1 | 2;
  angleDeg: number;
  glyph: string;
}

// Layout: UMBRA at centre (ring 0). Inner ring (1): MERCURIUS, VENUS, MARS,
// SOL, IUPPITER, SATURNUS. Outer ring (2): LUNA, CAELUM.
const NODES: NodeSpec[] = [
  { id: "umbra",     label: "Umbra",     role: "convergence",      desc: AGENT_DESCRIPTORS.UMBRA,     ring: 0, angleDeg: 0,   glyph: SIGIL_UNICODE.UMBRA },
  { id: "mercurius", label: "Mercurius", role: "the messenger",    desc: AGENT_DESCRIPTORS.MERCURIUS, ring: 1, angleDeg: 0,   glyph: SIGIL_UNICODE.MERCURIUS },
  { id: "venus",     label: "Venus",     role: "the gatherer",     desc: AGENT_DESCRIPTORS.VENUS,     ring: 1, angleDeg: 60,  glyph: SIGIL_UNICODE.VENUS },
  { id: "mars",      label: "Mars",      role: "the challenger",   desc: AGENT_DESCRIPTORS.MARS,      ring: 1, angleDeg: 120, glyph: SIGIL_UNICODE.MARS },
  { id: "sol",       label: "Sol",       role: "the radiant",      desc: AGENT_DESCRIPTORS.SOL,       ring: 1, angleDeg: 180, glyph: SIGIL_UNICODE.SOL },
  { id: "iuppiter",  label: "Iuppiter",  role: "the discerner",    desc: AGENT_DESCRIPTORS.IUPPITER,  ring: 1, angleDeg: 240, glyph: SIGIL_UNICODE.IUPPITER },
  { id: "saturnus",  label: "Saturnus",  role: "the falsifier",    desc: AGENT_DESCRIPTORS.SATURNUS,  ring: 1, angleDeg: 300, glyph: SIGIL_UNICODE.SATURNUS },
  { id: "luna",      label: "Luna",      role: "the path-mapper",  desc: AGENT_DESCRIPTORS.LUNA,      ring: 2, angleDeg: 90,  glyph: SIGIL_UNICODE.LUNA },
  { id: "caelum",    label: "Caelum",    role: "the doer",         desc: AGENT_DESCRIPTORS.CAELUM,    ring: 2, angleDeg: 270, glyph: SIGIL_UNICODE.CAELUM },
];

const RADIUS = { 0: 0, 1: 130, 2: 240 } as const;
const SVG_SIZE = 600;
const CENTRE = SVG_SIZE / 2;

function nodePos(n: NodeSpec) {
  const r = RADIUS[n.ring];
  const a = (n.angleDeg * Math.PI) / 180;
  return { x: CENTRE + r * Math.cos(a), y: CENTRE + r * Math.sin(a) };
}

export function Architecture() {
  const [hovered, setHovered] = useState<string | null>(null);
  const umbra = NODES.find((n) => n.id === "umbra")!;
  const umbraPos = nodePos(umbra);
  const hoverNode = hovered ? NODES.find((n) => n.id === hovered) : null;

  return (
    <section
      id="architecture"
      className="relative w-full bg-umbris-void px-6 py-32 md:py-48"
      aria-label="The Convocation"
    >
      <div className="mx-auto max-w-6xl">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="umbris-eyebrow mb-4 text-center"
        >
          §3 · The Convocation
        </motion.p>
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="umbris-display text-umbris-lunar text-[clamp(2rem,5vw,3.5rem)] text-center mb-12"
        >
          The Convocation
        </motion.h2>

        <div className="relative mx-auto" style={{ maxWidth: SVG_SIZE }}>
          <svg
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            className="w-full h-auto"
            role="img"
            aria-label="Umbra at centre, six planetary agents on inner ring, two on outer ring"
          >
            {/* Concentric ring guides */}
            <circle cx={CENTRE} cy={CENTRE} r={RADIUS[1]} fill="none" stroke="var(--umbris-grey)" strokeWidth="0.5" strokeDasharray="2 4" />
            <circle cx={CENTRE} cy={CENTRE} r={RADIUS[2]} fill="none" stroke="var(--umbris-grey)" strokeWidth="0.5" strokeDasharray="2 4" />

            {/* Lines from each node to Umbra */}
            {NODES.filter((n) => n.id !== "umbra").map((n) => {
              const p = nodePos(n);
              const active = hovered === n.id;
              return (
                <line
                  key={`l-${n.id}`}
                  x1={umbraPos.x}
                  y1={umbraPos.y}
                  x2={p.x}
                  y2={p.y}
                  stroke={active ? "var(--umbris-violet)" : "var(--umbris-grey)"}
                  strokeWidth={active ? 1.4 : 0.6}
                  opacity={active ? 1 : 0.5}
                />
              );
            })}

            {/* Nodes */}
            {NODES.map((n) => {
              const p = nodePos(n);
              const isUmbra = n.id === "umbra";
              const r = isUmbra ? 22 : 13;
              const active = hovered === n.id;
              return (
                <g
                  key={n.id}
                  onMouseEnter={() => setHovered(n.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-pointer"
                  tabIndex={0}
                  onFocus={() => setHovered(n.id)}
                  onBlur={() => setHovered(null)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={r + 4}
                    fill="var(--umbris-void)"
                    stroke={active ? "var(--umbris-violet)" : "var(--umbris-lunar)"}
                    strokeWidth={active ? 1.5 : 0.8}
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={r}
                    fill={isUmbra ? "var(--umbris-violet)" : (active ? "var(--umbris-violet)" : "var(--umbris-lunar)")}
                    opacity={active || isUmbra ? 1 : 0.85}
                  />
                  <text
                    x={p.x}
                    y={p.y + 4}
                    textAnchor="middle"
                    fontSize={isUmbra ? "16" : "11"}
                    fill={isUmbra || active ? "var(--umbris-void)" : "var(--umbris-void)"}
                    style={{ pointerEvents: "none" }}
                  >
                    {n.glyph}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover tooltip */}
          <div className="mt-8 min-h-[5rem] text-center">
            {hoverNode ? (
              <div>
                <div className="umbris-mono text-umbris-violet text-xs uppercase tracking-widest mb-1">
                  {hoverNode.role}
                </div>
                <div className="umbris-display text-umbris-lunar text-xl mb-2">
                  {hoverNode.label}
                </div>
                <p className="umbris-serif text-umbris-stellar italic max-w-md mx-auto">
                  {hoverNode.desc}
                </p>
              </div>
            ) : (
              <p className="umbris-mono text-umbris-grey text-xs uppercase tracking-widest">
                Hover or focus a planet
              </p>
            )}
          </div>
        </div>

        <Divider className="mt-24" width="100px" />
      </div>
    </section>
  );
}
