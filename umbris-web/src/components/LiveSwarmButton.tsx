"use client";

/**
 * LiveSwarmButton · the hero's primary CTA.
 *
 * Visual design intent · NOT a rectangle. A fully-rounded pill body
 * with a rotating eclipse glyph on the left and a transit arrow on
 * the right. Three concurrent animations make it read as a live
 * object on a quiet page:
 *
 *   1. The eclipse glyph's outer ring rotates clockwise; inner ring
 *      counter-rotates · a tiny celestial mechanic
 *   2. The eclipse disc pulses in brightness · the convocation breathing
 *   3. The pill body's corona glow softly grows + shrinks on a 6s loop
 *
 * On hover · a perspective-tilt lifts the whole button toward the
 * viewer with a real depth shadow, the arrow slides right, and the
 * border solidifies. Reads as a high-end 3D control surface rather
 * than a flat link.
 */

import Link from "next/link";

export function LiveSwarmButton() {
  return (
    <Link
      href="/convocation"
      aria-label="Live Swarm · the convocation's live feed"
      className="live-swarm-btn group relative inline-flex items-center gap-3 sm:gap-4 px-6 sm:px-8 py-3 sm:py-4 select-none no-underline"
    >
      {/* Rotating eclipse glyph · the signature element */}
      <span
        className="relative w-9 h-9 sm:w-10 sm:h-10 shrink-0"
        aria-hidden
      >
        {/* outer ring · rotates clockwise */}
        <span
          className="live-swarm-rotate absolute inset-0 rounded-full"
          style={{
            border: "1px solid rgba(255,178,89,0.65)",
            boxShadow: "0 0 10px rgba(255,178,89,0.35)",
          }}
        />
        {/* inner ring · counter-rotates */}
        <span
          className="live-swarm-counter-rotate absolute inset-1 rounded-full"
          style={{
            border: "1px solid rgba(156,123,217,0.55)",
            boxShadow: "0 0 6px rgba(156,123,217,0.25)",
          }}
        />
        {/* eclipse disc + corona flash · pulses brightness */}
        <span
          className="live-swarm-pulse absolute inset-2 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 65% 25%, rgba(255,232,180,1) 0%, rgba(255,178,89,0.55) 14%, transparent 28%), #000",
          }}
        />
      </span>

      {/* Label · the only word that stays */}
      <span
        className="umbris-display text-umbris-corona text-base sm:text-lg md:text-xl uppercase tracking-[0.34em] whitespace-nowrap"
        style={{ textShadow: "0 0 18px rgba(255,178,89,0.45)" }}
      >
        Live&nbsp;Swarm
      </span>

      {/* Transit arrow · slides right on hover */}
      <span
        className="umbris-mono text-umbris-corona text-lg sm:text-xl shrink-0 transition-transform duration-400 group-hover:translate-x-1.5"
        style={{ textShadow: "0 0 12px rgba(255,178,89,0.5)" }}
        aria-hidden
      >
        →
      </span>

      <style jsx>{`
        /* ─── The pill body itself ─────────────────────────────── */
        .live-swarm-btn {
          border-radius: 999px;
          background:
            linear-gradient(
              135deg,
              rgba(255, 178, 89, 0.09) 0%,
              rgba(0, 0, 0, 0.62) 50%,
              rgba(156, 123, 217, 0.07) 100%
            );
          border: 1.5px solid rgba(255, 178, 89, 0.7);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          transform: perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0);
          transform-style: preserve-3d;
          transition:
            transform 500ms cubic-bezier(0.22, 0.61, 0.36, 1),
            box-shadow 500ms cubic-bezier(0.22, 0.61, 0.36, 1),
            border-color 500ms ease;
          animation: live-swarm-breathe 6s ease-in-out infinite;
          will-change: transform, box-shadow;
        }
        .live-swarm-btn:hover {
          transform: perspective(900px) rotateX(-8deg) rotateY(2deg)
            translateY(-4px) scale(1.03);
          box-shadow:
            0 28px 64px rgba(255, 178, 89, 0.38),
            0 16px 32px rgba(0, 0, 0, 0.6),
            inset 0 0 36px rgba(255, 178, 89, 0.1);
          border-color: rgba(255, 178, 89, 1);
        }
        .live-swarm-btn:active {
          transform: perspective(900px) rotateX(-4deg) translateY(-1px) scale(1);
        }

        /* ─── The eclipse glyph layers ─────────────────────────── */
        .live-swarm-rotate {
          animation: live-swarm-rotate 18s linear infinite;
        }
        .live-swarm-counter-rotate {
          animation: live-swarm-rotate 26s linear infinite reverse;
        }
        .live-swarm-pulse {
          animation: live-swarm-pulse 3.5s ease-in-out infinite;
        }

        /* ─── Keyframes ────────────────────────────────────────── */
        @keyframes live-swarm-breathe {
          0%,
          100% {
            box-shadow:
              0 0 36px rgba(255, 178, 89, 0.25),
              0 10px 24px rgba(0, 0, 0, 0.55),
              inset 0 0 24px rgba(255, 178, 89, 0.05);
          }
          50% {
            box-shadow:
              0 0 60px rgba(255, 178, 89, 0.42),
              0 10px 24px rgba(0, 0, 0, 0.55),
              inset 0 0 36px rgba(255, 178, 89, 0.11);
          }
        }
        @keyframes live-swarm-rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes live-swarm-pulse {
          0%,
          100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.45);
          }
        }

        /* Respect users who prefer reduced motion · keep the glyph
           legible but stop the rotations + breathing. */
        @media (prefers-reduced-motion: reduce) {
          .live-swarm-btn,
          .live-swarm-rotate,
          .live-swarm-counter-rotate,
          .live-swarm-pulse {
            animation: none !important;
          }
        }
      `}</style>
    </Link>
  );
}
