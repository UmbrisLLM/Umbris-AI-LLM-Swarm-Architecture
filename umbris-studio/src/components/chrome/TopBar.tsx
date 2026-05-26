"use client";

import { AstrolabeOrnament, WordmarkFlourishLeft, WordmarkFlourishRight } from "@umbris/design/chrome";
import { useEngineStore } from "@/store/useEngineStore";
import { useRunStore } from "@/store/useRunStore";

export function TopBar() {
  const engineStatus = useEngineStore((s) => s.status);
  const phase = useRunStore((s) => s.phase);
  const metrics = useRunStore((s) => s.metrics);

  // Status text + tone
  let statusLine: string;
  let statusViolet: boolean;
  let pulse: boolean;
  let subline: string;

  if (engineStatus === "booting") {
    statusLine = "THE CONVOCATION IS WAKING";
    statusViolet = false;
    pulse = true;
    subline = "engine starting…";
  } else if (engineStatus === "crashed") {
    statusLine = "THE CONVOCATION IS UNREACHABLE";
    statusViolet = false;
    pulse = false;
    subline = "engine not responding";
  } else if (phase === "IDLE") {
    statusLine = "THE CONVOCATION IS RESTING";
    statusViolet = false;
    pulse = false;
    subline = "ready to deliberate";
  } else if (phase === "VERDICT_READY") {
    statusLine = "VERDICT READY";
    statusViolet = true;
    pulse = true;
    subline = metrics.costUsd ? `$${metrics.costUsd.toFixed(4)} · ${metrics.wallSec.toFixed(1)}s wall` : "verdict ready";
  } else if (phase === "FAILED") {
    statusLine = "THE CONVOCATION HAS FAILED";
    statusViolet = false;
    pulse = false;
    subline = "see verdict panel";
  } else {
    statusLine = "THE CONVOCATION IS ACTIVE";
    statusViolet = true;
    pulse = true;
    subline = formatEta(metrics.estCompletionSec);
  }

  return (
    <header
      className="relative grid w-full items-center border-b border-umbris-grey/30 bg-umbris-void px-6"
      style={{ gridTemplateColumns: "320px 1fr 320px", height: "80px" }}
    >
      {/* ── LEFT · brand + eyebrow ───────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="text-umbris-violet/70">
          <AstrolabeOrnament size={44} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="umbris-display text-umbris-lunar text-[13px] tracking-widest">
            UMBRIS AI STUDIO
          </span>
          <span className="umbris-eyebrow mt-1">
            § EX UMBRIS IN LUMEN &nbsp;·&nbsp; MMXXVI
          </span>
        </div>
      </div>

      {/* ── CENTRE · wordmark ────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-4">
        <div className="text-umbris-violet/65">
          <WordmarkFlourishLeft size={130} />
        </div>
        <div className="flex flex-col items-center leading-none">
          <span className="umbris-eyebrow text-umbris-violet text-[9px] tracking-[0.4em] mb-1">
            ↞ I AM ↠
          </span>
          <span
            className="umbris-display text-umbris-lunar tracking-[0.22em]"
            style={{
              fontSize: "44px",
              textShadow:
                "0 0 28px rgba(156,123,217,0.32), 0 0 80px rgba(156,123,217,0.12)",
            }}
          >
            UMBRIS
          </span>
        </div>
        <div className="text-umbris-violet/65">
          <WordmarkFlourishRight size={130} />
        </div>
      </div>

      {/* ── RIGHT · convocation status ───────────────────────────── */}
      <div className="flex items-center justify-end gap-4">
        <div className="flex flex-col items-end leading-tight">
          <div className="flex items-center gap-2">
            <span className="relative inline-flex h-1.5 w-1.5" aria-hidden>
              {pulse && statusViolet && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-umbris-violet opacity-70 animate-ping" />
              )}
              <span
                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                  statusViolet ? "bg-umbris-violet" : "bg-umbris-grey"
                }`}
              />
            </span>
            <span
              className={`umbris-display text-[11px] tracking-widest ${
                statusViolet ? "text-umbris-lunar" : "text-umbris-grey"
              }`}
            >
              {statusLine}
            </span>
          </div>
          {subline && (
            <span className={`umbris-eyebrow mt-1 ${statusViolet ? "text-umbris-violet" : "text-umbris-grey"}`}>
              {subline}
            </span>
          )}
        </div>
        <div className="text-umbris-violet/70">
          <AstrolabeOrnament size={44} />
        </div>
      </div>
    </header>
  );
}

function formatEta(sec: number): string {
  if (!sec || sec <= 0) return "deliberating";
  if (sec < 60) return `verdict in ${Math.round(sec)} seconds`;
  const minutes = Math.round(sec / 60);
  if (minutes < 120) return `verdict in ${minutes} minutes`;
  const hours = (sec / 3600).toFixed(1);
  return `verdict in ~${hours} hours`;
}
