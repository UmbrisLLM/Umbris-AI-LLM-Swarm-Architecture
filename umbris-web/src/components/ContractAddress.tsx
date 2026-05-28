"use client";

/**
 * ContractAddress · click-to-copy display of the $UMBRIS Solana mint.
 *
 * Sits below the hero subtitle. Restrained, violet-accented, with a
 * notched octagon frame matching the CastingInput aesthetic. On click,
 * copies the full address to the clipboard and briefly flashes a
 * "copied" state.
 */

import { useCallback, useState } from "react";

const CA = "FipspcMqyE23x3ZGeJ85L5YtYQgXgdRJDLSKRMC1pump";

// Cut corners · matches the rest of the brand's instrument aesthetic.
const CLIP =
  "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)";

export function ContractAddress() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CA);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // browsers without clipboard API · the select-all class still works
    }
  }, []);

  return (
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy contract address · ${CA}`}
        title={CA}
        className="group relative inline-flex items-center"
      >
        {/* hairline */}
        <span
          aria-hidden
          className="absolute inset-0 bg-umbris-violet/60 group-hover:bg-umbris-violet/90 transition-colors"
          style={{ clipPath: CLIP }}
        />
        {/* void fill */}
        <span
          aria-hidden
          className="absolute inset-px bg-umbris-void"
          style={{ clipPath: CLIP }}
        />

        <span className="relative z-10 inline-flex items-center gap-2.5 px-3 py-1.5">
          <span className="umbris-mono text-umbris-grey text-[0.5rem] uppercase tracking-[0.18em]">
            CA
          </span>
          <span aria-hidden className="h-2.5 w-px bg-umbris-violet/50" />
          <span className="umbris-mono text-umbris-lunar text-[0.62rem] tracking-wider select-all">
            <span className="sm:hidden">
              {CA.slice(0, 6)}…{CA.slice(-6)}
            </span>
            <span className="hidden sm:inline">{CA}</span>
          </span>
          <span aria-hidden className="h-2.5 w-px bg-umbris-violet/50" />
          <span
            className={`umbris-mono text-[0.5rem] uppercase tracking-[0.18em] min-w-[2.5rem] text-right transition-colors ${
              copied ? "text-umbris-corona" : "text-umbris-violet"
            }`}
          >
            {copied ? "copied ✓" : "copy"}
          </span>
        </span>
      </button>
    </div>
  );
}
