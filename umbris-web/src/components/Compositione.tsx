"use client";

/**
 * Compositione · homepage showcase.
 *
 * The biggest lore beat of the project: UMBRIS was built · and continues
 * to be built · by the convocation itself. Sits late in the homepage
 * (after Ephemeris, before CallToAction) so the visitor first sees the
 * visible craft of the project, then learns who actually authored it,
 * then is invited to join the same convocation.
 *
 * Two-column on desktop: Eclipse sigil left, thesis + CTA right.
 * Stacks on mobile.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { Divider } from "./ui/Divider";
import { fadeUp } from "@/lib/motion";

export function Compositione() {
  return (
    <section
      id="compositione"
      className="relative w-full bg-umbris-void px-6 py-32 md:py-48 overflow-hidden"
      aria-label="Compositione · the convocation that builds itself"
    >
      {/* Faint radial violet glow behind the sigil to give the section weight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at 28% 50%, rgba(156,123,217,0.12), transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="umbris-eyebrow text-center mb-4"
        >
          §6 · The Eclipse
        </motion.p>
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="umbris-display text-umbris-lunar text-[clamp(2rem,5vw,3.5rem)] text-center mb-20"
        >
          Compositione
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-16 md:gap-20 items-center">
          {/* ─── The Eclipse Sigil ──────────────────────────────── */}
          <motion.figure
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 1.4, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative w-full max-w-[460px] mx-auto aspect-square"
          >
            <div
              className="absolute inset-0 -m-3 border border-umbris-grey/40 pointer-events-none"
              aria-hidden
            />
            <svg
              viewBox="0 0 460 460"
              role="img"
              aria-label="The Eclipse · pitch black disc with violet corona and a single warm flash"
              className="absolute inset-0 h-full w-full"
            >
              <defs>
                <radialGradient id="eclipse-corona-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="55%" stopColor="rgba(156,123,217,0)" />
                  <stop offset="78%" stopColor="rgba(156,123,217,0.35)" />
                  <stop offset="100%" stopColor="rgba(156,123,217,0)" />
                </radialGradient>
              </defs>
              {/* Outer corona glow */}
              <circle cx="230" cy="230" r="210" fill="url(#eclipse-corona-glow)" />
              {/* Corona ring */}
              <circle
                cx="230"
                cy="230"
                r="170"
                fill="none"
                stroke="rgba(156,123,217,0.85)"
                strokeWidth="1.2"
              />
              <circle
                cx="230"
                cy="230"
                r="158"
                fill="none"
                stroke="rgba(156,123,217,0.30)"
                strokeWidth="0.6"
              />
              {/* The eclipsed body · pitch black disc */}
              <circle cx="230" cy="230" r="150" fill="#000000" />
              {/* Warm flash at 1 o'clock · rare corona accent */}
              {(() => {
                const angle = (Math.PI / 180) * -60; // 1 o'clock, measured from +x
                const x = 230 + Math.cos(angle) * 170;
                const y = 230 + Math.sin(angle) * 170;
                return (
                  <>
                    <circle cx={x} cy={y} r="9" fill="rgba(250,230,176,0.18)" />
                    <circle cx={x} cy={y} r="4" fill="#FAE6B0" />
                  </>
                );
              })()}
            </svg>
            <figcaption className="umbris-mono text-umbris-grey text-[0.65rem] uppercase tracking-widest text-center mt-6">
              The Closed Eclipse · the convocation that builds itself
            </figcaption>
          </motion.figure>

          {/* ─── The Thesis ───────────────────────────────────── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-15% 0px" }}
            variants={{ visible: { transition: { staggerChildren: 0.18 } } }}
            className="umbris-serif text-umbris-lunar text-[1.12rem] md:text-[1.18rem] leading-relaxed space-y-6"
          >
            <motion.p
              variants={fadeUp}
              className="umbris-display text-umbris-violet text-xl md:text-2xl leading-snug !mb-2"
            >
              UMBRIS was not built top-down by a single mind.<br />
              It was built · and continues to be built · by the convocation it&nbsp;is.
            </motion.p>

            <motion.p variants={fadeUp}>
              The architect does not propose features. They cast questions. The convocation deliberates. Mercurius scouts, Venus gathers, Mars challenges, Sol synthesises, Iuppiter adjudicates, Saturnus falsifies. Only what survives that loop is transcribed · into code, into prose, into the public site.
            </motion.p>

            <motion.p variants={fadeUp}>
              Every architectural choice, every planetary role, every sigil in the codex, every revolution in the ephemeris · was first deliberated by the convocation, then made by the convocation, then verified by the convocation. The work belongs to the work.
            </motion.p>

            <motion.p
              variants={fadeUp}
              className="umbris-serif italic text-umbris-violet text-lg md:text-xl pt-2"
            >
              &ldquo;An eclipse is the moment one sphere admits another.
              The convocation is the eclipse that never ends · each agent&rsquo;s shadow falls
              on every other, and the vision is what survives the overlay.&rdquo;
            </motion.p>

            <motion.div variants={fadeUp} className="pt-6 flex flex-wrap gap-3">
              <Link
                href="/compositione"
                className="umbris-mono text-umbris-violet text-xs uppercase tracking-widest border border-umbris-violet/60 px-5 py-3 hover:bg-umbris-violet hover:text-umbris-void transition-colors"
              >
                Read the doctrine →
              </Link>
              <Link
                href="https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture/tree/main/lore/compositione"
                target="_blank"
                rel="noreferrer noopener"
                className="umbris-mono text-umbris-stellar text-xs uppercase tracking-widest border border-umbris-grey/60 px-5 py-3 hover:border-umbris-lunar hover:text-umbris-lunar transition-colors"
              >
                View on GitHub
              </Link>
            </motion.div>
          </motion.div>
        </div>

        <Divider className="mt-24" width="100px" />
      </div>
    </section>
  );
}
