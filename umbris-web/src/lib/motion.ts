/**
 * Motion presets for UMBRIS.
 *
 * Two systems coexist:
 *  - Framer Motion for component-level reveals (variants below)
 *  - GSAP + ScrollTrigger for cinematic scroll choreography (registered lazily)
 */

import type { Variants } from "framer-motion";

// ──────────────────────────────────────────────────────────────────
// Framer presets
// ──────────────────────────────────────────────────────────────────

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 0.61, 0.36, 1] },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1.2, ease: "easeOut" } },
};

export const stagger = (delayChildren = 0.05, staggerChildren = 0.08): Variants => ({
  hidden: {},
  visible: { transition: { delayChildren, staggerChildren } },
});

export const letterStagger: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.22, 0.61, 0.36, 1] },
  },
};

// ──────────────────────────────────────────────────────────────────
// GSAP · registered lazily so it stays out of the SSR bundle.
// ──────────────────────────────────────────────────────────────────

let gsapRegistered = false;

export async function registerGsap() {
  if (gsapRegistered || typeof window === "undefined") return;
  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  gsap.registerPlugin(ScrollTrigger);
  gsapRegistered = true;
  return { gsap, ScrollTrigger };
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
