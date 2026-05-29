"use client";

/**
 * V2ActiveBadge · the "V2.0 · TAKEOVER PROTOCOL ACTIVE" pill that sits
 * above the status bar on the /convocation page so visitors instantly
 * know the swarm is running the v2 doctrine, not v1.
 */

import { motion } from "framer-motion";
import Link from "next/link";

export function V2ActiveBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.1 }}
      className="mb-6 flex justify-center"
    >
      <Link
        href="/#v2-takeover"
        className="group relative inline-flex items-center gap-3 border border-umbris-corona/60 bg-umbris-void/70 px-4 py-2 hover:bg-umbris-corona/[0.08] transition-colors"
        style={{
          boxShadow:
            "0 0 24px rgba(255,178,89,0.22), inset 0 0 12px rgba(255,178,89,0.04)",
        }}
        aria-label="UMBRIS v2.0 · the takeover protocol is active"
      >
        {/* Two animated dots · indicates "two systems live at once" */}
        <span className="flex items-center gap-1.5" aria-hidden>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-umbris-corona animate-umbris-heartbeat" />
          <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-umbris-violet animate-umbris-heartbeat"
            style={{ animationDelay: "0.6s" }}
          />
        </span>
        <span className="umbris-mono text-umbris-corona text-[10px] sm:text-[11px] uppercase tracking-[0.22em]">
          v2.0 · the takeover protocol · active
        </span>
        <span
          className="hidden sm:inline-block umbris-mono text-umbris-corona/70 text-[10px] tracking-widest transition-transform group-hover:translate-x-1"
          aria-hidden
        >
          →
        </span>
      </Link>
    </motion.div>
  );
}
