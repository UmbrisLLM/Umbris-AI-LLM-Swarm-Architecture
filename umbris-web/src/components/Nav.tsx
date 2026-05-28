"use client";

/**
 * Nav · the top navigation bar.
 *
 * Design intent · the Convocation is the centre of gravity for UMBRIS,
 * so it gets the standout button in the bar. Everything else lives in
 * a slide-out drawer behind a hamburger so the top bar stays calm and
 * the live-feed CTA always wins the eye. Fully mobile-responsive.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ContractAddress } from "./ContractAddress";

// Secondary pages · live in the slide-out drawer so the top bar stays
// minimal and the Convocation CTA dominates.
const DRAWER_ITEMS = [
  { label: "Manifesto",       href: "/manifesto",       blurb: "the doctrine" },
  { label: "Compositione",    href: "/compositione",    blurb: "the architecture" },
  { label: "Triplici Minimo", href: "/triplici-minimo", blurb: "the epiphany" },
  { label: "Now",             href: "/now",             blurb: "the latest verdicts" },
] as const;

export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-close the drawer on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open.
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Esc closes the drawer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
          scrolled ? "bg-umbris-void/90 backdrop-blur-md border-b border-umbris-grey/15" : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-3.5 md:py-5">
          {/* Wordmark */}
          <Link
            href="/"
            className="umbris-display text-umbris-lunar text-xs sm:text-sm tracking-widest flex-shrink-0"
            aria-label="UMBRIS · home"
          >
            UMBRIS
          </Link>

          {/* Centre · the standout CONVOCATION button. Eats the eye. */}
          <div className="flex-1 flex justify-center min-w-0">
            <ConvocationCta active={pathname === "/convocation"} />
          </div>

          {/* Right · CA + GitHub + hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <ContractAddress />
            <a
              href="https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture"
              target="_blank"
              rel="noreferrer"
              aria-label="UMBRIS on GitHub"
              className="hidden md:inline-flex items-center umbris-mono text-[11px] uppercase tracking-widest text-umbris-violet border border-umbris-violet/60 px-3 py-1.5 hover:bg-umbris-violet hover:text-umbris-void transition-colors"
            >
              GitHub
            </a>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((p) => !p)}
              className="relative w-9 h-9 sm:w-10 sm:h-10 flex flex-col items-center justify-center gap-1.5 border border-umbris-grey/40 hover:border-umbris-lunar/60 transition-colors"
            >
              <span
                className={`block w-4 h-px bg-umbris-lunar transition-all duration-300 ${
                  open ? "translate-y-[3px] rotate-45" : ""
                }`}
                aria-hidden
              />
              <span
                className={`block w-4 h-px bg-umbris-lunar transition-all duration-300 ${
                  open ? "-translate-y-[3px] -rotate-45" : ""
                }`}
                aria-hidden
              />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Slide-out drawer · holds the secondary pages ────────── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-umbris-void/85 backdrop-blur-md"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.aside
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 32 }}
              transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
              className="fixed top-0 right-0 z-50 h-full w-full sm:max-w-[440px] bg-umbris-void border-l border-umbris-violet/30 overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
            >
              <div className="px-7 sm:px-10 py-24 sm:py-28">
                <p className="umbris-eyebrow text-umbris-violet text-[10px] mb-8">
                  · the scrolls ·
                </p>
                <ul className="space-y-7">
                  {DRAWER_ITEMS.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="group block"
                        >
                          <span
                            className={`umbris-display block text-2xl sm:text-3xl tracking-widest transition-colors ${
                              active
                                ? "text-umbris-violet"
                                : "text-umbris-lunar group-hover:text-umbris-violet"
                            }`}
                          >
                            {item.label}
                          </span>
                          <span className="umbris-serif italic block text-umbris-stellar text-sm mt-1">
                            · {item.blurb}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-12 pt-7 border-t border-umbris-grey/25 space-y-4">
                  <Link
                    href="/convocation"
                    className="inline-flex items-center gap-2 umbris-mono text-umbris-corona text-[11px] uppercase tracking-widest hover:text-umbris-lunar transition-colors"
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full bg-umbris-corona animate-umbris-heartbeat"
                      aria-hidden
                    />
                    the nine speak · live feed →
                  </Link>
                  <a
                    href="https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture"
                    target="_blank"
                    rel="noreferrer"
                    className="block umbris-mono text-umbris-violet text-[11px] uppercase tracking-widest hover:text-umbris-lunar transition-colors"
                  >
                    open source on github →
                  </a>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────
// The standout Convocation CTA · corona-tinted, breathing dot, glow.
// Sits dead-centre of the nav, the eye lands on it first.
// ──────────────────────────────────────────────────────────────────

function ConvocationCta({ active }: { active: boolean }) {
  return (
    <Link
      href="/convocation"
      aria-current={active ? "page" : undefined}
      aria-label="The Convocation · live feed"
      className={`group relative inline-flex items-center gap-2 sm:gap-2.5 md:gap-3 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 border ${
        active
          ? "border-umbris-corona bg-umbris-corona/[0.10]"
          : "border-umbris-corona/60 bg-umbris-void/40 hover:bg-umbris-corona/[0.10] hover:border-umbris-corona"
      } transition-colors max-w-full whitespace-nowrap`}
      style={{
        boxShadow: active
          ? "0 0 24px rgba(255,178,89,0.30)"
          : "0 0 18px rgba(255,178,89,0.18)",
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full bg-umbris-corona animate-umbris-heartbeat flex-shrink-0"
        aria-hidden
      />
      <span className="umbris-mono text-umbris-corona text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-[0.18em] truncate">
        <span className="hidden sm:inline">the nine speak · </span>live
      </span>
      <span
        className="hidden md:inline-block umbris-mono text-umbris-corona/70 text-[10px] uppercase tracking-widest flex-shrink-0"
        aria-hidden
      >
        →
      </span>
    </Link>
  );
}
