"use client";

/**
 * ContractAddress · the $UMBRIS Solana mint, behind a button in the nav.
 *
 * Default state · a small `$UMBRIS · CA ›` chip in the top navigation.
 * On click · a notched octagon panel drops beneath it showing the full
 * address with a copy button. Click outside or press Escape to close.
 *
 * Mounted from Nav.tsx so it sits at the top of every page without
 * ever cluttering the hero.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const CA = "FipspcMqyE23x3ZGeJ85L5YtYQgXgdRJDLSKRMC1pump";

const CLIP =
  "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)";

export function ContractAddress() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CA);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // browsers without clipboard API · the select-all class still works
    }
  }, []);

  // Close on click-outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger · always visible in the nav */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Reveal contract address"
        className={`umbris-mono text-[11px] uppercase tracking-widest border px-3 py-1.5 transition-colors ${
          open
            ? "border-umbris-violet bg-umbris-violet text-umbris-void"
            : "border-umbris-violet/60 text-umbris-violet hover:bg-umbris-violet hover:text-umbris-void"
        }`}
      >
        $UMBRIS · CA <span aria-hidden>{open ? "▾" : "›"}</span>
      </button>

      {/* Dropdown panel · only mounted when open */}
      {open && (
        <div className="absolute right-0 mt-3 z-[60]" style={{ minWidth: 360 }}>
          {/* hairline */}
          <div
            aria-hidden
            className="absolute inset-0 bg-umbris-violet"
            style={{ clipPath: CLIP }}
          />
          {/* void fill */}
          <div
            aria-hidden
            className="absolute inset-px bg-umbris-void"
            style={{ clipPath: CLIP }}
          />

          <div className="relative z-10 px-5 py-4 space-y-3">
            <p className="umbris-eyebrow text-umbris-violet text-[9px] tracking-[0.2em]">
              — $UMBRIS · SOLANA MINT —
            </p>

            <p className="umbris-mono text-umbris-lunar text-[11px] break-all select-all leading-relaxed">
              {CA}
            </p>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleCopy}
                className={`umbris-mono text-[10px] uppercase tracking-widest border px-3 py-1.5 transition-colors ${
                  copied
                    ? "border-umbris-corona text-umbris-corona"
                    : "border-umbris-violet/60 text-umbris-violet hover:bg-umbris-violet hover:text-umbris-void"
                }`}
              >
                {copied ? "copied ✓" : "copy address"}
              </button>
              <a
                href={`https://pump.fun/coin/${CA}`}
                target="_blank"
                rel="noreferrer"
                className="umbris-mono text-[10px] uppercase tracking-widest text-umbris-stellar hover:text-umbris-lunar transition-colors"
              >
                view on pump.fun →
              </a>
            </div>

            <p className="umbris-mono text-umbris-grey text-[9px] uppercase tracking-widest pt-1 border-t border-umbris-grey/30">
              the token funds the convocation · creator royalties feed a public treasury
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
