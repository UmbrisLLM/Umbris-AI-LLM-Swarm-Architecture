/**
 * UMBRIS · planetary sigils.
 *
 * The seven classical planets + the celestial sphere + the umbra
 * itself. Rendered in fine 1px-stroke geometric SVG, currentColor.
 *
 * These ARE the canonical astrological/astronomical glyphs · the
 * same symbols carved into Renaissance grimoires, Brunonian wheels,
 * and modern ephemerides. UMBRIS uses them with intent.
 */

import type { AgentRole } from "./index";

interface SigilProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const baseProps = (size: number, className?: string, strokeWidth = 1.25) => ({
  width: size,
  height: size,
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
});

// ── ☿ MERCURIUS · the messenger ────────────────────────────────
// Crescent above a circled cross. The classical Mercury glyph.
export function SigilMercurius({ size = 32, strokeWidth = 1.25, className }: SigilProps) {
  return (
    <svg {...baseProps(size, className, strokeWidth)}>
      <circle cx="16" cy="14" r="4" />
      <path d="M16 18 L16 25" />
      <path d="M13 22 L19 22" />
      <path d="M12 8 A 4 4 0 0 0 20 8" />
    </svg>
  );
}

// ── ♀ VENUS · the gatherer ─────────────────────────────────────
export function SigilVenus({ size = 32, strokeWidth = 1.25, className }: SigilProps) {
  return (
    <svg {...baseProps(size, className, strokeWidth)}>
      <circle cx="16" cy="12" r="5" />
      <path d="M16 17 L16 26" />
      <path d="M12 23 L20 23" />
    </svg>
  );
}

// ── ♂ MARS · the challenger ────────────────────────────────────
export function SigilMars({ size = 32, strokeWidth = 1.25, className }: SigilProps) {
  return (
    <svg {...baseProps(size, className, strokeWidth)}>
      <circle cx="14" cy="18" r="5" />
      <path d="M17.5 14.5 L24 8" />
      <path d="M19 8 L24 8 L24 13" />
    </svg>
  );
}

// ── ☉ SOL · the central, the radiant ───────────────────────────
export function SigilSol({ size = 32, strokeWidth = 1.25, className }: SigilProps) {
  return (
    <svg {...baseProps(size, className, strokeWidth)}>
      <circle cx="16" cy="16" r="9" />
      <circle cx="16" cy="16" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── ♃ IUPPITER · the king ──────────────────────────────────────
export function SigilIuppiter({ size = 32, strokeWidth = 1.25, className }: SigilProps) {
  return (
    <svg {...baseProps(size, className, strokeWidth)}>
      <path d="M10 9 L10 23 Q 10 27 14 27 Q 18 27 18 23 Q 18 21 16 21 L 8 21" />
      <path d="M22 9 L22 25" />
    </svg>
  );
}

// ── ♄ SATURNUS · the elder, the falsifier ──────────────────────
export function SigilSaturnus({ size = 32, strokeWidth = 1.25, className }: SigilProps) {
  return (
    <svg {...baseProps(size, className, strokeWidth)}>
      <path d="M16 6 L16 24" />
      <path d="M11 9 L21 9" />
      <path d="M16 24 Q 22 24 22 19 Q 22 16 19 16 Q 16 16 16 19 L 16 24" />
    </svg>
  );
}

// ── ☽ LUNA · the reflective ────────────────────────────────────
export function SigilLuna({ size = 32, strokeWidth = 1.25, className }: SigilProps) {
  return (
    <svg {...baseProps(size, className, strokeWidth)}>
      <path d="M22 8 A 10 10 0 1 0 22 24 A 7 7 0 1 1 22 8" />
    </svg>
  );
}

// ── ✦ CAELUM · the doer, the celestial sphere ──────────────────
// A four-pointed star · the heavenly frame within which all motion occurs.
export function SigilCaelum({ size = 32, strokeWidth = 1.25, className }: SigilProps) {
  return (
    <svg {...baseProps(size, className, strokeWidth)}>
      <path d="M16 3 L19 13 L29 16 L19 19 L16 29 L13 19 L3 16 L13 13 Z" />
      <circle cx="16" cy="16" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── ⬤ UMBRA · the central shadow, the convergence ──────────────
// A filled circle ringed by a thin halo · the umbra of a total eclipse.
export function SigilUmbra({ size = 32, strokeWidth = 1.25, className }: SigilProps) {
  return (
    <svg {...baseProps(size, className, strokeWidth)}>
      <circle cx="16" cy="16" r="10" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="13" strokeOpacity="0.5" />
    </svg>
  );
}

// ── Lookup helpers ─────────────────────────────────────────────

export const SIGIL_COMPONENTS: Record<
  AgentRole,
  (props: SigilProps) => JSX.Element
> = {
  MERCURIUS: SigilMercurius,
  VENUS:     SigilVenus,
  MARS:      SigilMars,
  SOL:       SigilSol,
  IUPPITER:  SigilIuppiter,
  SATURNUS:  SigilSaturnus,
  LUNA:      SigilLuna,
  CAELUM:    SigilCaelum,
  UMBRA:     SigilUmbra,
};

export function Sigil({
  role,
  size = 32,
  strokeWidth = 1.25,
  className,
}: { role: AgentRole } & SigilProps) {
  const Cmp = SIGIL_COMPONENTS[role];
  return <Cmp size={size} strokeWidth={strokeWidth} className={className} />;
}

// ── Unicode reference (for plain-text contexts) ────────────────

export const SIGIL_UNICODE: Record<AgentRole, string> = {
  MERCURIUS: "☿",
  VENUS:     "♀",
  MARS:      "♂",
  SOL:       "☉",
  IUPPITER:  "♃",
  SATURNUS:  "♄",
  LUNA:      "☽",
  CAELUM:    "✦",
  UMBRA:     "⬤",
};
