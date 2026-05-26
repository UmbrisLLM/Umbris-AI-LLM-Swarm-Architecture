/**
 * UMBRIS · decorative chrome ornaments.
 *
 * Astrolabe-fragment corner ornaments and wordmark flourishes.
 * Renders as fine 1px-stroke SVG in currentColor. Cosmic register.
 */

interface ChromeProps {
  className?: string;
  size?: number;
}

// ── Astrolabe-fragment corner ornament ─────────────────────────
// Replaces OPUS's compass-sigil. Fragments of a celestial coordinate
// instrument · concentric arcs + cardinal pip markers + a fine cross.
export function AstrolabeOrnament({ size = 56, className }: ChromeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      stroke="currentColor"
      strokeWidth={0.8}
      className={className}
      aria-hidden
    >
      <circle cx="28" cy="28" r="22" opacity="0.55" />
      <circle cx="28" cy="28" r="16" opacity="0.40" strokeDasharray="2 2" />
      <circle cx="28" cy="28" r="9" opacity="0.30" />
      <path d="M28 4 L28 52" opacity="0.55" />
      <path d="M4 28 L52 28" opacity="0.55" />
      <path d="M11 11 L45 45" opacity="0.20" />
      <path d="M45 11 L11 45" opacity="0.20" />
      <circle cx="28" cy="28" r="2" fill="currentColor" stroke="none" />
      {/* Cardinal pip diamonds */}
      <path d="M28 6 L30 8 L28 10 L26 8 Z" fill="currentColor" stroke="none" />
      <path d="M28 46 L30 48 L28 50 L26 48 Z" fill="currentColor" stroke="none" />
      <path d="M6 28 L8 30 L10 28 L8 26 Z" fill="currentColor" stroke="none" />
      <path d="M46 28 L48 30 L50 28 L48 26 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── Wordmark flourish · LEFT side ──────────────────────────────
export function WordmarkFlourishLeft({ size = 140, className }: ChromeProps) {
  const h = Math.round(size * 0.34);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 140 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={0.75}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M2 24 L120 24" opacity="0.7" />
      <path d="M120 24 L132 18" opacity="0.7" />
      <path d="M120 24 L132 30" opacity="0.7" />
      <path d="M14 30 L106 30" opacity="0.3" />
      <path d="M14 18 L106 18" opacity="0.3" />
      {/* Mid-divider planetary marks (small filled circles instead of diamonds) */}
      <circle cx="50" cy="24" r="2.2" opacity="0.55" />
      <circle cx="86" cy="24" r="2.2" opacity="0.55" />
      <circle cx="3"  cy="24" r="2.2" opacity="0.85" />
    </svg>
  );
}

// ── Wordmark flourish · RIGHT side (mirror) ────────────────────
export function WordmarkFlourishRight({ size = 140, className }: ChromeProps) {
  const h = Math.round(size * 0.34);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 140 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={0.75}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M138 24 L20 24" opacity="0.7" />
      <path d="M20 24 L8 18" opacity="0.7" />
      <path d="M20 24 L8 30" opacity="0.7" />
      <path d="M126 30 L34 30" opacity="0.3" />
      <path d="M126 18 L34 18" opacity="0.3" />
      <circle cx="50"  cy="24" r="2.2" opacity="0.55" />
      <circle cx="86"  cy="24" r="2.2" opacity="0.55" />
      <circle cx="137" cy="24" r="2.2" opacity="0.85" />
    </svg>
  );
}

// ── Hairline divider with cosmic-violet diamond pip ────────────
export function HairlineDivider({
  width = 80,
  className,
  color = "var(--umbris-grey)",
  ornament = true,
}: {
  width?: number | string;
  className?: string;
  color?: string;
  ornament?: boolean;
}) {
  const w = typeof width === "number" ? `${width}px` : width;
  return (
    <div
      className={`flex items-center justify-center gap-3 select-none ${className ?? ""}`}
      aria-hidden
    >
      <span className="block h-px" style={{ width: w, backgroundColor: color }} />
      {ornament && (
        <span
          className="inline-block h-1.5 w-1.5 rotate-45"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="block h-px" style={{ width: w, backgroundColor: color }} />
    </div>
  );
}
