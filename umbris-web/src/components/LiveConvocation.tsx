"use client";

/**
 * LiveConvocation · interactive cinematic demo of the UMBRIS deliberation flow.
 *
 * v0.2: scripted demo with real-feeling content. The convocation graph,
 * transcript, and vision reveal mirror the actual hello_convocation.py
 * lifecycle so this doubles as the visual spec for when we wire
 * the real Python convocation in via SSE.
 *
 * No backend calls. Pure client-side animation + curated records.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { Divider } from "./ui/Divider";
import { CastingInput } from "./CastingInput";
import type { AgentRole } from "@umbris/design";

// The 3D planetary system is heavy (R3F + bloom). Load client-only.
const PlanetarySystem3D = dynamic(
  () => import("./PlanetarySystem3D").then((m) => m.PlanetarySystem3D),
  { ssr: false, loading: () => <div style={{ height: 520 }} /> },
);

// Map the lowercase agentId used in the scripted demo to the uppercase
// AgentRole enum used by PlanetarySystem3D. UMBRA isn't on the orbit so
// it never enters the active/completed sets.
function toAgentRole(id: string): AgentRole | null {
  const upper = id.toUpperCase();
  if (
    upper === "MERCURIUS" ||
    upper === "VENUS" ||
    upper === "MARS" ||
    upper === "SOL" ||
    upper === "IUPPITER" ||
    upper === "SATURNUS" ||
    upper === "LUNA" ||
    upper === "STELLA"
  ) {
    return upper as AgentRole;
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────

type Phase =
  | "idle"
  | "scouting"
  | "gathering"
  | "challenging"
  | "synthesising"
  | "verifying"
  | "complete";
type AgentRole =
  | "umbra"
  | "mercurius"
  | "luna"
  | "venus"
  | "mars"
  | "sol"
  | "iuppiter"
  | "saturnus"
  | "stella";

interface Agent {
  id: string;
  label: string;
  role: AgentRole;
  ring: 0 | 1 | 2;
  angleDeg: number;
  glyph: string;
}

interface ScriptedRecord {
  agentId: string;
  role: AgentRole;
  type: string;
  content: string;
  confidence: number;
  costUsd: number;
  delayMs: number;
  durationMs: number;
}

// ──────────────────────────────────────────────────────────────────
// Agents · the nine planetary intelligences around the Umbra
// ──────────────────────────────────────────────────────────────────

const AGENTS: Agent[] = [
  // Umbra at the centre
  { id: "umbra", label: "Umbra", role: "umbra", ring: 0, angleDeg: 0, glyph: "⬤" },

  // Inner ring · the six worker planets
  { id: "mercurius", label: "Mercurius", role: "mercurius", ring: 1, angleDeg: 0,   glyph: "☿" },
  { id: "venus",     label: "Venus",     role: "venus",     ring: 1, angleDeg: 60,  glyph: "♀" },
  { id: "mars",      label: "Mars",      role: "mars",      ring: 1, angleDeg: 120, glyph: "♂" },
  { id: "sol",       label: "Sol",       role: "sol",       ring: 1, angleDeg: 180, glyph: "☉" },
  { id: "iuppiter",  label: "Iuppiter",  role: "iuppiter",  ring: 1, angleDeg: 240, glyph: "♃" },
  { id: "saturnus",  label: "Saturnus",  role: "saturnus",  ring: 1, angleDeg: 300, glyph: "♄" },

  // Outer ring · the path-mapper and the fixed-star executor
  { id: "luna",   label: "Luna",   role: "luna",   ring: 2, angleDeg: 90,  glyph: "☽" },
  { id: "stella", label: "Stella", role: "stella", ring: 2, angleDeg: 270, glyph: "✦" },
];

const RADIUS: Record<0 | 1 | 2, number> = { 0: 0, 1: 130, 2: 230 };
const SVG_SIZE = 580;
const CENTER = SVG_SIZE / 2;

function nodePos(a: Agent) {
  const r = RADIUS[a.ring];
  const rad = (a.angleDeg * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

// ──────────────────────────────────────────────────────────────────
// Curated records for the canonical consciousness question.
// (Same prompt as umbris-core/examples/hello_convocation.py · these read
// as if the real convocation wrote them.)
// ──────────────────────────────────────────────────────────────────

const DEFAULT_QUESTION =
  "What are the three strongest arguments against my own thesis that consciousness is computable?";

const SCRIPT: ScriptedRecord[] = [
  // Phase 1 · Mercurius + Luna scout in parallel
  { agentId: "mercurius", role: "mercurius", type: "observation", confidence: 0.91, costUsd: 0.018,
    content: "Chalmers (1995) · the hard problem distinguishes 'easy' problems (information processing) from the 'hard' problem of subjective experience. Three decades later, this remains the central anti-computationalism framing.",
    delayMs: 600, durationMs: 1800 },
  { agentId: "luna", role: "luna", type: "observation", confidence: 0.85, costUsd: 0.021,
    content: "Searle's Chinese Room (1980) · syntactic computation alone cannot generate semantic understanding. The 'systems reply' and 'robot reply' counter-arguments exist; the intuition pump persists.",
    delayMs: 900, durationMs: 1900 },

  // Phase 2 · Venus gathers harmony from the field
  { agentId: "venus", role: "venus", type: "hypothesis", confidence: 0.84, costUsd: 0.082,
    content: "The strongest counter is the explanatory gap. Behavioural isomorphism does not entail experiential isomorphism. Even a perfect functional emulation of a brain leaves the question 'why is anyone home?' unanswered in principle. Computation is necessary; on this view, it is not sufficient.",
    delayMs: 3500, durationMs: 4200 },

  // Phase 3 · Mars challenges
  { agentId: "mars", role: "mars", type: "critique", confidence: 0.87, costUsd: 0.064,
    content: "Substrate-dependence arguments (Orch-OR, NMDA specificity) are empirically weak · no result rules out functional emulation. The explanatory gap survives more attacks. A third class of objection is missing: temporal binding. Consciousness presents as unified across roughly 100ms; discrete computational steps may not reproduce continuous binding. Distinct from H1.",
    delayMs: 8800, durationMs: 3600 },

  // Phase 4 · Sol synthesises
  { agentId: "sol", role: "sol", type: "synthesis", confidence: 0.86, costUsd: 0.142,
    content: "[draft synthesis assembled from Mercurius, Luna, Venus, Mars · see final vision]",
    delayMs: 13500, durationMs: 5200 },

  // Phase 5 · Iuppiter judges then Saturnus falsifies
  { agentId: "iuppiter", role: "iuppiter", type: "verdict.weight", confidence: 0.88, costUsd: 0.094,
    content: "Three candidate objections rank above the next: explanatory gap, temporal binding, Φ-incomputability. Each rests on a distinct foundation. Adjudication: surface all three.",
    delayMs: 19200, durationMs: 3800 },
  { agentId: "saturnus", role: "saturnus", type: "verdict.accepted", confidence: 0.83, costUsd: 0.119,
    content: "Attempted falsification against the standard computationalist replies · functionalism, multiple realisability, Dennett's heterophenomenology. Each argument resists. Verdict: accepted.",
    delayMs: 23200, durationMs: 4200 },

  // Phase 6 · Umbra writes provenance
  { agentId: "umbra", role: "umbra", type: "provenance.summary", confidence: 1.0, costUsd: 0,
    content: "8 records written · 7 planets cast · 1 revolution · accepted on first verification pass.",
    delayMs: 27800, durationMs: 800 },
];

const FINAL_ANSWER = `Three strongest arguments against the thesis that consciousness is computable:

1. The explanatory gap (Chalmers). Even a perfect functional emulation of a brain leaves intact the question of why there is something it is like to undergo the computation. Computation may be necessary; it is not, on this view, demonstrably sufficient.

2. Temporal binding. Consciousness presents as a unified experiential 'now' across roughly 100ms. Discrete computational steps, however fast, may fail to reproduce the continuous binding that experience requires · a different objection from the hard problem and not yet answered by it.

3. Φ-incomputability. Integrated Information Theory's Φ · currently the leading mathematical proposal for what consciousness IS · is not Turing-computable as defined. If the right theory of consciousness has this shape, no algorithmic system instantiates it, regardless of behavioural fidelity.

These three resist the standard computationalist replies (functionalism, multiple realisability, Dennett's heterophenomenology). They do not prove computationalism false. They mark the territory it has not yet covered.`;

const TOTAL_RUNTIME_MS = 29500;

// ──────────────────────────────────────────────────────────────────
// Color and label helpers
// ──────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<AgentRole, { node: string; glow: string; label: string }> = {
  umbra:     { node: "#9C7BD9", glow: "rgba(156,123,217,0.55)", label: "text-umbris-violet" },
  mercurius: { node: "#DCDEE7", glow: "rgba(220,222,231,0.45)", label: "text-umbris-lunar" },
  luna:      { node: "#DCDEE7", glow: "rgba(220,222,231,0.45)", label: "text-umbris-lunar" },
  venus:     { node: "#DCDEE7", glow: "rgba(220,222,231,0.45)", label: "text-umbris-lunar" },
  mars:      { node: "#DCDEE7", glow: "rgba(220,222,231,0.45)", label: "text-umbris-lunar" },
  sol:       { node: "#DCDEE7", glow: "rgba(220,222,231,0.55)", label: "text-umbris-lunar" },
  iuppiter:  { node: "#9C7BD9", glow: "rgba(156,123,217,0.45)", label: "text-umbris-violet" },
  saturnus:  { node: "#9C7BD9", glow: "rgba(156,123,217,0.45)", label: "text-umbris-violet" },
  stella:    { node: "#DCDEE7", glow: "rgba(220,222,231,0.45)", label: "text-umbris-lunar" },
};

// ──────────────────────────────────────────────────────────────────
// Small helpers
// ──────────────────────────────────────────────────────────────────

function timeStamp(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  const ms = Math.floor((seconds * 1000) % 1000).toString().padStart(3, "0");
  return `${m}:${s}.${ms}`;
}

function trimContent(text: string, max = 110): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

// ──────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────

/**
 * LiveConvocation · cinematic interactive demo of the UMBRIS convocation deliberating.
 *
 * @param embedded · When true, hides the §4 eyebrow / "Live Convocation" title /
 *   subtitle block, so the dedicated page can wrap the widget in its own
 *   page hero. Default false (used as the homepage section).
 */
export function LiveConvocation({ embedded = false }: { embedded?: boolean } = {}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set());
  const [completedAgents, setCompletedAgents] = useState<Set<string>>(new Set());
  const [transcript, setTranscript] = useState<ScriptedRecord[]>([]);
  const [costUsd, setCostUsd] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(0);

  const startedAtRef = useRef<number | null>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const reset = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setPhase("idle");
    setActiveAgents(new Set());
    setCompletedAgents(new Set());
    setTranscript([]);
    setCostUsd(0);
    setElapsedSec(0);
    setShowAnswer(false);
    setAnswerRevealed(0);
    startedAtRef.current = null;
  }, []);

  const begin = useCallback(() => {
    reset();
    startedAtRef.current = performance.now();
    setPhase("scouting");

    SCRIPT.forEach((rec) => {
      timersRef.current.push(
        setTimeout(() => {
          setActiveAgents((prev) => new Set(prev).add(rec.agentId));
          if (rec.role === "mercurius" || rec.role === "luna") setPhase("scouting");
          if (rec.role === "venus") setPhase("gathering");
          if (rec.role === "mars") setPhase("challenging");
          if (rec.role === "sol") setPhase("synthesising");
          if (rec.role === "iuppiter" || rec.role === "saturnus") setPhase("verifying");
        }, rec.delayMs)
      );
      timersRef.current.push(
        setTimeout(() => {
          setActiveAgents((prev) => {
            const next = new Set(prev);
            next.delete(rec.agentId);
            return next;
          });
          setCompletedAgents((prev) => new Set(prev).add(rec.agentId));
          setTranscript((prev) => [...prev, rec]);
          setCostUsd((prev) => prev + rec.costUsd);
        }, rec.delayMs + rec.durationMs)
      );
    });

    timersRef.current.push(
      setTimeout(() => {
        setShowAnswer(true);
        setPhase("complete");
      }, TOTAL_RUNTIME_MS - 500)
    );
  }, [reset]);

  // Drive the elapsed-time clock
  useEffect(() => {
    if (phase === "idle" || phase === "complete") return;
    let raf = 0;
    const tick = () => {
      if (startedAtRef.current) {
        setElapsedSec((performance.now() - startedAtRef.current) / 1000);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Drive the vision reveal (per-letter)
  useEffect(() => {
    if (!showAnswer) return;
    let raf = 0;
    const start = performance.now();
    const total = FINAL_ANSWER.length;
    const durationMs = 4500;
    const tick = () => {
      const t = (performance.now() - start) / durationMs;
      const n = Math.min(total, Math.floor(t * total));
      setAnswerRevealed(n);
      if (n < total) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [showAnswer]);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
  }, []);

  const isRunning = phase !== "idle" && phase !== "complete";

  return (
    <section
      id="live-convocation"
      className={`relative w-full bg-umbris-void px-6 ${embedded ? "pt-4 pb-16 md:pb-24" : "py-32 md:py-48"}`}
      aria-label="Live Convocation"
    >
      <div className="mx-auto max-w-5xl">
        {!embedded && (
          <>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="umbris-eyebrow mb-4 text-center"
            >
              §4 · The convocation in motion
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="umbris-display text-umbris-lunar text-[clamp(2rem,5vw,3.5rem)] text-center mb-4"
            >
              Live Convocation
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="umbris-mono text-umbris-violet text-xs uppercase tracking-widest text-center mb-12"
            >
              REAL-TIME UMBRIS LLM CONVOCATION · LET THE NINE DELIBERATE
            </motion.p>
          </>
        )}

        {/* Input · the casting altar */}
        <div className="mb-8">
          <CastingInput
            value={question}
            onChange={setQuestion}
            onSubmit={isRunning ? () => {} : begin}
            disabled={isRunning}
            loading={isRunning}
            placeholder="What is the question worth deliberating?"
            buttonLabel="Cast"
          />
          {phase === "complete" && (
            <button
              type="button"
              onClick={reset}
              className="mt-3 umbris-mono text-[10px] uppercase tracking-widest text-umbris-stellar hover:text-umbris-lunar transition-colors"
            >
              · reset the altar ·
            </button>
          )}
        </div>

        {/* Convocation · the 3D galactic system */}
        <ConvocationSystemFrame
          activeAgents={activeAgents}
          completedAgents={completedAgents}
          phase={phase}
          elapsedSec={elapsedSec}
          costUsd={costUsd}
        />

        {/* Transcript */}
        <div className="border border-umbris-grey/40 bg-umbris-void/80 p-6 font-mono text-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="umbris-eyebrow text-umbris-violet">· transcript ·</div>
            <div className="umbris-mono text-umbris-grey text-[0.65rem]">
              {transcript.length} records
            </div>
          </div>
          <div className="space-y-2 min-h-[14rem] max-h-[18rem] overflow-y-auto">
            <AnimatePresence initial={false}>
              {transcript.map((r, i) => (
                <motion.div
                  key={`${r.agentId}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-umbris-stellar leading-snug"
                >
                  <span className="text-umbris-grey mr-2">$</span>
                  <span className={clsx("font-medium", ROLE_COLORS[r.role].label)}>
                    {r.agentId}
                  </span>
                  <span className="text-umbris-grey mx-1">→</span>
                  <span className="text-umbris-lunar">{r.type}</span>
                  <span className="text-umbris-grey ml-2">
                    conf={r.confidence.toFixed(2)} · ${r.costUsd.toFixed(4)}
                  </span>
                  <div className="ml-4 mt-1 text-umbris-stellar/80 text-[0.78rem] leading-relaxed">
                    {trimContent(r.content)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isRunning && (
              <div className="text-umbris-violet flex items-center">
                <span className="text-umbris-grey mr-2">$</span>
                <span className="inline-block w-2 h-4 bg-umbris-violet animate-pulse align-middle" />
              </div>
            )}
            {phase === "idle" && transcript.length === 0 && (
              <div className="text-umbris-grey italic">
                press <span className="umbris-mono text-umbris-violet">Begin Deliberation</span> to wake the convocation
              </div>
            )}
          </div>
        </div>

        {/* Vision reveal */}
        <AnimatePresence>
          {showAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
              className="border border-umbris-violet/60 bg-umbris-void p-8 mt-2"
            >
              <div className="umbris-eyebrow text-umbris-violet mb-4">
                · verified vision · accepted on first pass ·
              </div>
              <pre className="umbris-serif text-umbris-lunar text-base leading-relaxed whitespace-pre-wrap font-serif">
                {FINAL_ANSWER.slice(0, answerRevealed)}
                {answerRevealed < FINAL_ANSWER.length && (
                  <span className="inline-block w-2 h-4 bg-umbris-violet animate-pulse align-middle ml-1" />
                )}
              </pre>
              {answerRevealed >= FINAL_ANSWER.length && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mt-6 pt-6 border-t border-umbris-grey/40 flex items-center justify-between"
                >
                  <div className="umbris-mono text-umbris-stellar text-xs">
                    9 planets · 8 records · {timeStamp(elapsedSec)} · ${costUsd.toFixed(4)} total
                  </div>
                  <div className="umbris-mono text-umbris-grey text-[0.65rem] uppercase tracking-widest">
                    cinematic preview · real convocation coming online
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <Divider className="mt-20" width="100px" />
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────
// ConvocationGraph · SVG visualisation of the planetary convocation
// ──────────────────────────────────────────────────────────────────

interface ConvocationSystemFrameProps {
  activeAgents: Set<string>;
  completedAgents: Set<string>;
  phase: Phase;
  elapsedSec: number;
  costUsd: number;
}

/**
 * The 3D planetary system wrapped in the UMBRIS instrument-panel
 * chrome · corner brackets, phase indicator on the upper-left, the
 * elapsed clock + running cost on the upper-right.
 */
function ConvocationSystemFrame({
  activeAgents,
  completedAgents,
  phase,
  elapsedSec,
  costUsd,
}: ConvocationSystemFrameProps) {
  const active = useMemo(() => {
    const out = new Set<AgentRole>();
    activeAgents.forEach((id) => {
      const r = toAgentRole(id);
      if (r) out.add(r);
    });
    return out;
  }, [activeAgents]);

  const completed = useMemo(() => {
    const out = new Set<AgentRole>();
    completedAgents.forEach((id) => {
      const r = toAgentRole(id);
      if (r) out.add(r);
    });
    return out;
  }, [completedAgents]);

  return (
    <div className="relative w-full mb-6">
      {/* Corner brackets · the instrument frame */}
      <CornerBrackets />

      <PlanetarySystem3D
        activeAgents={active}
        completedAgents={completed}
        height={560}
        interactive={false}
        emptyPrompt="press cast to wake the convocation"
      />

      {/* HUD overlay · phase label + clock/cost */}
      <div className="pointer-events-none absolute top-5 left-5 right-5 flex items-start justify-between z-20">
        <div>
          <div className="umbris-eyebrow text-umbris-violet text-[10px] tracking-[0.18em]">
            {phase === "idle" && "· convocation at rest ·"}
            {phase === "scouting" && "· mercurius and luna scouting ·"}
            {phase === "gathering" && "· venus gathering harmony ·"}
            {phase === "challenging" && "· mars circling ·"}
            {phase === "synthesising" && "· sol fusing ·"}
            {phase === "verifying" && "· iuppiter and saturnus weighing ·"}
            {phase === "complete" && "· vision accepted ·"}
          </div>
        </div>
        <div className="text-right">
          <div className="umbris-mono text-umbris-stellar text-xs tabular-nums">
            {timeStamp(elapsedSec)}
          </div>
          <div className="umbris-mono text-umbris-violet text-sm font-medium tabular-nums">
            ${costUsd.toFixed(4)}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Four corner brackets · thin violet hairlines that frame the 3D
 * scene as an instrument, not a card.
 */
function CornerBrackets() {
  const armStyle: React.CSSProperties = {
    position: "absolute",
    width: 28,
    height: 1,
    backgroundColor: "var(--umbris-violet)",
    opacity: 0.7,
    pointerEvents: "none",
    zIndex: 25,
  };
  const stemStyle: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 28,
    backgroundColor: "var(--umbris-violet)",
    opacity: 0.7,
    pointerEvents: "none",
    zIndex: 25,
  };
  return (
    <>
      <span style={{ ...armStyle, top: 0, left: 0 }} />
      <span style={{ ...stemStyle, top: 0, left: 0 }} />
      <span style={{ ...armStyle, top: 0, right: 0 }} />
      <span style={{ ...stemStyle, top: 0, right: 0 }} />
      <span style={{ ...armStyle, bottom: 0, left: 0 }} />
      <span style={{ ...stemStyle, bottom: 0, left: 0 }} />
      <span style={{ ...armStyle, bottom: 0, right: 0 }} />
      <span style={{ ...stemStyle, bottom: 0, right: 0 }} />
    </>
  );
}
