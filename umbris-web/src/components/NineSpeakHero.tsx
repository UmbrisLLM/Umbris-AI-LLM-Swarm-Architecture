"use client";

/**
 * NineSpeakHero · the convocation's marquee feature section on the
 * homepage. Sits directly under the Eclipse hero so the live feed is
 * the first thing scrollers land on.
 *
 * Pulls a single fetch of the manifest so the section can show real
 * live numbers (current cycle, status, last update) and makes the
 * "Watch The Nine Speak" CTA the strongest single click target on the
 * page. Fully mobile-responsive.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface ManifestSnapshot {
  updated_at: string;
  latest: {
    cycle: number;
    status: string;
    cost_usd: number;
    started_at?: string;
    finished_at?: string | null;
    voices?: { length?: number } | unknown[];
  };
  recent?: ManifestRecentEntry[];
}

interface ManifestRecentEntry {
  cycle: number;
  status?: string;
  started_at?: string;
  finished_at?: string | null;
  cost_usd?: number;
  wall_seconds?: number;
}

// The daemon's --interval flag. Used to predict when the next cycle
// will ship · keeps the page visibly counting down between cycles.
const CYCLE_INTERVAL_MS = 20 * 60 * 1000;

export function NineSpeakHero() {
  const [snap, setSnap] = useState<ManifestSnapshot | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const fetchOnce = async () => {
      try {
        const r = await fetch(`/api/manifest?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!r.ok) return;
        const data = (await r.json()) as ManifestSnapshot;
        setSnap(data);
      } catch {
        /* silent · the section degrades gracefully without data */
      }
    };
    fetchOnce();
    // One refresh per minute is enough for a teaser · the dedicated
    // /convocation page is where realtime polling lives.
    const id = window.setInterval(fetchOnce, 60_000);
    return () => window.clearInterval(id);
  }, []);

  // 1s tick to keep the "X ago" label fresh.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const cycle = snap?.latest.cycle;
  const status = snap?.latest.status;
  const totalCycles = snap
    ? Math.max(snap.latest.cycle, snap.recent?.length ?? 0)
    : null;
  const cost = snap?.latest.cost_usd;

  const deliberating = status
    ? ["running", "in_progress", "deliberating"].includes(
        status.toLowerCase(),
      )
    : false;

  // ─── Next-cycle countdown ─────────────────────────────────────
  // Anchor on whichever timestamp is most recent · finished_at if the
  // cycle is done, started_at if it's still deliberating, manifest
  // updated_at as the final fallback. Add 20 min and tick down.
  const anchorIso =
    snap?.latest.finished_at ||
    snap?.latest.started_at ||
    snap?.updated_at;
  let nextCycleLabel = "·";
  let nextCycleTone: "violet" | "corona" | "lunar" = "violet";
  if (deliberating) {
    nextCycleLabel = "deliberating now";
    nextCycleTone = "corona";
  } else if (anchorIso) {
    const anchorMs = new Date(anchorIso).getTime();
    if (Number.isFinite(anchorMs)) {
      const diffMs = anchorMs + CYCLE_INTERVAL_MS - now;
      if (diffMs <= 0) {
        const lateMin = Math.floor(-diffMs / 60_000);
        // Honest scale · small late = mid-cycle, medium late = working
        // a hard problem, big late = daemon paused / needs attention.
        if (lateMin < 1) {
          nextCycleLabel = "due any moment";
          nextCycleTone = "corona";
        } else if (lateMin < 20) {
          nextCycleLabel = `${lateMin}m late`;
          nextCycleTone = "corona";
        } else if (lateMin < 60) {
          nextCycleLabel = `${lateMin}m late · working it`;
          nextCycleTone = "corona";
        } else {
          const lateH = Math.floor(lateMin / 60);
          const lateR = lateMin % 60;
          nextCycleLabel =
            lateH >= 1
              ? `paused ${lateH}h ${lateR.toString().padStart(2, "0")}m`
              : `paused ${lateMin}m`;
          nextCycleTone = "lunar";
        }
      } else {
        const totalSec = Math.ceil(diffMs / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        nextCycleLabel =
          m >= 1
            ? `~${m}m ${s.toString().padStart(2, "0")}s`
            : `~${s}s`;
        nextCycleTone = "violet";
      }
    }
  }

  // ─── Per-cycle wall time ──────────────────────────────────────
  // The duration of the most recent finished cycle, plus an average
  // across all finished cycles in the manifest tail. Both render below
  // the stat strip so viewers know what "one cycle" actually costs in
  // wall time.
  const finishedCycles: ManifestRecentEntry[] = (snap?.recent ?? [])
    .filter((r) => {
      const s = (r.status || "").toLowerCase();
      return s !== "running" && s !== "in_progress" && s !== "deliberating";
    });

  const lastCycleSeconds = computeCycleSeconds(
    snap?.latest.started_at,
    snap?.latest.finished_at,
    finishedCycles[0]?.wall_seconds,
  );

  let avgCycleSeconds: number | null = null;
  const allDurations: number[] = [];
  for (const r of finishedCycles) {
    const s = computeCycleSeconds(r.started_at, r.finished_at, r.wall_seconds);
    if (s != null) allDurations.push(s);
  }
  if (allDurations.length > 0) {
    avgCycleSeconds =
      allDurations.reduce((a, b) => a + b, 0) / allDurations.length;
  }

  return (
    <section
      id="the-nine-speak"
      className="relative w-full bg-umbris-void overflow-hidden"
      aria-label="The Nine Speak · live convocation feed"
    >
      {/* corona-tinted cosmic glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(255,178,89,0.10), transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(156,123,217,0.10), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-[1180px] px-5 sm:px-6 md:px-8 py-20 sm:py-24 md:py-32">
        {/* LIVE pill */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.7 }}
          className="flex justify-center mb-8 sm:mb-10"
        >
          <div
            className="inline-flex items-center gap-2 sm:gap-2.5 border border-umbris-corona/60 bg-umbris-void/40 px-3 py-1.5 sm:px-4 sm:py-2"
            style={{ boxShadow: "0 0 18px rgba(255,178,89,0.20)" }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-umbris-corona animate-umbris-heartbeat"
              aria-hidden
            />
            <span className="umbris-mono text-umbris-corona text-[10px] sm:text-[11px] uppercase tracking-[0.2em]">
              live now · the convocation is speaking
            </span>
          </div>
        </motion.div>

        {/* Big title */}
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.9, delay: 0.05 }}
          className="umbris-display text-umbris-lunar text-center leading-[0.95] text-[clamp(2.6rem,9vw,6.5rem)] mb-6 sm:mb-8"
          style={{
            textShadow:
              "0 0 36px rgba(255,178,89,0.18), 0 0 120px rgba(255,178,89,0.08)",
          }}
        >
          THE NINE SPEAK
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="umbris-serif italic text-umbris-stellar text-center text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-snug mb-10 sm:mb-12 md:mb-14"
        >
          Nine planetary minds deliberate in public · every twenty minutes a new
          cycle ships · every cycle a new voice, a new verdict, a new commit.
          Watch them think.
        </motion.p>

        {/* Live stats strip · only renders when manifest data is in */}
        {snap && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-10 sm:mb-12 md:mb-14"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-3xl mx-auto">
              <Stat label="cycle" value={padCycle(cycle)} tone="violet" />
              <Stat
                label="status"
                value={
                  status
                    ? status.toLowerCase().replace(/_/g, " ")
                    : "·"
                }
                tone={deliberating ? "corona" : "lunar"}
                pulse={deliberating}
              />
              <Stat
                label="cycles run"
                value={padCycle(totalCycles ?? undefined)}
                tone="lunar"
              />
              {/* NEXT CYCLE · live countdown that ticks every second.
                  This is what makes the strip never read as static
                  between cycles. */}
              <Stat
                label="next cycle"
                value={nextCycleLabel}
                tone={nextCycleTone}
                pulse={nextCycleTone === "corona"}
              />
            </div>

            {/* Per-cycle duration · last and average. Renders directly
                below the strip so the reader knows what "one cycle"
                costs in wall-time as well as dollars. */}
            <p className="umbris-mono text-umbris-grey text-[10px] uppercase tracking-widest text-center mt-4 tabular-nums">
              {lastCycleSeconds != null && (
                <>· last cycle ran {formatDuration(lastCycleSeconds)} </>
              )}
              {typeof cost === "number" && (
                <>· spent ${cost.toFixed(4)} </>
              )}
              {avgCycleSeconds != null && allDurations.length >= 2 && (
                <>
                  · avg {formatDuration(avgCycleSeconds)} across{" "}
                  {allDurations.length} cycles{" "}
                </>
              )}
              ·
            </p>
          </motion.div>
        )}

        {/* The big CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <Link
            href="/convocation"
            className="group relative inline-flex items-center gap-3 sm:gap-4 border-2 border-umbris-corona bg-umbris-void px-6 sm:px-8 md:px-10 py-4 sm:py-5 hover:bg-umbris-corona/[0.08] transition-colors"
            style={{
              boxShadow:
                "0 0 36px rgba(255,178,89,0.30), 0 0 120px rgba(255,178,89,0.10)",
            }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full bg-umbris-corona animate-umbris-heartbeat flex-shrink-0"
              aria-hidden
            />
            <span className="umbris-display text-umbris-corona text-base sm:text-lg md:text-xl tracking-[0.18em] uppercase">
              Watch the convocation live
            </span>
            <span
              className="umbris-mono text-umbris-corona text-base sm:text-lg flex-shrink-0 transition-transform group-hover:translate-x-1"
              aria-hidden
            >
              →
            </span>
          </Link>
          <p className="umbris-mono text-umbris-grey text-[10px] uppercase tracking-widest text-center">
            · no signup · no backend · just the public manifest, polled live ·
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
  pulse,
}: {
  label: string;
  value: string;
  tone: "violet" | "corona" | "lunar" | "stellar";
  pulse?: boolean;
}) {
  const toneClass =
    tone === "violet"
      ? "text-umbris-violet"
      : tone === "corona"
        ? "text-umbris-corona"
        : tone === "lunar"
          ? "text-umbris-lunar"
          : "text-umbris-stellar";
  return (
    <div
      className={`border ${
        pulse
          ? "border-umbris-corona/60 animate-umbris-breathe"
          : "border-umbris-grey/30"
      } bg-umbris-void/60 px-3 py-3 sm:px-4 sm:py-4 text-center`}
    >
      <p className="umbris-eyebrow text-umbris-stellar text-[9px] mb-1.5">
        {label}
      </p>
      <p
        className={`umbris-mono text-sm sm:text-base tabular-nums truncate ${toneClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function padCycle(n: number | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "····";
  return String(n).padStart(4, "0");
}

function formatAgo(iso: string, now: number): string {
  try {
    const d = new Date(iso).getTime();
    if (!Number.isFinite(d)) return "·";
    const diff = Math.max(0, (now - d) / 1000);
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return "·";
  }
}

/**
 * Resolve a cycle's duration in seconds. Prefer the daemon-supplied
 * `wall_seconds` when available; otherwise compute from started/finished
 * timestamps. Returns null when there's not enough data.
 */
function computeCycleSeconds(
  started: string | null | undefined,
  finished: string | null | undefined,
  wallSeconds: number | null | undefined,
): number | null {
  if (typeof wallSeconds === "number" && Number.isFinite(wallSeconds) && wallSeconds > 0) {
    return wallSeconds;
  }
  if (!started || !finished) return null;
  try {
    const s = new Date(started).getTime();
    const f = new Date(finished).getTime();
    if (!Number.isFinite(s) || !Number.isFinite(f)) return null;
    const diff = (f - s) / 1000;
    return diff > 0 ? diff : null;
  } catch {
    return null;
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}
