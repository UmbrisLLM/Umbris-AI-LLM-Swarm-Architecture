/**
 * UMBRIS · shared Tailwind theme extension.
 *
 *     import { umbrisTheme } from "@umbris/design/tailwind";
 *
 *     export default {
 *       content: [...],
 *       theme: { extend: umbrisTheme },
 *     } satisfies Config;
 */

export const umbrisTheme = {
  colors: {
    "umbris-void":     "#000000",
    "umbris-lunar":    "#DCDEE7",
    "umbris-stellar":  "#8B90A3",
    "umbris-grey":     "#4A4D5C",
    "umbris-violet":   "#9C7BD9",
    "umbris-corona":   "#FAE6B0",
    "umbris-error":    "#B85C5C",
  },
  fontFamily: {
    display: ["var(--font-albertus)", "Albertus", "Trajan Pro", "serif"],
    serif:   ["var(--font-eb-garamond)", "EB Garamond", "Garamond", "Georgia", "serif"],
    mono:    ["var(--font-berkeley-mono)", "Berkeley Mono", "JetBrains Mono", "ui-monospace", "monospace"],
    sans:    ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui"],
  },
  letterSpacing: {
    wide:   "0.05em",
    wider:  "0.08em",
    widest: "0.18em",
    ritual: "0.25em",
  },
  spacing: {
    "umbris-xs":  "4px",
    "umbris-sm":  "8px",
    "umbris-md":  "12px",
    "umbris-lg":  "20px",
    "umbris-xl":  "32px",
    "umbris-xxl": "48px",
  },
  animation: {
    "umbris-heartbeat":  "umbris-heartbeat 1.2s ease-in-out infinite",
    "umbris-breathe":    "umbris-breathe 2s ease-in-out infinite",
    "umbris-orbit":      "umbris-orbit 60s linear infinite",
    "umbris-orbit-slow": "umbris-orbit-slow 90s linear infinite",
    "umbris-flare":      "umbris-flare 800ms ease-out forwards",
  },
  keyframes: {
    "umbris-heartbeat": {
      "0%, 100%": { opacity: "0.45", transform: "scale(1)" },
      "50%":      { opacity: "1.00", transform: "scale(1.06)" },
    },
    "umbris-breathe": {
      "0%, 100%": { opacity: "0.40" },
      "50%":      { opacity: "1.00" },
    },
    "umbris-orbit": {
      "0%":   { transform: "rotate(0deg)" },
      "100%": { transform: "rotate(360deg)" },
    },
    "umbris-orbit-slow": {
      "0%":   { transform: "rotate(0deg)" },
      "100%": { transform: "rotate(-360deg)" },
    },
    "umbris-flare": {
      "0%":   { textShadow: "0 0 0 rgba(156,123,217,0)" },
      "40%":  { textShadow: "0 0 24px rgba(156,123,217,0.55)" },
      "100%": { textShadow: "0 0 12px rgba(156,123,217,0.22)" },
    },
  },
};
