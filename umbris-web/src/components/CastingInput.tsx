"use client";

/**
 * CastingInput · the convocation's question-altar.
 *
 * Replaces the generic rectangular <input> in §4 Live Convocation
 * with a uniquely UMBRIS-branded affordance. The frame is an
 * irregular octagon · two notched corners on the top-left and the
 * bottom-right · with a thin violet hairline that brightens on
 * focus. Four corner ticks anchor the frame so it reads as an
 * instrument, not a form field. The submit affordance is a small
 * Eclipse glyph button that pulses while the convocation deliberates.
 *
 * No box-shadow tricks · the geometry is real CSS clip-path so the
 * border curves with the shape, not around it.
 */

import { useCallback, useRef, useState } from "react";

export interface CastingInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  buttonLabel?: string;
}

/**
 * The cut-corner clip path · top-left and bottom-right notches.
 * Reads as `polygon(notch_size 0, ...)` so the shape stays sharp
 * at any width.
 */
const CLIP =
  "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)";

const CLIP_BUTTON =
  "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)";

export function CastingInput({
  value,
  onChange,
  onSubmit,
  disabled,
  loading,
  placeholder = "cast a question into the convocation",
  buttonLabel = "Cast",
}: CastingInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !disabled && !loading) {
        e.preventDefault();
        onSubmit();
      }
    },
    [onSubmit, disabled, loading],
  );

  return (
    <div className="w-full">
      <p className="umbris-eyebrow text-umbris-violet mb-3 text-[10px] tracking-[0.18em]">
        — § cast the question —
      </p>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        {/* ─── The altar frame ─────────────────────────────────── */}
        <div className="relative flex-1 group">
          {/* outer hairline · notched octagon */}
          <div
            className={`absolute inset-0 transition-colors duration-200 ${
              focused
                ? "bg-umbris-violet/90"
                : "bg-umbris-grey/55"
            }`}
            style={{ clipPath: CLIP }}
            aria-hidden
          />
          {/* inner void fill · 1px smaller all sides → leaves the hairline */}
          <div
            className="absolute inset-px bg-umbris-void"
            style={{ clipPath: CLIP }}
            aria-hidden
          />

          {/* corner ticks · four tiny ⌐ marks to anchor the shape */}
          <CornerTicks color={focused ? "var(--umbris-violet)" : "var(--umbris-stellar)"} />

          {/* the actual input · transparent, sits over the void fill */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled || loading}
            placeholder={placeholder}
            aria-label="The question for the convocation"
            className={`relative z-10 w-full px-6 py-4 bg-transparent umbris-serif text-umbris-lunar text-base placeholder:text-umbris-grey/80 focus:outline-none disabled:opacity-50 disabled:cursor-wait`}
            style={{ caretColor: "var(--umbris-violet)" }}
          />
        </div>

        {/* ─── The cast button · matching notched shape ─────────── */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || loading}
          aria-label={loading ? "The convocation is deliberating" : buttonLabel}
          className="relative group disabled:cursor-wait"
          style={{ minWidth: 160 }}
        >
          {/* button hairline */}
          <div
            className={`absolute inset-0 transition-colors duration-200 ${
              loading
                ? "bg-umbris-grey/60"
                : "bg-umbris-violet/90 group-hover:bg-umbris-violet"
            }`}
            style={{ clipPath: CLIP_BUTTON }}
            aria-hidden
          />
          <div
            className={`absolute inset-px transition-colors duration-200 ${
              loading
                ? "bg-umbris-void"
                : "bg-umbris-void group-hover:bg-umbris-violet"
            }`}
            style={{ clipPath: CLIP_BUTTON }}
            aria-hidden
          />

          <span
            className={`relative z-10 flex items-center justify-center gap-3 px-6 py-4 umbris-mono text-xs uppercase tracking-widest transition-colors duration-200 ${
              loading
                ? "text-umbris-grey"
                : "text-umbris-violet group-hover:text-umbris-void"
            }`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <EclipseGlyph spin />
                deliberating
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <EclipseGlyph />
                {buttonLabel}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* sub-line · faint indicator + keyboard hint */}
      <div className="mt-2 flex items-center justify-between">
        <p className="umbris-mono text-umbris-grey text-[9px] uppercase tracking-widest">
          {focused ? "altar open" : "altar at rest"}
        </p>
        <p className="umbris-mono text-umbris-grey text-[9px] uppercase tracking-widest">
          ⏎ to cast
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// CornerTicks · four tiny brackets pinning the octagon's true corners
// ──────────────────────────────────────────────────────────────────

function CornerTicks({ color }: { color: string }) {
  const tickStyle: React.CSSProperties = {
    position: "absolute",
    width: 6,
    height: 1,
    backgroundColor: color,
    pointerEvents: "none",
    transition: "background-color 200ms",
  };
  const stemStyle: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 6,
    backgroundColor: color,
    pointerEvents: "none",
    transition: "background-color 200ms",
  };

  return (
    <>
      {/* top-right · standard corner */}
      <span style={{ ...tickStyle, top: -1, right: -1 }} />
      <span style={{ ...stemStyle, top: -1, right: -1 }} />
      {/* bottom-left · standard corner */}
      <span style={{ ...tickStyle, bottom: -1, left: -1 }} />
      <span style={{ ...stemStyle, bottom: -1, left: -1 }} />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────
// EclipseGlyph · tiny brand mark inside the button
// ──────────────────────────────────────────────────────────────────

function EclipseGlyph({ spin = false }: { spin?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      className={spin ? "animate-spin" : ""}
      style={spin ? { animationDuration: "2s" } : undefined}
      aria-hidden
    >
      {/* umbra */}
      <circle cx="7" cy="7" r="3.6" fill="currentColor" />
      {/* corona */}
      <circle
        cx="7"
        cy="7"
        r="5.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.55"
      />
      {/* diamond ring */}
      <circle cx="9.4" cy="4.4" r="0.9" fill="#FAE6B0" />
    </svg>
  );
}
