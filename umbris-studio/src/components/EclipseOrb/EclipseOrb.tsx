"use client";

/**
 * The Eclipse Orb · the iconic central component of UMBRIS Studio.
 *
 * The Closed Eclipse at the centre · a pure black umbra disc ringed by
 * a thin cosmic-violet corona with a diamond-ring flash at one o'clock.
 * Eight planetary sigils orbit on the outer ring with subtle motion in
 * idle state and violet pulse activation when records flow from a given
 * planet.
 *
 * Where OPUS's ColonyOrb showed a wireframe armillary eye at the
 * centre, UMBRIS reads the same geometry as an eclipse · the substrate
 * (UMBRA) hidden behind its own corona, planets in deliberation
 * orbiting around it.
 */

import { useMemo } from "react";
import {
  ORB_AGENT_ORDER,
  AGENT_DESCRIPTORS,
  type AgentRole,
} from "@umbris/design";
import { SIGIL_COMPONENTS } from "@umbris/design/sigils";

export type OrbState = "idle" | "deliberating" | "verified" | "failed";

interface EclipseOrbProps {
  state?: OrbState;
  activeAgents?: ReadonlySet<AgentRole>;
  onAgentClick?: (agent: AgentRole) => void;
  size?: number;
}

const VB = 480;
const CENTER = VB / 2;
const INNER_R = 80;
const ORBIT_R = 170;
const OUTER_R = 220;

// Diamond-ring flash position · roughly 1 o'clock on the umbra rim.
// Angle measured from 12 o'clock, clockwise.
const FLASH_ANGLE_DEG = 32;

// Deterministic star field · seeded so it does not reshuffle on rerender.
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateStars(count: number, seed: number) {
  const rand = seededRandom(seed);
  return Array.from({ length: count }, () => ({
    x: rand() * VB,
    y: rand() * VB,
    r: 0.5 + rand() * 0.8,
    opacity: 0.15 + rand() * 0.3,
    delay: rand() * 4,
  }));
}

export function EclipseOrb({
  state = "idle",
  activeAgents = new Set<AgentRole>(),
  onAgentClick,
  size = 480,
}: EclipseOrbProps) {
  const stars = useMemo(() => generateStars(28, 42), []);
  const deliberating = state === "deliberating";
  const verified = state === "verified";
  const failed = state === "failed";

  // Diamond-ring flash position in viewBox coordinates.
  const flashRad = ((FLASH_ANGLE_DEG - 90) * Math.PI) / 180;
  const flashCx = CENTER + INNER_R * Math.cos(flashRad);
  const flashCy = CENTER + INNER_R * Math.sin(flashRad);

  // Corona stroke colour. Falls to grey on failure.
  const coronaStroke = failed ? "#4A4D5C" : "#9C7BD9";

  return (
    <div
      className="relative select-none"
      style={{ width: size, height: size }}
      aria-label="The Eclipse Orb · planetary agents arranged on an orbit around the central umbra"
    >
      <svg
        viewBox={`0 0 ${VB} ${VB}`}
        width={size}
        height={size}
        className="absolute inset-0"
      >
        <defs>
          <radialGradient id="orb-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(156,123,217,0.18)" />
            <stop offset="55%" stopColor="rgba(156,123,217,0.04)" />
            <stop offset="100%" stopColor="rgba(156,123,217,0)" />
          </radialGradient>
          <radialGradient id="flash-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(250,230,176,0.95)" />
            <stop offset="40%" stopColor="rgba(250,230,176,0.45)" />
            <stop offset="100%" stopColor="rgba(250,230,176,0)" />
          </radialGradient>
        </defs>

        {/* ── Star field ─────────────────────────────────────────── */}
        <g>
          {stars.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="#DCDEE7"
              opacity={s.opacity}
              style={{
                animation: `umbris-star-twinkle 4s ease-in-out ${s.delay}s infinite`,
              }}
            />
          ))}
        </g>

        {/* ── Outer dashed halo ring · slow counter-clockwise ─── */}
        <g
          style={{
            transformOrigin: `${CENTER}px ${CENTER}px`,
            animation: deliberating
              ? "umbris-ring-rotate-reverse 60s linear infinite"
              : "umbris-ring-rotate-reverse 90s linear infinite",
          }}
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={OUTER_R}
            fill="none"
            stroke={coronaStroke}
            strokeWidth={0.5}
            strokeOpacity={0.28}
            strokeDasharray="4 2"
          />
        </g>

        {/* ── Soft violet halo behind the umbra ─────────────────── */}
        <circle cx={CENTER} cy={CENTER} r={INNER_R + 30} fill="url(#orb-halo)" />

        {/* ── The Closed Eclipse ────────────────────────────────── */}
        {/* The umbra · a pure void disc · the absence at the centre */}
        <circle cx={CENTER} cy={CENTER} r={INNER_R} fill="#000000" />

        {/* The corona · three concentric strokes of violet at
            decreasing opacity, the eclipse's ring of light */}
        <g
          style={
            deliberating
              ? { animation: "umbris-corona-pulse 2.4s ease-in-out infinite" }
              : undefined
          }
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_R + 1.5}
            fill="none"
            stroke={coronaStroke}
            strokeWidth={1.4}
            strokeOpacity={failed ? 0.35 : 0.85}
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_R + 5}
            fill="none"
            stroke={coronaStroke}
            strokeWidth={0.85}
            strokeOpacity={failed ? 0.2 : 0.55}
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_R + 10}
            fill="none"
            stroke={coronaStroke}
            strokeWidth={0.55}
            strokeOpacity={failed ? 0.1 : 0.28}
          />
        </g>

        {/* ── The diamond-ring flash · one o'clock on the umbra rim ── */}
        {!failed && (
          <g>
            {/* Outer warm glow halo · brighter on verified */}
            <circle
              cx={flashCx}
              cy={flashCy}
              r={verified ? 18 : 11}
              fill="url(#flash-glow)"
              style={
                verified
                  ? { animation: "umbris-pulse-violet 1.4s ease-in-out infinite" }
                  : undefined
              }
            />
            {/* The bright corona-warm bead */}
            <circle
              cx={flashCx}
              cy={flashCy}
              r={verified ? 4 : 3}
              fill="#FAE6B0"
              opacity={verified ? 1 : 0.92}
            />
            {/* Thin warm ring tracing the flash, gives the "ring" of the
                diamond-ring effect */}
            <circle
              cx={flashCx}
              cy={flashCy}
              r={verified ? 7 : 5.5}
              fill="none"
              stroke="#FAE6B0"
              strokeWidth={0.6}
              strokeOpacity={verified ? 0.7 : 0.4}
            />
          </g>
        )}

        {/* ── Agent orbit ring ──────────────────────────────────── */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={ORBIT_R}
          fill="none"
          stroke={coronaStroke}
          strokeWidth={0.75}
          strokeOpacity={0.55}
        />

        {/* ── Anchor dots between sigils (every 22.5°) ───────────── */}
        {Array.from({ length: 16 }, (_, i) => {
          const angle = (i * 22.5 - 90) * (Math.PI / 180);
          const cx = CENTER + ORBIT_R * Math.cos(angle);
          const cy = CENTER + ORBIT_R * Math.sin(angle);
          if (i % 2 === 1) {
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={1.5}
                fill={coronaStroke}
                opacity={0.5}
              />
            );
          }
          return null;
        })}
      </svg>

      {/* ── Agent sigils · positioned absolutely, react-driven ─── */}
      {ORB_AGENT_ORDER.map((role, i) => (
        <AgentNode
          key={role}
          role={role}
          index={i}
          isActive={activeAgents.has(role)}
          orbState={state}
          onClick={onAgentClick ? () => onAgentClick(role) : undefined}
          parentSize={size}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────

function AgentNode({
  role,
  index,
  isActive,
  orbState,
  onClick,
  parentSize,
}: {
  role: AgentRole;
  index: number;
  isActive: boolean;
  orbState: OrbState;
  onClick?: () => void;
  parentSize: number;
}) {
  const Sigil = SIGIL_COMPONENTS[role];
  const angle = (index * 45 - 90) * (Math.PI / 180); // 0° = top, clockwise
  const scale = parentSize / VB;
  const r = ORBIT_R * scale;
  const cx = CENTER * scale + r * Math.cos(angle);
  const cy = CENTER * scale + r * Math.sin(angle);
  const nodeSize = 64 * scale;

  const deliberating = orbState === "deliberating";
  const failed = orbState === "failed";
  const dim = deliberating ? !isActive : false;
  const opacity = failed ? 0.2 : dim ? 0.4 : isActive ? 1 : 0.6;

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${role} · ${AGENT_DESCRIPTORS[role]}`}
      className="absolute flex items-center justify-center rounded-full transition-all duration-300 hover:bg-umbris-violet/5 focus:outline-none focus:ring-1 focus:ring-umbris-violet/60"
      style={{
        width: nodeSize,
        height: nodeSize,
        left: cx - nodeSize / 2,
        top: cy - nodeSize / 2,
        border: "0.75px solid rgba(156, 123, 217, 0.6)",
        opacity,
        animation: isActive && deliberating
          ? "umbris-pulse-violet 1.6s ease-in-out infinite"
          : undefined,
      }}
      aria-label={`${role} agent · ${AGENT_DESCRIPTORS[role]}`}
    >
      <span className="text-umbris-violet">
        <Sigil size={Math.round(32 * scale)} strokeWidth={1.2} />
      </span>
    </button>
  );
}
