"use client";

import { useEffect } from "react";
import type { ConvocationMode, PresetId } from "@/lib/types";
import { useComposerStore } from "@/store/useComposerStore";
import { useRunStore } from "@/store/useRunStore";
import { useEngineStore } from "@/store/useEngineStore";

const PRESETS: ReadonlyArray<{ id: PresetId; label: string }> = [
  { id: "deep-research",        label: "Deep Research" },
  { id: "strategic-analysis",   label: "Strategic Analysis" },
  { id: "code-audit",           label: "Code Audit" },
  { id: "whitepaper-review",    label: "Whitepaper Review" },
  { id: "market-intelligence",  label: "Market Intelligence" },
  { id: "custom",               label: "Custom" },
];

const CONVOCATION_MODES: ReadonlyArray<{
  id: ConvocationMode;
  label: string;
  subtitle: string;
}> = [
  { id: "STANDARD", label: "STANDARD", subtitle: "balanced depth and speed" },
  { id: "DEEP",     label: "DEEP",     subtitle: "maximum depth · longer vigil" },
  { id: "RAPID",    label: "RAPID",    subtitle: "faster answers · lighter consensus" },
];

export function QueryComposer() {
  const c = useComposerStore();
  const engineReady = useEngineStore((s) => s.status === "ready");
  const runPhase = useRunStore((s) => s.phase);
  const startRun = useRunStore((s) => s.startRun);
  const cancelRun = useRunStore((s) => s.cancelRun);

  const isRunning =
    runPhase !== "IDLE" &&
    runPhase !== "VERDICT_READY" &&
    runPhase !== "FAILED" &&
    runPhase !== "CANCELLED";

  const canPose = engineReady && c.query.trim().length > 0 && !isRunning;

  const onPose = () => {
    if (!canPose) return;
    startRun(c.toRunInput());
  };

  // Cmd/Ctrl + Enter
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canPose) {
        e.preventDefault();
        onPose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <section className="umbris-panel flex h-full w-[360px] flex-col p-5 gap-4 overflow-y-auto">
      <header>
        <h2 className="umbris-display text-umbris-lunar text-[16px] mb-1">POSE A QUERY</h2>
        <p className="umbris-serif italic text-umbris-stellar text-[12px]">
          the right question summons the right wisdom.
        </p>
      </header>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={c.query}
          onChange={(e) => c.setQuery(e.target.value)}
          placeholder="Enter your query with intent…"
          rows={6}
          disabled={isRunning}
          className="w-full min-h-[140px] resize-none border border-umbris-grey/40 bg-umbris-void/40 p-3 umbris-serif text-umbris-lunar text-[14px] placeholder:text-umbris-grey focus:outline-none focus:border-umbris-violet/60 disabled:opacity-60"
        />
        <span className="absolute bottom-2 right-3 umbris-mono text-umbris-grey text-[10px]">
          {c.query.length} / 4000
        </span>
      </div>

      {/* Presets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="umbris-eyebrow">QUERY PRESETS</span>
          <button className="umbris-mono text-umbris-violet text-[10px] uppercase tracking-widest hover:underline">
            MANAGE
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {PRESETS.map((p) => {
            const active = c.preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => c.applyPreset(p.id)}
                disabled={isRunning}
                className={`px-2 py-1.5 text-[10.5px] umbris-serif italic border transition-colors ${
                  active
                    ? "border-umbris-violet/70 bg-umbris-violet/5 text-umbris-violet"
                    : "border-umbris-grey/40 text-umbris-stellar hover:border-umbris-violet/40 hover:text-umbris-lunar"
                } disabled:opacity-50`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Convocation Mode */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <span className="umbris-eyebrow">CONVOCATION MODE</span>
          <span className="text-umbris-grey text-[10px]" aria-hidden>ⓘ</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {CONVOCATION_MODES.map((m) => {
            const active = c.convocationMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => c.setConvocationMode(m.id)}
                disabled={isRunning}
                className={`flex items-center gap-3 border p-2.5 text-left transition-colors ${
                  active
                    ? "border-umbris-violet/60 bg-umbris-violet/5"
                    : "border-umbris-grey/30 hover:border-umbris-violet/40"
                } disabled:opacity-50`}
              >
                <span
                  className={`relative inline-flex h-3 w-3 rounded-full border ${
                    active ? "border-umbris-violet" : "border-umbris-grey"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-0.5 rounded-full bg-umbris-violet" />
                  )}
                </span>
                <span className="flex flex-col leading-tight">
                  <span
                    className={`umbris-display text-[11px] tracking-widest ${
                      active ? "text-umbris-violet" : "text-umbris-stellar"
                    }`}
                  >
                    {m.label}
                  </span>
                  <span className="umbris-serif italic text-[11px] text-umbris-grey mt-0.5">
                    {m.subtitle}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Research Depth */}
      <div>
        <span className="umbris-eyebrow block mb-2">RESEARCH DEPTH</span>
        <input
          type="range"
          min={1}
          max={5}
          value={c.researchDepth}
          onChange={(e) =>
            c.setResearchDepth(parseInt(e.target.value, 10) as 1 | 2 | 3 | 4 | 5)
          }
          disabled={isRunning}
          className="w-full accent-umbris-violet disabled:opacity-50"
        />
        <div className="flex justify-between mt-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`umbris-mono text-[10px] ${
                n === c.researchDepth ? "text-umbris-violet" : "text-umbris-grey"
              }`}
            >
              {n}
            </span>
          ))}
        </div>
      </div>

      {/* Constraints */}
      <div>
        <span className="umbris-eyebrow block mb-2">CONSTRAINTS</span>
        <div className="relative">
          <textarea
            value={c.constraints}
            onChange={(e) => c.setConstraints(e.target.value)}
            placeholder="Add constraints, focus areas, or boundaries…"
            rows={3}
            disabled={isRunning}
            className="w-full min-h-[68px] resize-none border border-umbris-grey/40 bg-umbris-void/40 p-3 umbris-serif text-umbris-lunar text-[12px] placeholder:text-umbris-grey focus:outline-none focus:border-umbris-violet/60 disabled:opacity-60"
          />
          <span className="absolute bottom-2 right-3 umbris-mono text-umbris-grey text-[10px]">
            {c.constraints.length} / 1000
          </span>
        </div>
      </div>

      {/* Caps + lock */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between border border-umbris-grey/30 px-3 py-2">
          <span className="umbris-eyebrow">COST CAP (USD)</span>
          <input
            type="number"
            min={0.1}
            max={500}
            step={0.5}
            value={c.costCapUsd}
            onChange={(e) => c.setCostCap(parseFloat(e.target.value) || 0.1)}
            disabled={isRunning}
            className="w-20 bg-transparent text-right umbris-mono text-umbris-violet text-[13px] focus:outline-none disabled:opacity-50"
          />
        </div>
        <div className="flex items-center justify-between border border-umbris-grey/30 px-3 py-2">
          <span className="umbris-eyebrow">TIME CAP (HOURS)</span>
          <input
            type="number"
            min={0.1}
            max={24}
            step={0.5}
            value={c.timeCapHours}
            onChange={(e) => c.setTimeCap(parseFloat(e.target.value) || 0.1)}
            disabled={isRunning}
            className="w-20 bg-transparent text-right umbris-mono text-umbris-violet text-[13px] focus:outline-none disabled:opacity-50"
          />
        </div>
        <div className="flex items-center justify-between border border-umbris-grey/30 px-3 py-2 opacity-60">
          <span className="umbris-eyebrow">SOURCES LOCK</span>
          <span className="umbris-mono text-umbris-grey text-[10px] uppercase tracking-widest">
            v1.2
          </span>
        </div>
      </div>

      {/* POSE / CANCEL button */}
      <button
        type="button"
        onClick={isRunning ? cancelRun : onPose}
        disabled={!isRunning && !canPose}
        className={`mt-2 h-14 border transition-colors ${
          isRunning
            ? "border-umbris-stellar/60 text-umbris-stellar hover:border-umbris-lunar hover:text-umbris-lunar"
            : canPose
              ? "border-umbris-violet/70 text-umbris-violet hover:bg-umbris-violet/5 hover:shadow-[0_0_24px_rgba(156,123,217,0.18)]"
              : "border-umbris-grey/30 text-umbris-grey cursor-not-allowed"
        }`}
      >
        <span className="flex items-center justify-center gap-3">
          <span className="umbris-display text-[17px] tracking-[0.32em]">
            {isRunning ? "CANCEL" : "POSE"}
          </span>
          <span aria-hidden className="umbris-mono text-[12px]">
            {isRunning ? "■" : "◇"}
          </span>
        </span>
      </button>

      {!engineReady && (
        <p className="umbris-serif italic text-umbris-grey text-[11px] text-center">
          the convocation is still waking. give it a moment.
        </p>
      )}
    </section>
  );
}
