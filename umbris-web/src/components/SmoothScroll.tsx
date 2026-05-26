"use client";

/**
 * SmoothScroll · wraps the page in Lenis smooth-scroll.
 *
 * Lenis is the standard premium-site smooth-scroll library (used by
 * Vercel, Linear, Stripe). It hijacks the native wheel/touchpad scroll
 * and interpolates it for cinematic feel. Plays nicely with Framer
 * Motion's useScroll because Lenis updates window.scrollY.
 *
 * Mount once at the top of the page. Returns null · pure side effect.
 */

import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    let lenisInstance: { raf: (t: number) => void; destroy: () => void } | null = null;
    let rafId = 0;
    let cancelled = false;

    (async () => {
      try {
        const LenisCtor = (await import("lenis")).default;
        if (cancelled) return;
        lenisInstance = new LenisCtor({
          duration: 1.15,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          touchMultiplier: 1.4,
        }) as unknown as { raf: (t: number) => void; destroy: () => void };

        const raf = (time: number) => {
          lenisInstance?.raf(time);
          rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);
      } catch {
        // Fail silently if Lenis can't load · native scroll still works.
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      lenisInstance?.destroy();
    };
  }, []);

  return null;
}
