/**
 * @umbris/design · the single source of truth for the UMBRIS brand.
 *
 *   import "@umbris/design/tokens.css";
 *   import "@umbris/design/utilities.css";
 *   import { umbrisFonts } from "@umbris/design/fonts";
 *   import { umbrisTheme } from "@umbris/design/tailwind";
 *
 *   export default function RootLayout({ children }) {
 *     return (
 *       <html lang="en" className={umbrisFonts}>
 *         <body className="bg-umbris-void text-umbris-lunar">{children}</body>
 *       </html>
 *     );
 *   }
 */

export { albertus, ebGaramond, berkeleyMono, umbrisFonts } from "./fonts";
export { umbrisTheme } from "./tailwind";

// ─── Agent role types ────────────────────────────────────────────

/**
 * The nine planetary agents of the UMBRIS convocation.
 * Order matches placement on the Sphere of Shadows orbit ring
 * (0° = top, clockwise · UMBRA holds the centre, not the orbit).
 */
export const AGENT_ROLES = [
  "MERCURIUS",   // ☿ · the messenger, the swift
  "VENUS",       // ♀ · the gatherer of harmony
  "MARS",        // ♂ · the challenger
  "SOL",         // ☉ · the central, the radiant
  "IUPPITER",    // ♃ · the king, the discerner
  "SATURNUS",    // ♄ · the elder, the falsifier
  "LUNA",        // ☽ · the reflective, the path-mapper
  "CAELUM",      // ✦ · the doer in the celestial frame
  "UMBRA",       // ⬤ · the convergence-point, the central shadow
] as const;

export type AgentRole = (typeof AGENT_ROLES)[number];

/**
 * One-line role descriptor for each agent, in the UMBRIS register.
 */
export const AGENT_DESCRIPTORS: Record<AgentRole, string> = {
  MERCURIUS: "the messenger, the swift",
  VENUS:     "the gatherer of harmony",
  MARS:      "the challenger",
  SOL:       "the central, the radiant",
  IUPPITER:  "the king, the discerner",
  SATURNUS:  "the elder, the falsifier",
  LUNA:      "the reflective, the path-mapper",
  CAELUM:    "the doer in the celestial frame",
  UMBRA:     "the convergence of all shadows",
};

/**
 * Map UMBRIS agent role to the equivalent OPUS role, for cross-brand
 * code reuse (umbris-core can largely share opus-core's Hive class
 * if the role names are normalised at the boundary).
 */
export const UMBRIS_TO_OPUS_ROLE: Record<AgentRole, string> = {
  MERCURIUS: "SCOUT",
  VENUS:     "RESEARCHER",
  MARS:      "CRITIC",
  SOL:       "SYNTHESISER",
  IUPPITER:  "JUDGE",
  SATURNUS:  "VERIFIER",
  LUNA:      "PLANNER",
  CAELUM:    "EXECUTOR",
  UMBRA:     "HIVE",
};

/**
 * Eight planetary agents on the orbit ring (UMBRA is at the centre,
 * not on the orbit). 0° = top, clockwise.
 */
export const ORB_AGENT_ORDER: readonly AgentRole[] = [
  "MERCURIUS",
  "VENUS",
  "MARS",
  "SOL",
  "IUPPITER",
  "SATURNUS",
  "LUNA",
  "CAELUM",
] as const;
