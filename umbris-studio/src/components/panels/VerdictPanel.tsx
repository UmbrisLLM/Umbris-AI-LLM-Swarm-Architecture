"use client";

import { useRunStore } from "@/store/useRunStore";
import { useEffect, useState } from "react";

export function VerdictPanel() {
  const phase = useRunStore((s) => s.phase);
  const verdict = useRunStore((s) => s.verdict);
  const error = useRunStore((s) => s.error);
  const metrics = useRunStore((s) => s.metrics);

  const isIdle = phase === "IDLE";
  const isRunning = !isIdle && phase !== "VERDICT_READY" && phase !== "FAILED";
  const isVerified = phase === "VERDICT_READY";
  const isFailed = phase === "FAILED";

  return (
    <section className="flex h-full flex-col gap-4">
      {/* ── Verdict canvas ───────────────────────────────────────── */}
      <div
        className="umbris-panel flex flex-col p-5"
        style={
          isVerified
            ? { boxShadow: "0 0 36px rgba(156,123,217,0.18)" }
            : undefined
        }
      >
        <header className="mb-3">
          <h2 className="umbris-display text-umbris-lunar text-[16px] mb-1">VERDICT</h2>
          <p
            className={`umbris-serif italic text-[12px] ${
              isVerified
                ? "text-umbris-violet"
                : isFailed
                  ? "text-umbris-error"
                  : "text-umbris-stellar"
            }`}
          >
            {isIdle && "awaiting the verdict."}
            {isRunning && "the convocation deliberates."}
            {isVerified && "the convocation has spoken."}
            {isFailed && "the convocation has failed."}
          </p>
        </header>

        {isIdle && <EmptyState />}
        {isRunning && <RunningState progress={metrics.consensusPct} />}
        {isVerified && verdict && <VerifiedView verdict={verdict} />}
        {isFailed && <FailureView error={error} />}
      </div>

      {/* ── Action row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!verdict}
          className="border border-umbris-violet/60 py-2.5 text-umbris-violet hover:bg-umbris-violet/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="flex items-center justify-center gap-2">
            <span aria-hidden className="umbris-mono text-[12px]">◉</span>
            <span className="umbris-display text-[11px] tracking-widest">VIEW LIVE TRACE</span>
          </span>
        </button>
        <button
          type="button"
          disabled={!verdict}
          className="border border-umbris-violet/60 py-2.5 text-umbris-violet hover:bg-umbris-violet/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="flex items-center justify-center gap-2">
            <span aria-hidden className="umbris-mono text-[12px]">⬇</span>
            <span className="umbris-display text-[11px] tracking-widest">SAVE TRACE</span>
          </span>
        </button>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-7 gap-4">
      <DiamondOrnament />
      <div className="text-center">
        <p className="umbris-display text-umbris-violet text-[15px] tracking-widest">
          AWAITING VERDICT
        </p>
        <p className="umbris-serif italic text-umbris-stellar text-[12px] mt-1">
          the convocation is still in council.
        </p>
      </div>
    </div>
  );
}

function RunningState({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-7 gap-4">
      <DiamondOrnament dim />
      <div className="text-center w-full px-2">
        <p className="umbris-display text-umbris-violet text-[13px] tracking-widest">
          DELIBERATION IN PROGRESS
        </p>
        <p className="umbris-serif italic text-umbris-stellar text-[12px] mt-1 mb-3">
          records streaming from the convocation.
        </p>
        <div className="h-px w-full bg-umbris-grey/30 relative">
          <div
            className="absolute left-0 top-0 h-px bg-umbris-violet transition-all duration-700"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="umbris-mono text-umbris-violet text-[10px] mt-2 tracking-widest">
          {Math.round(progress)}% CONSENSUS
        </p>
      </div>
    </div>
  );
}

function VerifiedView({
  verdict,
}: {
  verdict: NonNullable<ReturnType<typeof useRunStore.getState>["verdict"]>;
}) {
  const [showGlow, setShowGlow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowGlow(false), 1200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex flex-col gap-3">
      <p
        className={`umbris-display text-[14px] tracking-widest ${
          verdict.accepted ? "text-umbris-violet" : "text-umbris-stellar"
        }`}
        style={
          showGlow
            ? { textShadow: "0 0 18px rgba(156,123,217,0.55)" }
            : { textShadow: "0 0 12px rgba(156,123,217,0.22)" }
        }
      >
        {verdict.accepted ? "VERIFIED." : "BEST REMAINING."}
        {!verdict.accepted && (
          <span className="umbris-serif italic text-umbris-grey text-[11px] ml-2">
            (not verified)
          </span>
        )}
      </p>
      <div className="h-px w-12 bg-umbris-violet/40" />
      <p className="umbris-serif text-umbris-lunar text-[15px] leading-relaxed max-h-[180px] overflow-y-auto pr-2">
        {verdict.answer}
      </p>
      {verdict.limitations && (
        <p className="umbris-serif italic text-umbris-stellar text-[12px]">
          Limitations: {verdict.limitations}
        </p>
      )}
      <div className="mt-1">
        <span className="umbris-eyebrow block mb-1.5">CONFIDENCE</span>
        <div className="h-1.5 w-full bg-umbris-grey/30 relative">
          <div
            className="absolute left-0 top-0 h-1.5 bg-umbris-violet transition-all duration-700"
            style={{ width: `${Math.round(verdict.confidence * 100)}%` }}
          />
        </div>
        <span className="umbris-mono text-umbris-violet text-[11px] mt-1 inline-block">
          {Math.round(verdict.confidence * 100)}%
        </span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="umbris-mono text-umbris-grey text-[10px] tracking-widest">
          ${verdict.costUsd.toFixed(4)} · {verdict.wallSec.toFixed(1)}s WALL · {verdict.totalRecords} RECORDS
        </span>
      </div>
    </div>
  );
}

function FailureView({ error }: { error: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center py-7 gap-3">
      <p className="umbris-display text-umbris-error text-[14px] tracking-widest">FAILED</p>
      <p className="umbris-serif italic text-umbris-stellar text-[12px] text-center max-w-[280px]">
        {error ?? "the convocation could not produce a verdict."}
      </p>
    </div>
  );
}

function DiamondOrnament({ dim = false }: { dim?: boolean }) {
  const opacity = dim ? 0.25 : 0.55;
  return (
    <svg width="180" height="80" viewBox="0 0 180 80" aria-hidden>
      {Array.from({ length: 3 }, (_, row) =>
        Array.from({ length: 9 }, (_, col) => {
          const cx = 10 + col * 20;
          const cy = 12 + row * 28;
          const isCentral = row === 1 && col === 4;
          if (isCentral) return null;
          const size = 3;
          return (
            <path
              key={`${row}-${col}`}
              d={`M${cx} ${cy - size} L${cx + size} ${cy} L${cx} ${cy + size} L${cx - size} ${cy} Z`}
              fill="#9C7BD9"
              opacity={opacity}
            />
          );
        })
      )}
      <path
        d="M90 18 L116 40 L90 62 L64 40 Z"
        fill="none"
        stroke="#9C7BD9"
        strokeWidth={1.2}
        opacity={dim ? 0.45 : 0.9}
      />
      <path
        d="M90 28 L106 40 L90 52 L74 40 Z"
        fill="#9C7BD9"
        opacity={dim ? 0.12 : 0.25}
      />
    </svg>
  );
}
