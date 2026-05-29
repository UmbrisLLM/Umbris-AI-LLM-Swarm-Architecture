"use client";

/**
 * V2Announcement · the marquee section announcing UMBRIS v2.0 ·
 * The Takeover Protocol.
 *
 * Sits below the live convocation feed CTA, before the manifesto.
 * Visual register: corona + violet duotone, the heavier "shipped"
 * energy rather than the live-feed pulse. Stays prominent until v3
 * arrives and bumps it.
 */

import Link from "next/link";
import { motion } from "framer-motion";

const FACULTIES = [
  {
    sigil: "☿",
    name: "Universal project recognition",
    blurb:
      "Python, TypeScript, Rust, Go · the convocation detects what it has been handed and adapts its scan, patcher and safety policy accordingly.",
  },
  {
    sigil: "♀",
    name: "Progressive trust",
    blurb:
      "The swarm starts in create-only mode and earns modify-rights by passing N consecutive verified cycles · safety scales with proven competence.",
  },
  {
    sigil: "♂",
    name: "Self-healing convocation",
    blurb:
      "When the daemon detects a thematic fixation loop or a parser-cap blowout, it breaks itself out · resets the blackboard and resamples the next move.",
  },
  {
    sigil: "☉",
    name: "Distributed reasoning",
    blurb:
      "Agents can be split across providers · Mercurii on Haiku for cheap scouting, Iuppiter on Opus for high-conviction judgment, Saturnus on a local Ollama for adversarial cost control.",
  },
  {
    sigil: "♃",
    name: "The Hermetic Takeover Protocol",
    blurb:
      "One CLI command · umbris takeover <repo-url> · clones, detects, configures the allowlist, sets cost caps, and starts the swarm. Documented in docs/v2-takeover-protocol.md.",
  },
] as const;

export function V2Announcement() {
  return (
    <section
      id="v2-takeover"
      className="relative w-full bg-umbris-void overflow-hidden"
      aria-label="UMBRIS v2.0 · The Takeover Protocol"
    >
      {/* corona + violet duotone glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 30%, rgba(255,178,89,0.10), transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(156,123,217,0.10), transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-[1180px] px-5 sm:px-6 md:px-8 py-24 sm:py-28 md:py-36">
        {/* Eyebrow · the version stamp */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.7 }}
          className="umbris-eyebrow text-umbris-corona text-center mb-6 tracking-[0.32em]"
          style={{ textShadow: "0 0 12px rgba(255,178,89,0.4)" }}
        >
          — § V2.0 · THE TAKEOVER PROTOCOL · ACTIVE —
        </motion.p>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.9, delay: 0.05 }}
          className="umbris-display text-umbris-lunar text-center text-[clamp(2.3rem,7vw,5rem)] leading-[0.95] mb-8"
          style={{
            textShadow:
              "0 0 40px rgba(255,178,89,0.18), 0 0 120px rgba(156,123,217,0.10)",
          }}
        >
          UMBRIS V2.0 HAS SHIPPED
        </motion.h2>

        {/* Lead paragraph */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.0, delay: 0.2 }}
          className="umbris-serif italic text-umbris-stellar text-center text-base sm:text-lg md:text-xl leading-snug max-w-3xl mx-auto mb-14 md:mb-20"
        >
          The convocation now claims the right to take over any Claude Code or
          Codex project. Hand it a repository · walk away · come back to a
          finished project. The architect can be entirely absent for the
          duration.
        </motion.p>

        {/* The three-step verb */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 max-w-3xl mx-auto mb-16 md:mb-20"
        >
          {[
            { glyph: "◐", verb: "HAND IT A REPO" },
            { glyph: "◑", verb: "WALK AWAY" },
            { glyph: "◯", verb: "RETURN TO A FINISHED PROJECT" },
          ].map((s, i) => (
            <motion.div
              key={s.verb}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
              className="border border-umbris-corona/30 bg-umbris-void/60 px-5 py-6 text-center"
            >
              <p
                className="text-umbris-corona text-3xl sm:text-4xl mb-3"
                style={{ textShadow: "0 0 18px rgba(255,178,89,0.45)" }}
                aria-hidden
              >
                {s.glyph}
              </p>
              <p className="umbris-mono text-umbris-corona text-[10px] sm:text-[11px] uppercase tracking-[0.18em]">
                {s.verb}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* The five new faculties */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="umbris-eyebrow text-umbris-violet text-center mb-10"
        >
          — § THE FIVE NEW FACULTIES —
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-5xl mx-auto mb-16">
          {FACULTIES.map((f, i) => (
            <motion.article
              key={f.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.7, delay: Math.min(i * 0.07, 0.45) }}
              className="relative border border-umbris-grey/40 bg-umbris-void/60 backdrop-blur-[1px] p-5 sm:p-6 hover:border-umbris-violet/60 transition-colors"
            >
              <div className="flex items-start gap-4">
                <span
                  className="umbris-display text-umbris-violet text-3xl leading-none shrink-0 select-none"
                  style={{
                    textShadow: "0 0 14px rgba(156,123,217,0.45)",
                  }}
                  aria-hidden
                >
                  {f.sigil}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="umbris-display text-umbris-lunar text-base md:text-lg leading-tight mb-2">
                    {f.name}
                  </h3>
                  <p className="umbris-serif text-umbris-stellar text-sm md:text-[15px] leading-relaxed">
                    {f.blurb}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mb-10"
        >
          <a
            href="https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture#install"
            target="_blank"
            rel="noreferrer"
            className="umbris-mono text-umbris-corona text-[11px] uppercase tracking-widest border-2 border-umbris-corona/70 px-6 py-3 hover:bg-umbris-corona hover:text-umbris-void transition-colors"
            style={{ boxShadow: "0 0 24px rgba(255,178,89,0.20)" }}
          >
            Install · pip install umbris-core →
          </a>
          <a
            href="https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture/blob/main/docs/v2-takeover-protocol.md"
            target="_blank"
            rel="noreferrer"
            className="umbris-mono text-umbris-violet text-[11px] uppercase tracking-widest border border-umbris-violet/60 px-6 py-3 hover:bg-umbris-violet hover:text-umbris-void transition-colors"
          >
            Read the takeover protocol →
          </a>
          <Link
            href="/convocation"
            className="umbris-mono text-umbris-stellar text-[11px] uppercase tracking-widest border border-umbris-grey/50 px-6 py-3 hover:border-umbris-lunar hover:text-umbris-lunar transition-colors"
          >
            Watch the swarm now →
          </Link>
        </motion.div>

        {/* Closing line */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="umbris-mono text-umbris-grey text-[10px] uppercase tracking-widest text-center"
        >
          · v2.0 is now live · the convocation has signed it ·
        </motion.p>
      </div>
    </section>
  );
}
