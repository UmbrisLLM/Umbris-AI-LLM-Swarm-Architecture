"use client";

import { create } from "zustand";
import type { AgentRole } from "@umbris/design";
import { subscribeToRun } from "@/lib/sse";
import type {
  CompletePayload,
  RecordPayload,
  RunInput,
  RunPhase,
  Verdict,
} from "@/lib/types";
import { normalizeAgentRole } from "@/lib/types";
import { useEngineStore } from "./useEngineStore";

const ALL_AGENTS: AgentRole[] = [
  "MERCURIUS", "VENUS", "MARS", "SOL",
  "IUPPITER", "SATURNUS", "LUNA", "STELLA", "UMBRA",
];

const PHASE_ORDER: RunPhase[] = [
  "QUERY_POSED",
  "CONVOCATION_ASSEMBLED",
  "RESEARCH_INITIATED",
  "SYNTHESIS_IN_PROGRESS",
  "VERIFICATION_PENDING",
  "VERDICT_PENDING",
];

interface RunMetrics {
  tokensConsumed: number;
  consensusPct: number;
  estCompletionSec: number;
  costUsd: number;
  wallSec: number;
  convocationHealth: "OPTIMAL" | "DEGRADED" | "STRAINED";
}

interface RunState {
  runId: string | null;
  phase: RunPhase;
  phaseTimestamps: Partial<Record<RunPhase, string>>;
  activeAgents: Set<AgentRole>;
  pendingAgents: Set<AgentRole>;
  doneAgents: Set<AgentRole>;
  records: RecordPayload[];
  verdict: Verdict | null;
  error: string | null;
  metrics: RunMetrics;
  startedAtMs: number | null;
  _unsubscribe: (() => void) | null;
  _agentTimers: Map<AgentRole, number>;

  startRun: (input: RunInput) => Promise<void>;
  cancelRun: () => void;
  reset: () => void;
}

function zeroMetrics(): RunMetrics {
  return {
    tokensConsumed: 0,
    consensusPct: 0,
    estCompletionSec: 0,
    costUsd: 0,
    wallSec: 0,
    convocationHealth: "OPTIMAL",
  };
}

export const useRunStore = create<RunState>((set, get) => ({
  runId: null,
  phase: "IDLE",
  phaseTimestamps: {},
  activeAgents: new Set(),
  pendingAgents: new Set(),
  doneAgents: new Set(),
  records: [],
  verdict: null,
  error: null,
  metrics: zeroMetrics(),
  startedAtMs: null,
  _unsubscribe: null,
  _agentTimers: new Map(),

  startRun: async (input) => {
    // Tear down any previous run.
    get()._unsubscribe?.();
    get()._agentTimers.forEach((id) => window.clearTimeout(id));

    const baseUrl = useEngineStore.getState().baseUrl;
    if (!baseUrl) {
      set({ phase: "FAILED", error: "Engine is not ready." });
      return;
    }

    const nowIso = new Date().toISOString();
    set({
      runId: null,
      phase: "QUERY_POSED",
      phaseTimestamps: { QUERY_POSED: nowIso },
      activeAgents: new Set(),
      pendingAgents: new Set(ALL_AGENTS),
      doneAgents: new Set(),
      records: [],
      verdict: null,
      error: null,
      metrics: zeroMetrics(),
      startedAtMs: Date.now(),
      _unsubscribe: null,
      _agentTimers: new Map(),
    });

    let runId: string;
    try {
      const res = await fetch(`${baseUrl}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`server returned ${res.status}`);
      const data = await res.json();
      runId = data.run_id;
    } catch (e: any) {
      set({
        phase: "FAILED",
        error: `Could not reach the convocation: ${e?.message ?? e}`,
      });
      return;
    }

    set({
      runId,
      phase: "CONVOCATION_ASSEMBLED",
      phaseTimestamps: {
        ...get().phaseTimestamps,
        CONVOCATION_ASSEMBLED: new Date().toISOString(),
      },
    });

    const unsub = subscribeToRun(baseUrl, runId, {
      onPhase: (p) => handleServerPhase(p, set, get),
      onRecord: (r) => handleRecord(r, set, get),
      onComplete: (c) => handleComplete(c, set, get),
      onError: (e) => {
        const msg = e.message ?? "unknown error";
        set({ phase: "FAILED", error: msg });
      },
    });
    set({ _unsubscribe: unsub });
  },

  cancelRun: () => {
    get()._unsubscribe?.();
    get()._agentTimers.forEach((id) => window.clearTimeout(id));
    set({
      phase: "CANCELLED",
      _unsubscribe: null,
      _agentTimers: new Map(),
    });
  },

  reset: () => {
    get()._unsubscribe?.();
    get()._agentTimers.forEach((id) => window.clearTimeout(id));
    set({
      runId: null,
      phase: "IDLE",
      phaseTimestamps: {},
      activeAgents: new Set(),
      pendingAgents: new Set(),
      doneAgents: new Set(),
      records: [],
      verdict: null,
      error: null,
      metrics: zeroMetrics(),
      startedAtMs: null,
      _unsubscribe: null,
      _agentTimers: new Map(),
    });
  },
}));

// ─── Event handlers ──────────────────────────────────────────────

function handleServerPhase(
  payload: { phase: string },
  set: (s: Partial<RunState>) => void,
  get: () => RunState,
) {
  // The server emits phase="deliberating" once at start. We don't
  // override our local phase machine from this; the record stream
  // tells us more precise transitions.
}

function handleRecord(
  rec: RecordPayload,
  set: (s: Partial<RunState>) => void,
  get: () => RunState,
) {
  const state = get();
  const newRecords = [...state.records, rec];

  // Active agent pulse
  const role = normalizeAgentRole(rec.agent_role);
  const activeAgents = new Set(state.activeAgents);
  const pendingAgents = new Set(state.pendingAgents);
  const doneAgents = new Set(state.doneAgents);
  const timers = new Map(state._agentTimers);

  if (role) {
    activeAgents.add(role);
    pendingAgents.delete(role);
    // Reset any existing timer for this agent.
    const existing = timers.get(role);
    if (existing !== undefined) window.clearTimeout(existing);
    const tid = window.setTimeout(() => {
      const cur = useRunStore.getState();
      const aa = new Set(cur.activeAgents);
      aa.delete(role);
      const da = new Set(cur.doneAgents);
      da.add(role);
      const tm = new Map(cur._agentTimers);
      tm.delete(role);
      set({ activeAgents: aa, doneAgents: da, _agentTimers: tm });
    }, 1500);
    timers.set(role, tid);
  }

  // Phase derivation from record stream.
  // UMBRIS-core RecordType values: observation, hypothesis, critique,
  // synthesis, plan, action, verdict.accepted, verdict.falsified,
  // verdict.budget_exhausted, provenance.summary.
  let phase = state.phase;
  const ph = { ...state.phaseTimestamps };
  if (rec.type === "observation" && phase === "CONVOCATION_ASSEMBLED") {
    phase = "RESEARCH_INITIATED";
    ph.RESEARCH_INITIATED = new Date().toISOString();
  } else if (rec.type === "synthesis" && advancePast(phase, "SYNTHESIS_IN_PROGRESS")) {
    phase = "SYNTHESIS_IN_PROGRESS";
    ph.SYNTHESIS_IN_PROGRESS = new Date().toISOString();
  } else if (rec.type === "critique" && advancePast(phase, "VERIFICATION_PENDING")) {
    phase = "VERIFICATION_PENDING";
    ph.VERIFICATION_PENDING = new Date().toISOString();
  } else if (
    (rec.type === "verdict.accepted" ||
      rec.type === "verdict.falsified" ||
      rec.type === "verdict.budget_exhausted") &&
    advancePast(phase, "VERDICT_PENDING")
  ) {
    phase = "VERDICT_PENDING";
    ph.VERDICT_PENDING = new Date().toISOString();
  }

  // Metrics
  const tokensConsumed = newRecords.reduce(
    (acc, r) => acc + estimateTokens(r),
    0,
  );
  const expectedRecords = 18; // ballpark for STANDARD mode; refined later
  const consensusPct = Math.min(
    100,
    Math.round((newRecords.length / expectedRecords) * 100),
  );
  const wallSec = state.startedAtMs
    ? (Date.now() - state.startedAtMs) / 1000
    : 0;
  const estCompletionSec =
    consensusPct > 5 ? (wallSec / consensusPct) * (100 - consensusPct) : 0;
  const costUsd = rec.running_cost_usd ?? state.metrics.costUsd;
  const convocationHealth: RunMetrics["convocationHealth"] = state.error
    ? "STRAINED"
    : "OPTIMAL";

  set({
    records: newRecords,
    activeAgents,
    pendingAgents,
    doneAgents,
    _agentTimers: timers,
    phase,
    phaseTimestamps: ph,
    metrics: {
      tokensConsumed,
      consensusPct,
      estCompletionSec,
      costUsd,
      wallSec,
      convocationHealth,
    },
  });
}

function handleComplete(
  payload: CompletePayload,
  set: (s: Partial<RunState>) => void,
  get: () => RunState,
) {
  const state = get();
  const wallSec = state.startedAtMs
    ? (Date.now() - state.startedAtMs) / 1000
    : payload.wall_seconds;
  const verdict: Verdict = {
    accepted: payload.accepted,
    answer: extractAnswer(payload.answer),
    limitations: extractLimitations(payload.answer),
    confidence: payload.confidence,
    costUsd: payload.cost_usd,
    wallSec,
    totalRecords: payload.total_records,
  };
  set({
    phase: "VERDICT_READY",
    verdict,
    metrics: {
      ...state.metrics,
      consensusPct: 100,
      estCompletionSec: 0,
      costUsd: payload.cost_usd,
      wallSec,
    },
    phaseTimestamps: {
      ...state.phaseTimestamps,
      VERDICT_PENDING:
        state.phaseTimestamps.VERDICT_PENDING ?? new Date().toISOString(),
    },
  });
}

// ─── Helpers ─────────────────────────────────────────────────────

function advancePast(current: RunPhase, candidate: RunPhase): boolean {
  return PHASE_ORDER.indexOf(candidate) > PHASE_ORDER.indexOf(current);
}

function estimateTokens(rec: RecordPayload): number {
  // Approximate token count from the record content. Server doesn't
  // currently emit token usage per record in the SSE payload, so we
  // approximate as 4 chars per token.
  const len =
    typeof rec.content === "string"
      ? rec.content.length
      : JSON.stringify(rec.content || "").length;
  return Math.round(len / 4);
}

function extractAnswer(answer: unknown): string {
  if (typeof answer === "string") return answer;
  if (answer && typeof answer === "object" && "answer" in answer) {
    return String((answer as any).answer);
  }
  return String(answer ?? "");
}

function extractLimitations(answer: unknown): string | undefined {
  if (
    answer &&
    typeof answer === "object" &&
    "limitations" in answer &&
    (answer as any).limitations
  ) {
    return String((answer as any).limitations);
  }
  return undefined;
}
