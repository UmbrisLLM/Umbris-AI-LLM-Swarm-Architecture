"use client";

import { useRunStore } from "@/store/useRunStore";
import type { RunPhase } from "@/lib/types";

export type TimelineStatus = "done" | "active" | "pending";

interface DisplayStep {
  key: RunPhase;
  label: string;
  subtitle: string;
  timestamp?: string;
  status: TimelineStatus;
}

const STEPS: ReadonlyArray<Omit<DisplayStep, "timestamp" | "status">> = [
  { key: "QUERY_POSED",           label: "QUERY POSED",           subtitle: "The user has posed a new query."  },
  { key: "CONVOCATION_ASSEMBLED", label: "CONVOCATION ASSEMBLED", subtitle: "All planets are online and ready." },
  { key: "RESEARCH_INITIATED",    label: "RESEARCH INITIATED",    subtitle: "Charting the edges of knowledge." },
  { key: "SYNTHESIS_IN_PROGRESS", label: "SYNTHESIS IN PROGRESS", subtitle: "Weaving insights together."       },
  { key: "VERIFICATION_PENDING",  label: "VERIFICATION PENDING",  subtitle: "Fact-checking and validation."    },
  { key: "VERDICT_PENDING",       label: "VERDICT PENDING",       subtitle: "Judgment and final verdict."      },
];

const ORDER: RunPhase[] = STEPS.map((s) => s.key);

export function ConvocationTimeline() {
  const phase = useRunStore((s) => s.phase);
  const phaseTimestamps = useRunStore((s) => s.phaseTimestamps);

  // Map current phase to the timeline index. VERDICT_READY = all done.
  let currentIdx = ORDER.indexOf(phase);
  if (phase === "VERDICT_READY") currentIdx = ORDER.length;

  const steps: DisplayStep[] = STEPS.map((s, i) => ({
    ...s,
    timestamp: phaseTimestamps[s.key]
      ? formatTime(phaseTimestamps[s.key]!)
      : undefined,
    status: i < currentIdx ? "done" : i === currentIdx ? "active" : "pending",
  }));

  return (
    <section className="umbris-panel p-4">
      <header className="mb-3">
        <span className="umbris-eyebrow">CONVOCATION TIMELINE</span>
      </header>
      <ol className="relative ml-3">
        <span
          aria-hidden
          className="absolute left-[5px] top-2 bottom-2 w-px bg-gradient-to-b from-umbris-violet/50 via-umbris-grey/30 to-umbris-grey/10"
        />
        {steps.map((step, i) => (
          <li key={i} className="relative pl-6 pb-3 last:pb-0">
            <StepBullet status={step.status} />
            <div className="flex items-start justify-between gap-2">
              <span
                className={`umbris-display text-[10.5px] tracking-widest ${
                  step.status === "done"
                    ? "text-umbris-lunar"
                    : step.status === "active"
                      ? "text-umbris-violet"
                      : "text-umbris-grey"
                }`}
              >
                {step.label}
              </span>
              <span
                className={`umbris-mono text-[10px] ${
                  step.status === "active" ? "text-umbris-violet" : "text-umbris-grey"
                }`}
              >
                {step.timestamp ?? "·"}
              </span>
            </div>
            <p className="umbris-serif italic text-[11px] text-umbris-stellar mt-0.5">
              {step.subtitle}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function StepBullet({ status }: { status: TimelineStatus }) {
  if (status === "done") {
    return (
      <span className="absolute left-[-1px] top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-umbris-void text-umbris-violet umbris-mono text-[10px] leading-none border border-umbris-violet/70">
        ✓
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="absolute left-[-1px] top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-umbris-void">
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-umbris-violet opacity-70 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-umbris-violet" />
        </span>
      </span>
    );
  }
  return (
    <span className="absolute left-[-1px] top-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full border border-umbris-grey/50 bg-umbris-void">
      <span className="h-1 w-1 rounded-full bg-umbris-grey" />
    </span>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", { hour12: false });
  } catch {
    return "·";
  }
}
