/**
 * UMBRIS · left-rail navigation icons.
 *
 * Custom 1px-stroke cosmic-themed glyphs, 24×24 viewBox, currentColor.
 * The icon set mirrors OPUS's rail in function but takes a cosmic
 * rather than alchemical register.
 */

interface RailIconProps {
  size?: number;
  className?: string;
}

const base = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.1,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
});

// ── HUB · the eclipse sigil ────────────────────────────────────
export function IconHub({ size = 22, className }: RailIconProps) {
  return (
    <svg {...base(size, className)} aria-hidden>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── CONNECTIONS · celestial coordinates / star map ─────────────
export function IconConnections({ size = 22, className }: RailIconProps) {
  return (
    <svg {...base(size, className)} aria-hidden>
      <circle cx="6"  cy="7"  r="2" />
      <circle cx="18" cy="7"  r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M7.5 8.5 L10.5 16.5" opacity="0.7" />
      <path d="M16.5 8.5 L13.5 16.5" opacity="0.7" />
      <path d="M8 7 L16 7" opacity="0.4" />
    </svg>
  );
}

// ── DOCS · open codex ──────────────────────────────────────────
export function IconDocs({ size = 22, className }: RailIconProps) {
  return (
    <svg {...base(size, className)} aria-hidden>
      <path d="M5 3 L17 3 L19 5 L19 21 L5 21 Z" />
      <path d="M17 3 L17 5 L19 5" />
      <path d="M8 9 L16 9" opacity="0.55" />
      <path d="M8 13 L16 13" opacity="0.55" />
      <path d="M8 17 L13 17" opacity="0.55" />
    </svg>
  );
}

// ── REVOLUTIONS · ordered timeline of past convocations ────────
export function IconRevolutions({ size = 22, className }: RailIconProps) {
  return (
    <svg {...base(size, className)} aria-hidden>
      <path d="M4 6 L20 6" />
      <path d="M4 12 L20 12" />
      <path d="M4 18 L20 18" />
      <circle cx="2.5" cy="6"  r="0.8" fill="currentColor" stroke="none" />
      <circle cx="2.5" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="2.5" cy="18" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── DATA · the wet clay / the substrate ────────────────────────
export function IconData({ size = 22, className }: RailIconProps) {
  return (
    <svg {...base(size, className)} aria-hidden>
      <ellipse cx="12" cy="6" rx="7" ry="2.5" />
      <path d="M5 6 L5 12" />
      <path d="M19 6 L19 12" />
      <ellipse cx="12" cy="12" rx="7" ry="2.5" />
      <path d="M5 12 L5 18" />
      <path d="M19 12 L19 18" />
      <ellipse cx="12" cy="18" rx="7" ry="2.5" />
    </svg>
  );
}

// ── METRICS · ascending wave (the same wave OPUS uses) ─────────
export function IconMetrics({ size = 22, className }: RailIconProps) {
  return (
    <svg {...base(size, className)} aria-hidden>
      <path d="M3 17 C 7 17, 8 8, 12 8 S 17 17, 21 17" />
      <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── SETTINGS · radial gear that subtly evokes a planetary wheel ─
export function IconSettings({ size = 22, className }: RailIconProps) {
  return (
    <svg {...base(size, className)} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3 L12 5" />
      <path d="M12 19 L12 21" />
      <path d="M3 12 L5 12" />
      <path d="M19 12 L21 12" />
      <path d="M5.6 5.6 L7 7" />
      <path d="M17 17 L18.4 18.4" />
      <path d="M5.6 18.4 L7 17" />
      <path d="M17 7 L18.4 5.6" />
    </svg>
  );
}

// ── ACCOUNT · keeper of the stylus ──────────────────────────────
export function IconAccount({ size = 22, className }: RailIconProps) {
  return (
    <svg {...base(size, className)} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M5 19 C 7 16, 17 16, 19 19" />
    </svg>
  );
}
