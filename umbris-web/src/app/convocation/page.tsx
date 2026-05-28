"use client";

/**
 * /convocation · the live public-facing feed of the UMBRIS convocation.
 *
 * Polls the manifest the Custos sentinel writes to
 * `lore/revolutions/auto/manifest.json` every 20 seconds and renders
 * the latest cycle's voices as a scrolling, animated conversation.
 *
 * Two clocks make this feel live:
 *   1) a 1-second `now` tick re-renders the status bar so elapsed,
 *      cost, manifest age, and the next-poll countdown all update
 *      every second
 *   2) a 20-second poll hits /api/manifest (our Vercel edge proxy)
 *      which bypasses GitHub raw's 5-minute CDN cache · the page is
 *      never more than ~20s behind what the daemon has committed
 *
 * The LIVE pill in the status bar pulses whenever a fresh poll lands
 * and the cycle list at the right shows every finished cycle the
 * daemon has surfaced.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SIGIL_UNICODE, AGENT_DESCRIPTORS, type AgentRole } from "@umbris/design";

// Next page-level config · don't pre-render this at build time. The
// content is purely client-fetched and updates live.
export const dynamic = "force-dynamic";

// ──────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────

// Hit our own edge proxy at /api/manifest · it forces fresh fetches
// from GitHub raw so we never serve content more than ~10s stale.
// Direct GitHub raw was caching at the CDN edge for up to 5 minutes
// even with `cache: 'no-store'` from the client, which broke "real-time."
const MANIFEST_URL = "/api/manifest";

const REPO_BASE =
  "https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture";

// How often the page hits /api/manifest. The edge proxy caches for
// 10s so even 30 viewers polling at this cadence is one upstream call
// per ~10s, not 30 per second.
const POLL_INTERVAL_MS = 20_000;

// The convocation completes one cycle approximately every 20 minutes ·
// this matches the daemon's --interval flag. The page uses it to give
// viewers a concrete "next cycle expected in ~Nm" countdown so the
// gap between manifest writes never reads as "the page is broken."
const CYCLE_INTERVAL_MS = 20 * 60 * 1000;

// ──────────────────────────────────────────────────────────────────
// Manifest types · mirror what umbris-core/daemon/transcript.py writes.
// ──────────────────────────────────────────────────────────────────

interface ManifestVoice {
  role: string;
  sigil: string;
  name: string;
  descriptor?: string;
  agent_id?: string;
  type: string;
  confidence: number;
  model?: string | null;
  cost_usd?: number;
  voice: string;
  timestamp?: string | null;
}

interface ManifestLatest {
  file: string;
  cycle: number;
  started_at: string;
  finished_at: string;
  status: string;
  reason: string;
  verdict: string;
  cost_usd: number;
  files_changed: string[];
  commit_hash: string | null;
  voices: ManifestVoice[];
}

interface ManifestRecent {
  file: string;
  cycle: number;
  status: string;
  started_at: string;
  verdict: string;
  // Optional · the daemon may include these on newer manifests. The
  // page degrades gracefully when they are absent.
  finished_at?: string | null;
  cost_usd?: number;
  commit_hash?: string | null;
}

interface Manifest {
  updated_at: string;
  latest: ManifestLatest;
  recent: ManifestRecent[];
}

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

function formatElapsed(startedIso: string): string {
  try {
    const started = new Date(startedIso).getTime();
    if (!Number.isFinite(started)) return "·";
    const diffSec = Math.max(0, (Date.now() - started) / 1000);
    if (diffSec < 60) return `${Math.floor(diffSec)}s`;
    if (diffSec < 3600) {
      const m = Math.floor(diffSec / 60);
      const s = Math.floor(diffSec % 60);
      return `${m}m ${s.toString().padStart(2, "0")}s`;
    }
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    return `${h}h ${m.toString().padStart(2, "0")}m`;
  } catch {
    return "·";
  }
}

function statusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === "ok" || s === "committed" || s === "shipped") return "shipped";
  if (s === "skipped") return "skipped";
  if (s === "halted" || s === "failed" || s === "error") return "failed";
  if (s === "running" || s === "in_progress" || s === "deliberating") {
    return "in deliberation";
  }
  return s || "unknown";
}

function statusColorClass(status: string): string {
  const s = statusLabel(status);
  if (s === "shipped") return "text-umbris-corona border-umbris-corona/60";
  if (s === "failed") return "text-umbris-error border-umbris-error/60";
  if (s === "in deliberation") {
    return "text-umbris-violet border-umbris-violet/60";
  }
  // skipped / unknown
  return "text-umbris-stellar border-umbris-stellar/40";
}

function isDeliberating(status: string): boolean {
  return statusLabel(status) === "in deliberation";
}

/**
 * Normalise a raw role string (which may be uppercase, lowercase, or
 * absent) to a known AgentRole, or null if we don't recognise it.
 */
function toAgentRole(raw: string | undefined | null): AgentRole | null {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper in SIGIL_UNICODE) return upper as AgentRole;
  return null;
}

function sigilFor(voice: ManifestVoice): string {
  const role = toAgentRole(voice.role);
  if (role) return SIGIL_UNICODE[role];
  return voice.sigil || "·";
}

function nameFor(voice: ManifestVoice): string {
  if (voice.name) return voice.name;
  const role = toAgentRole(voice.role);
  if (role) {
    return role.charAt(0) + role.slice(1).toLowerCase();
  }
  return voice.role || "?";
}

function descriptorFor(voice: ManifestVoice): string {
  if (voice.descriptor) return voice.descriptor;
  const role = toAgentRole(voice.role);
  if (role) return AGENT_DESCRIPTORS[role];
  return "";
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

// ──────────────────────────────────────────────────────────────────
// The page
// ──────────────────────────────────────────────────────────────────

export default function ConvocationPage() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  // When did the page itself last receive a successful fetch? Used by
  // the LIVE pill, the "fresh" flash, and the next-poll countdown ·
  // independent of manifest.updated_at (which is the daemon's write
  // time, possibly minutes old if the daemon is between cycles).
  const [lastFetchAt, setLastFetchAt] = useState<number | null>(null);
  const [freshFlash, setFreshFlash] = useState(false);
  // When the actual cycle number advances, we surface a more dramatic
  // "NEW CYCLE LANDED" banner for a few seconds · this is the moment
  // the user has been waiting for between cycles.
  const [newCycleBanner, setNewCycleBanner] = useState<number | null>(null);
  // Track the manifest digest we last saw so we can flash only when
  // genuinely new content lands.
  const lastDigestRef = useRef<string>("");
  const lastCycleRef = useRef<number>(-1);

  const fetchManifest = useCallback(async () => {
    try {
      // Cache-buster so the browser doesn't hand us a stale copy on
      // re-polls. The edge proxy also forces upstream `no-store`.
      const res = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data: Manifest = await res.json();
      setManifest(data);
      setError(null);
      setLastFetchAt(Date.now());

      // Detect new content · flash the LIVE pill briefly.
      const digest = `${data.updated_at}:${data.latest?.cycle}:${data.latest?.voices?.length}:${data.latest?.status}`;
      if (lastDigestRef.current && lastDigestRef.current !== digest) {
        setFreshFlash(true);
        // 3.2s · long enough to be unmissable, short enough to not
        // drag the eye away from the actual content.
        window.setTimeout(() => setFreshFlash(false), 3200);
      }
      lastDigestRef.current = digest;

      // Detect actual CYCLE advance (not just voice updates within a
      // cycle). When the cycle number ticks up, that's the moment a
      // new revolution has shipped · surface the big banner.
      const currentCycle = data.latest?.cycle ?? -1;
      if (
        lastCycleRef.current >= 0 &&
        currentCycle > lastCycleRef.current
      ) {
        setNewCycleBanner(currentCycle);
        // 8s · long enough to be noticed and read, short enough to
        // not block scroll.
        window.setTimeout(() => setNewCycleBanner(null), 8000);
      }
      lastCycleRef.current = currentCycle;
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + 20s poll
  useEffect(() => {
    fetchManifest();
    const id = window.setInterval(fetchManifest, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [fetchManifest]);

  // Elapsed-time clock tick · once a second
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Decide which cycle to render · the user-selected one if any, else
  // the latest from the manifest.
  const viewing = useMemo(() => {
    if (!manifest) return null;
    if (selectedCycle == null) return manifest.latest;
    if (manifest.latest.cycle === selectedCycle) return manifest.latest;
    // A historical cycle was clicked · we don't have its full voices
    // (the manifest only carries the latest in full). Show a stub.
    const stub = manifest.recent.find((r) => r.cycle === selectedCycle);
    if (!stub) return manifest.latest;
    const placeholder: ManifestLatest = {
      file: stub.file,
      cycle: stub.cycle,
      started_at: stub.started_at,
      finished_at: stub.started_at,
      status: stub.status,
      reason: stub.verdict,
      verdict: stub.verdict,
      cost_usd: 0,
      files_changed: [],
      commit_hash: null,
      voices: [],
    };
    return placeholder;
  }, [manifest, selectedCycle]);

  const isHistorical =
    manifest != null &&
    viewing != null &&
    viewing.cycle !== manifest.latest.cycle;

  return (
    <main className="min-h-screen bg-umbris-void text-umbris-lunar overflow-x-hidden">
      {/* ─── New-cycle landed banner · floats at top for 8s on advance ─ */}
      <AnimatePresence>
        {newCycleBanner != null && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          >
            <div
              className="border border-umbris-corona/70 bg-umbris-void/95 backdrop-blur-md px-5 py-3 flex items-center gap-3 shadow-[0_0_24px_rgba(255,178,89,0.20)]"
            >
              <span
                className="inline-block w-2 h-2 rounded-full bg-umbris-corona animate-umbris-heartbeat"
                aria-hidden
              />
              <span className="umbris-mono text-umbris-corona text-[11px] uppercase tracking-widest">
                new cycle landed · {String(newCycleBanner).padStart(4, "0")} ·
                voices below
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Hero ──────────────────────────────────────────────── */}
      <section className="relative w-full px-6 pt-32 pb-8 md:pt-40 md:pb-12 text-center">
        <p className="umbris-eyebrow text-umbris-violet mb-6">
          — § THE CONVOCATION · LIVE FEED —
        </p>
        <h1 className="umbris-display text-umbris-lunar text-[clamp(2.4rem,8vw,5.5rem)] leading-none mb-6">
          THE NINE SPEAK
        </h1>
        <p className="umbris-serif italic text-umbris-stellar text-base md:text-xl max-w-2xl mx-auto">
          What the convocation is saying now · streamed from the Custos
          sentinel as it deliberates.
        </p>
      </section>

      {/* ─── Cadence Notice ──────────────────────────────────────
          A prominent banner that makes the cycle rhythm explicit so the
          gap between manifest writes never reads as "the page is broken."
          The page itself polls every 20s · but the convocation only
          writes a new manifest when a cycle ships (~ every 20 minutes).
       */}
      <section className="relative mx-auto max-w-[1180px] px-6 pt-6">
        <CadenceNotice
          manifestUpdatedAt={manifest?.updated_at}
          latestFinishedAt={manifest?.latest.finished_at}
          status={manifest?.latest.status}
          now={now}
        />
      </section>

      {/* ─── Body ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-24">
        {loading && !manifest && <LoadingSkeleton />}

        {!loading && error && !manifest && <SilenceState />}

        {manifest && viewing && (
          <>
            <StatusBar
              latest={manifest.latest}
              viewing={viewing}
              isHistorical={isHistorical}
              now={now}
              updatedAt={manifest.updated_at}
              lastFetchAt={lastFetchAt}
              freshFlash={freshFlash}
              pollIntervalMs={POLL_INTERVAL_MS}
              totalCycles={Math.max(
                manifest.latest.cycle,
                manifest.recent.length,
              )}
              repoBase={REPO_BASE}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 mt-8">
              {/* The voices · main column */}
              <VoiceFeed
                voices={viewing.voices}
                cycle={viewing.cycle}
                isHistorical={isHistorical}
                verdict={viewing.verdict}
                status={viewing.status}
              />

              {/* Sidebar · every finished cycle the daemon has surfaced */}
              <RecentSidebar
                recent={manifest.recent}
                latest={manifest.latest}
                selectedCycle={viewing.cycle}
                latestCycle={manifest.latest.cycle}
                repoBase={REPO_BASE}
                onSelect={(c) =>
                  setSelectedCycle(c === manifest.latest.cycle ? null : c)
                }
              />
            </div>
          </>
        )}

        {/* ─── Foot ─────────────────────────────────────────────── */}
        <div className="mt-20 pt-10 border-t border-umbris-grey/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="umbris-mono text-umbris-stellar text-[10px] uppercase tracking-widest">
            · polled every 20s via an edge proxy · the manifest is committed
            straight to the public repo ·
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`${REPO_BASE}/tree/main/lore/revolutions/auto`}
              target="_blank"
              rel="noreferrer"
              className="umbris-mono text-umbris-violet text-[10px] uppercase tracking-widest border border-umbris-violet/60 px-4 py-2 hover:bg-umbris-violet hover:text-umbris-void transition-colors"
            >
              full transcripts →
            </a>
            <Link
              href="/now"
              className="umbris-mono text-umbris-stellar text-[10px] uppercase tracking-widest border border-umbris-grey/40 px-4 py-2 hover:border-umbris-lunar hover:text-umbris-lunar transition-colors"
            >
              the latest three →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

// ──────────────────────────────────────────────────────────────────
// Status bar
// ──────────────────────────────────────────────────────────────────

interface StatusBarProps {
  latest: ManifestLatest;
  viewing: ManifestLatest;
  isHistorical: boolean;
  now: number;
  updatedAt: string;
  lastFetchAt: number | null;
  freshFlash: boolean;
  pollIntervalMs: number;
  totalCycles: number;
  repoBase: string;
}

function StatusBar({
  latest,
  viewing,
  isHistorical,
  now,
  updatedAt,
  lastFetchAt,
  freshFlash,
  pollIntervalMs,
  totalCycles,
  repoBase,
}: StatusBarProps) {
  const label = statusLabel(viewing.status);
  const deliberating = isDeliberating(viewing.status);
  // All time-derived strings read Date.now() inside their helpers ·
  // re-rendering once a second (driven by the parent's `now` state) is
  // what makes elapsed, manifest age, and the next-poll countdown
  // tick visibly.
  const elapsed = formatElapsed(viewing.started_at);
  const nextPollSec =
    lastFetchAt != null
      ? Math.max(0, Math.ceil((lastFetchAt + pollIntervalMs - now) / 1000))
      : null;
  const fetchAgeSec =
    lastFetchAt != null ? Math.floor((now - lastFetchAt) / 1000) : null;
  // We consider the connection live if we've had a successful fetch
  // within the last 2× the poll interval. Beyond that, mark stale.
  const live =
    fetchAgeSec != null && fetchAgeSec < (pollIntervalMs / 1000) * 2;

  const commitShort = latest.commit_hash
    ? latest.commit_hash.slice(0, 7)
    : null;

  return (
    <div
      className={`border ${
        deliberating
          ? "border-umbris-violet/70 animate-umbris-breathe"
          : "border-umbris-grey/40"
      } bg-umbris-void/80 px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4`}
    >
      <div className="flex flex-wrap items-center gap-4 md:gap-6">
        <div>
          <p className="umbris-eyebrow text-umbris-stellar text-[9px] mb-1">
            cycle
          </p>
          <p
            className="umbris-display text-umbris-violet text-2xl md:text-3xl leading-none tabular-nums"
            style={{ textShadow: "0 0 16px rgba(156,123,217,0.30)" }}
          >
            {String(viewing.cycle).padStart(4, "0")}
          </p>
        </div>

        <div className="w-px h-12 bg-umbris-grey/30 hidden md:block" />

        <div>
          <p className="umbris-eyebrow text-umbris-stellar text-[9px] mb-1">
            status
          </p>
          <span
            className={`umbris-mono text-[11px] uppercase tracking-widest px-2.5 py-1 border ${statusColorClass(
              viewing.status
            )}`}
          >
            · {label} ·
          </span>
        </div>

        <div className="w-px h-12 bg-umbris-grey/30 hidden md:block" />

        <div>
          <p className="umbris-eyebrow text-umbris-stellar text-[9px] mb-1">
            elapsed
          </p>
          <p className="umbris-mono text-umbris-lunar text-sm tabular-nums">
            {elapsed}
          </p>
        </div>

        <div className="w-px h-12 bg-umbris-grey/30 hidden md:block" />

        <div>
          <p className="umbris-eyebrow text-umbris-stellar text-[9px] mb-1">
            cost · cycle
          </p>
          <p className="umbris-mono text-umbris-violet text-sm tabular-nums">
            ${(viewing.cost_usd || 0).toFixed(4)}
          </p>
        </div>

        <div className="w-px h-12 bg-umbris-grey/30 hidden md:block" />

        <div>
          <p className="umbris-eyebrow text-umbris-stellar text-[9px] mb-1">
            cycles run
          </p>
          <p className="umbris-mono text-umbris-lunar text-sm tabular-nums">
            {String(totalCycles).padStart(4, "0")}
          </p>
        </div>

        {commitShort && (
          <>
            <div className="w-px h-12 bg-umbris-grey/30 hidden md:block" />
            <div>
              <p className="umbris-eyebrow text-umbris-stellar text-[9px] mb-1">
                commit
              </p>
              <a
                href={`${repoBase}/commit/${latest.commit_hash}`}
                target="_blank"
                rel="noreferrer"
                className="umbris-mono text-umbris-corona text-sm hover:text-umbris-lunar transition-colors tabular-nums"
                title={latest.commit_hash ?? ""}
              >
                {commitShort}
              </a>
            </div>
          </>
        )}
      </div>

      <div className="text-right flex flex-col items-end gap-1.5">
        {/* LIVE pill · pulses each time fresh content lands; turns
            stellar when the connection has been silent for more than
            2× the poll interval. */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              live
                ? freshFlash
                  ? "bg-umbris-corona animate-umbris-heartbeat"
                  : "bg-umbris-violet animate-umbris-heartbeat"
                : "bg-umbris-stellar/50"
            }`}
            aria-hidden
          />
          <span
            className={`umbris-mono text-[10px] uppercase tracking-widest ${
              live
                ? freshFlash
                  ? "text-umbris-corona"
                  : "text-umbris-violet"
                : "text-umbris-stellar"
            }`}
          >
            {live ? (freshFlash ? "fresh data" : "live") : "stale · retrying"}
          </span>
          {nextPollSec != null && live && (
            <span className="umbris-mono text-umbris-grey text-[10px] uppercase tracking-widest tabular-nums">
              · next in {nextPollSec}s
            </span>
          )}
        </div>

        {isHistorical && (
          <p className="umbris-mono text-umbris-corona text-[10px] uppercase tracking-widest">
            · viewing a historical cycle ·
          </p>
        )}

        <p className="umbris-mono text-umbris-grey text-[10px] uppercase tracking-widest">
          manifest written · {formatUpdatedAt(updatedAt)}
        </p>
      </div>
    </div>
  );
}

function formatUpdatedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toISOString().replace("T", " ").slice(0, 16) + "Z";
  } catch {
    return iso;
  }
}

// ──────────────────────────────────────────────────────────────────
// Voice feed
// ──────────────────────────────────────────────────────────────────

interface VoiceFeedProps {
  voices: ManifestVoice[];
  cycle: number;
  isHistorical: boolean;
  verdict: string;
  status: string;
}

function VoiceFeed({
  voices,
  cycle,
  isHistorical,
  verdict,
  status,
}: VoiceFeedProps) {
  // Track the previous voice count for this cycle. When new voices
  // arrive on a poll, gently scroll the feed to the bottom.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prevKeyRef = useRef<string>("");

  useEffect(() => {
    const key = `${cycle}:${voices.length}`;
    if (prevKeyRef.current && prevKeyRef.current.startsWith(`${cycle}:`)) {
      const prevCount = Number(prevKeyRef.current.split(":")[1] ?? "0");
      if (voices.length > prevCount && scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }
    prevKeyRef.current = key;
  }, [voices.length, cycle]);

  if (isHistorical) {
    return (
      <div className="border border-umbris-grey/40 bg-umbris-void/80 p-8 text-center">
        <p className="umbris-eyebrow text-umbris-violet mb-4">
          · historical cycle ·
        </p>
        <p className="umbris-serif italic text-umbris-stellar text-base leading-relaxed max-w-md mx-auto mb-6">
          Only the latest cycle's voices are kept in the manifest. The full
          deliberation for this cycle is preserved in the markdown
          transcript.
        </p>
        {verdict && (
          <div className="border-l-2 border-umbris-violet/60 pl-4 text-left max-w-xl mx-auto">
            <p className="umbris-eyebrow text-umbris-violet text-[10px] mb-2">
              · the verdict that landed ·
            </p>
            <p className="umbris-serif text-umbris-lunar text-base leading-relaxed">
              {truncate(verdict, 600)}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (voices.length === 0) {
    return (
      <div className="border border-umbris-grey/40 bg-umbris-void/80 p-12 text-center">
        <p className="umbris-eyebrow text-umbris-violet mb-4">
          · the convocation has not yet spoken ·
        </p>
        <p className="umbris-serif italic text-umbris-stellar text-base">
          Waiting for the next deliberation to begin.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="border border-umbris-grey/40 bg-umbris-void/80 max-h-[640px] overflow-y-auto"
    >
      <div className="px-6 py-4 border-b border-umbris-grey/30 flex items-center justify-between sticky top-0 bg-umbris-void/95 backdrop-blur-sm z-10">
        <p className="umbris-eyebrow text-umbris-violet text-[10px]">
          · the deliberation ·
        </p>
        <p className="umbris-mono text-umbris-grey text-[10px] uppercase tracking-widest">
          {voices.length} {voices.length === 1 ? "voice" : "voices"}
        </p>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        <AnimatePresence initial={false}>
          {voices.map((v, i) => (
            <VoiceCard key={voiceKey(v, i)} voice={v} index={i} />
          ))}
        </AnimatePresence>

        {/* When the cycle is still in deliberation, leave a pulsing
            indicator at the bottom so it reads as live. */}
        {isDeliberating(status) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 pt-4 border-t border-umbris-grey/30"
          >
            <span className="inline-block w-2 h-2 bg-umbris-violet animate-umbris-heartbeat" />
            <p className="umbris-mono text-umbris-violet text-[11px] uppercase tracking-widest">
              the convocation is still speaking
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function voiceKey(v: ManifestVoice, i: number): string {
  return `${v.agent_id || v.role || "anon"}-${v.type}-${i}-${
    v.timestamp || ""
  }`;
}

// ──────────────────────────────────────────────────────────────────
// Voice card · one agent contribution
// ──────────────────────────────────────────────────────────────────

interface VoiceCardProps {
  voice: ManifestVoice;
  index: number;
}

function VoiceCard({ voice, index }: VoiceCardProps) {
  const sigil = sigilFor(voice);
  const name = nameFor(voice);
  const descriptor = descriptorFor(voice);
  const conf = Number.isFinite(voice.confidence)
    ? voice.confidence
    : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.55,
        delay: Math.min(index * 0.04, 0.4),
        ease: [0.22, 0.61, 0.36, 1],
      }}
      className="flex gap-5 md:gap-7"
    >
      <div className="flex-shrink-0 w-12 md:w-16 text-center pt-1">
        <p
          className="text-umbris-violet text-3xl md:text-5xl leading-none select-none"
          style={{ textShadow: "0 0 18px rgba(156,123,217,0.45)" }}
          aria-hidden
        >
          {sigil}
        </p>
        <p className="umbris-mono text-umbris-grey text-[9px] uppercase tracking-widest mt-2">
          {name}
        </p>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
          <h3 className="umbris-display text-umbris-lunar text-sm md:text-base tracking-widest">
            {name}
          </h3>
          {descriptor && (
            <p className="umbris-serif italic text-umbris-stellar text-xs md:text-sm">
              · {descriptor}
            </p>
          )}
        </div>

        <blockquote className="border-l border-umbris-violet/50 pl-4 md:pl-5 mb-3">
          <p className="umbris-serif text-umbris-lunar text-[1.05rem] md:text-[1.15rem] leading-relaxed">
            {voice.voice}
          </p>
        </blockquote>

        <div className="flex flex-wrap items-center gap-2">
          <Badge>{voice.type || "·"}</Badge>
          <Badge subtle>conf · {conf.toFixed(2)}</Badge>
          {voice.model && <Badge subtle>{voice.model}</Badge>}
        </div>
      </div>
    </motion.article>
  );
}

function Badge({
  children,
  subtle = false,
}: {
  children: React.ReactNode;
  subtle?: boolean;
}) {
  const cls = subtle
    ? "text-umbris-stellar border-umbris-grey/40"
    : "text-umbris-violet border-umbris-violet/50";
  return (
    <span
      className={`umbris-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border ${cls}`}
    >
      {children}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────
// Recent cycles sidebar
// ──────────────────────────────────────────────────────────────────

interface RecentSidebarProps {
  recent: ManifestRecent[];
  latest: ManifestLatest;
  selectedCycle: number;
  latestCycle: number;
  repoBase: string;
  onSelect: (cycle: number) => void;
}

function RecentSidebar({
  recent,
  latest,
  selectedCycle,
  latestCycle,
  repoBase,
  onSelect,
}: RecentSidebarProps) {
  // Merge `latest` into the list so the active cycle's commit hash +
  // cost are visible without waiting for the next manifest write.
  // Newest-first, deduped by cycle number.
  const merged: ManifestRecent[] = useMemo(() => {
    const byCycle = new Map<number, ManifestRecent>();
    for (const r of recent) {
      byCycle.set(r.cycle, r);
    }
    byCycle.set(latest.cycle, {
      file: latest.file,
      cycle: latest.cycle,
      status: latest.status,
      started_at: latest.started_at,
      verdict: latest.verdict,
      finished_at: latest.finished_at,
      cost_usd: latest.cost_usd,
      commit_hash: latest.commit_hash,
    });
    return Array.from(byCycle.values()).sort((a, b) => b.cycle - a.cycle);
  }, [recent, latest]);

  const finishedCount = merged.filter(
    (r) => !isDeliberating(r.status),
  ).length;

  return (
    <aside className="border border-umbris-grey/40 bg-umbris-void/80 p-5 h-fit lg:sticky lg:top-24">
      <div className="flex items-center justify-between mb-4">
        <p className="umbris-eyebrow text-umbris-violet text-[10px]">
          · the cycle log ·
        </p>
        <span className="umbris-mono text-umbris-stellar text-[9px] uppercase tracking-widest tabular-nums">
          {finishedCount} finished
        </span>
      </div>

      {merged.length === 0 ? (
        <p className="umbris-serif italic text-umbris-grey text-xs">
          no cycles yet · the convocation has not yet stirred
        </p>
      ) : (
        <ul className="space-y-2 max-h-[640px] overflow-y-auto pr-1 -mr-1">
          {merged.map((r) => {
            const active = r.cycle === selectedCycle;
            const isLatest = r.cycle === latestCycle;
            const deliberating = isDeliberating(r.status);
            const shortHash = r.commit_hash
              ? r.commit_hash.slice(0, 7)
              : null;
            return (
              <li key={r.cycle}>
                <div
                  className={`border transition-colors ${
                    active
                      ? "border-umbris-violet/70 bg-umbris-violet/[0.06]"
                      : "border-umbris-grey/30 hover:border-umbris-lunar/50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(r.cycle)}
                    className="w-full text-left px-3 pt-2.5 pb-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`umbris-mono text-[11px] tabular-nums ${
                          active
                            ? "text-umbris-violet"
                            : "text-umbris-lunar"
                        }`}
                      >
                        cycle {String(r.cycle).padStart(4, "0")}
                      </span>
                      {isLatest && (
                        <span
                          className={`umbris-mono text-[8px] uppercase tracking-widest ${
                            deliberating
                              ? "text-umbris-violet animate-umbris-heartbeat"
                              : "text-umbris-corona"
                          }`}
                        >
                          · {deliberating ? "live" : "latest"}
                        </span>
                      )}
                    </div>
                    <span
                      className={`umbris-mono text-[9px] uppercase tracking-widest ${
                        active
                          ? "text-umbris-violet"
                          : statusColorTextClass(r.status)
                      }`}
                    >
                      · {statusLabel(r.status)} ·
                    </span>
                    {r.verdict && (
                      <p className="umbris-serif italic text-umbris-stellar text-[11px] leading-snug mt-1.5 line-clamp-2">
                        {truncate(r.verdict, 90)}
                      </p>
                    )}
                    {(typeof r.cost_usd === "number" || r.finished_at) && (
                      <p className="umbris-mono text-umbris-grey text-[9px] uppercase tracking-widest mt-1.5 tabular-nums">
                        {typeof r.cost_usd === "number" && (
                          <>· ${r.cost_usd.toFixed(4)} </>
                        )}
                        {r.finished_at && (
                          <>· {formatShortDate(r.finished_at)} </>
                        )}
                      </p>
                    )}
                  </button>

                  {/* Commit / file links · only shown if the daemon
                      surfaced them. */}
                  {(shortHash || r.file) && (
                    <div className="px-3 pb-2.5 flex flex-wrap items-center gap-3">
                      {shortHash && (
                        <a
                          href={`${repoBase}/commit/${r.commit_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="umbris-mono text-umbris-corona text-[9px] uppercase tracking-widest hover:text-umbris-lunar transition-colors tabular-nums"
                          title={r.commit_hash ?? ""}
                        >
                          ↳ {shortHash}
                        </a>
                      )}
                      {r.file && (
                        <a
                          href={`${repoBase}/blob/main/${r.file}`}
                          target="_blank"
                          rel="noreferrer"
                          className="umbris-mono text-umbris-stellar text-[9px] uppercase tracking-widest hover:text-umbris-lunar transition-colors"
                        >
                          transcript →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

// Helpers used by the sidebar · separated so the main component stays
// readable. `statusColorTextClass` is the text-only variant of
// `statusColorClass` (no border classes).
function statusColorTextClass(status: string): string {
  const s = statusLabel(status);
  if (s === "shipped") return "text-umbris-corona";
  if (s === "failed") return "text-umbris-error";
  if (s === "in deliberation") return "text-umbris-violet";
  return "text-umbris-stellar";
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    // YYYY-MM-DD HH:MM (UTC)
    return d.toISOString().replace("T", " ").slice(0, 16);
  } catch {
    return iso;
  }
}

// ──────────────────────────────────────────────────────────────────
// Loading + error states
// ──────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="border border-umbris-grey/30 bg-umbris-void/60 px-6 py-5 flex gap-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-2 w-16 bg-umbris-grey/30 animate-umbris-breathe" />
            <div className="h-6 w-24 bg-umbris-grey/30 animate-umbris-breathe" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        <div className="border border-umbris-grey/30 bg-umbris-void/60 p-8 space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-6">
              <div className="w-12 h-12 bg-umbris-grey/30 animate-umbris-breathe" />
              <div className="flex-1 space-y-3">
                <div className="h-3 w-32 bg-umbris-grey/30 animate-umbris-breathe" />
                <div className="h-4 w-full bg-umbris-grey/20 animate-umbris-breathe" />
                <div className="h-4 w-3/4 bg-umbris-grey/20 animate-umbris-breathe" />
              </div>
            </div>
          ))}
        </div>
        <div className="border border-umbris-grey/30 bg-umbris-void/60 p-5 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 bg-umbris-grey/20 animate-umbris-breathe"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Cadence notice · explicit visible explanation of when the page updates.
// Lives directly under the hero so first-time viewers understand the
// rhythm before they wonder why nothing seems to be moving.
// ──────────────────────────────────────────────────────────────────

interface CadenceNoticeProps {
  manifestUpdatedAt: string | undefined;
  latestFinishedAt: string | null | undefined;
  status: string | undefined;
  now: number;
}

function CadenceNotice({
  manifestUpdatedAt,
  latestFinishedAt,
  status,
  now,
}: CadenceNoticeProps) {
  const deliberating = status ? isDeliberating(status) : false;

  // Estimate when the next cycle should land. Anchor on whichever of
  // (last finished_at, manifest updated_at) is most recent, plus the
  // 20-minute interval.
  const anchorIso = latestFinishedAt || manifestUpdatedAt;
  let nextCycleAt: number | null = null;
  if (anchorIso) {
    const anchorMs = new Date(anchorIso).getTime();
    if (Number.isFinite(anchorMs)) {
      nextCycleAt = anchorMs + CYCLE_INTERVAL_MS;
    }
  }

  let countdown: string;
  let countdownTone: "violet" | "corona" | "stellar" = "violet";
  if (deliberating) {
    countdown = "deliberating now · voices arriving";
    countdownTone = "corona";
  } else if (nextCycleAt == null) {
    countdown = "awaiting first cycle";
    countdownTone = "stellar";
  } else {
    const diffMs = nextCycleAt - now;
    if (diffMs <= 0) {
      const lateMin = Math.floor(-diffMs / 60_000);
      if (lateMin < 1) {
        countdown = "the next cycle is due any moment";
        countdownTone = "corona";
      } else {
        countdown = `next cycle is overdue by ${lateMin}m · likely deliberating now`;
        countdownTone = "corona";
      }
    } else {
      const totalSec = Math.ceil(diffMs / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      if (m >= 1) {
        countdown = `next cycle expected in ~${m}m ${s.toString().padStart(2, "0")}s`;
      } else {
        countdown = `next cycle expected in ~${s}s`;
      }
      countdownTone = "violet";
    }
  }

  const toneClass =
    countdownTone === "corona"
      ? "text-umbris-corona"
      : countdownTone === "stellar"
        ? "text-umbris-stellar"
        : "text-umbris-violet";

  return (
    <div
      className={`relative border ${
        deliberating
          ? "border-umbris-corona/60 animate-umbris-breathe"
          : "border-umbris-violet/40"
      } bg-umbris-void/70 px-5 py-4 md:px-7 md:py-5`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-start gap-3 md:gap-4">
          <span
            className="text-umbris-violet text-xl md:text-2xl leading-none select-none mt-0.5"
            style={{ textShadow: "0 0 14px rgba(156,123,217,0.45)" }}
            aria-hidden
          >
            ⬤
          </span>
          <div>
            <p className="umbris-eyebrow text-umbris-violet text-[10px] mb-1">
              · this page is alive ·
            </p>
            <p className="umbris-serif text-umbris-lunar text-[0.95rem] md:text-base leading-snug">
              The convocation completes one cycle every{" "}
              <span className="umbris-mono text-umbris-violet">~20 minutes</span>{" "}
              · each cycle brings new voices, a new verdict, and a new commit to
              the public repo. This page auto-refreshes every{" "}
              <span className="umbris-mono text-umbris-violet">20 seconds</span>{" "}
              · when a new cycle ships, the cycle counter advances, fresh voices
              stream into the column below, and the{" "}
              <span className="umbris-mono text-umbris-violet">LIVE</span> pill
              flashes <span className="text-umbris-corona">corona</span>.
            </p>
          </div>
        </div>
        <div className="md:text-right shrink-0">
          <p className="umbris-eyebrow text-umbris-stellar text-[9px] mb-1">
            next cycle
          </p>
          <p
            className={`umbris-mono text-[11px] uppercase tracking-widest tabular-nums ${toneClass}`}
          >
            · {countdown} ·
          </p>
        </div>
      </div>
    </div>
  );
}

function SilenceState() {
  return (
    <div className="border border-umbris-grey/40 bg-umbris-void/60 p-16 text-center">
      <p
        className="text-umbris-violet text-5xl mb-6 select-none"
        style={{ textShadow: "0 0 24px rgba(156,123,217,0.35)" }}
        aria-hidden
      >
        ⬤
      </p>
      <p className="umbris-eyebrow text-umbris-violet mb-4">
        · the convocation is silent ·
      </p>
      <p className="umbris-serif italic text-umbris-stellar text-base md:text-lg max-w-md mx-auto leading-relaxed">
        No manifest could be loaded from the substrate. The Custos sentinel
        may be between cycles · check back in twenty minutes.
      </p>
      <a
        href={`${REPO_BASE}/tree/main/lore/revolutions/auto`}
        target="_blank"
        rel="noreferrer"
        className="inline-block mt-8 umbris-mono text-umbris-violet text-[10px] uppercase tracking-widest border border-umbris-violet/60 px-4 py-2 hover:bg-umbris-violet hover:text-umbris-void transition-colors"
      >
        the raw archive →
      </a>
    </div>
  );
}
