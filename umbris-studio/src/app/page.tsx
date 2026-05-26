"use client";

import { TopBar } from "@/components/chrome/TopBar";
import { LeftRail } from "@/components/chrome/LeftRail";
import { BottomBar } from "@/components/chrome/BottomBar";
import { EclipseOrb, type OrbState } from "@/components/EclipseOrb/EclipseOrb";
import { QueryComposer } from "@/components/panels/QueryComposer";
import { ConvocationAgents } from "@/components/panels/ConvocationAgents";
import { MetricsStrip } from "@/components/panels/MetricsStrip";
import { ConvocationTimeline } from "@/components/panels/ConvocationTimeline";
import { VerdictPanel } from "@/components/panels/VerdictPanel";
import { useRunStore } from "@/store/useRunStore";

export default function HUDPage() {
  const phase = useRunStore((s) => s.phase);
  const activeAgents = useRunStore((s) => s.activeAgents);
  const pendingAgents = useRunStore((s) => s.pendingAgents);
  const doneAgents = useRunStore((s) => s.doneAgents);
  const metrics = useRunStore((s) => s.metrics);

  const orbState: OrbState =
    phase === "IDLE"
      ? "idle"
      : phase === "VERDICT_READY"
        ? "verified"
        : phase === "FAILED"
          ? "failed"
          : "deliberating";

  return (
    <main className="grid h-screen w-screen grid-rows-[80px_1fr_72px] grid-cols-[64px_1fr] bg-umbris-void text-umbris-lunar overflow-hidden">
      <div className="col-span-2">
        <TopBar />
      </div>

      <div className="row-span-1">
        <LeftRail />
      </div>

      <div className="grid grid-cols-[360px_1fr_360px] gap-4 p-4 overflow-hidden">
        {/* Left · composer */}
        <QueryComposer />

        {/* Centre · orb + agents + metrics */}
        <section className="flex flex-col gap-4 overflow-hidden">
          <header className="text-center">
            <h2 className="umbris-display text-umbris-lunar text-[18px]">
              THE CONVOCATION DELIBERATES
            </h2>
            <p className="umbris-serif italic text-umbris-stellar text-[12px] mt-1">
              many planets &nbsp;·&nbsp; one verdict.
            </p>
          </header>

          <div className="flex flex-1 items-center justify-center min-h-0">
            <EclipseOrb
              state={orbState}
              size={300}
              activeAgents={activeAgents}
            />
          </div>

          <div className="flex-shrink-0">
            <ConvocationAgents
              activeAgents={activeAgents}
              pendingAgents={pendingAgents}
              doneAgents={doneAgents}
            />
          </div>

          <div className="flex-shrink-0">
            <MetricsStrip
              convocationHealth={metrics.convocationHealth}
              consensusPct={metrics.consensusPct}
              tokensConsumed={formatTokens(metrics.tokensConsumed)}
              estCompletion={formatEta(metrics.estCompletionSec)}
            />
          </div>
        </section>

        {/* Right · verdict + timeline + recents */}
        <section className="flex flex-col gap-4 overflow-y-auto">
          <VerdictPanel />
          <ConvocationTimeline />
        </section>
      </div>

      <div className="col-span-2">
        <BottomBar />
      </div>
    </main>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function formatEta(sec: number): string {
  if (!sec || sec <= 0) return "·";
  if (sec < 60) return `${Math.round(sec)}S`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m < 60) return `${m}M ${s.toString().padStart(2, "0")}S`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}H ${rm}M`;
}
