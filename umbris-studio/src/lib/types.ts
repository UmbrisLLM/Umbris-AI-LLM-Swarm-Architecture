/**
 * Shared types for the UMBRIS Studio frontend.
 *
 * Matches the JSON shapes returned by:
 *   · umbris-core/src/umbris/server/app.py (REST + SSE)
 *   · umbris-core/src/umbris/blackboard.py (Record, RecordType)
 *   · umbris-core/src/umbris/custos/log.py (CycleEvent)
 */

import type { AgentRole } from "@umbris/design";

// ─── Engine ────────────────────────────────────────────────────────

export interface EngineStatusPayload {
  ready: boolean;
  port: number | null;
  base_url: string | null;
  error: string | null;
}

export interface ServerStatus {
  provider: string;
  models: Record<"worker" | "scout" | "judge" | "verifier", string>;
  spent_usd: number;
  version: string;
}

// ─── Composer ──────────────────────────────────────────────────────

export type ConvocationMode = "STANDARD" | "DEEP" | "RAPID";

export type PresetId =
  | "deep-research"
  | "strategic-analysis"
  | "code-audit"
  | "whitepaper-review"
  | "market-intelligence"
  | "custom";

/**
 * The wire payload sent to `POST /api/query`. The server field name
 * remains `colony_mode` for cross-brand compatibility with the
 * inherited opus-core surface; only the TS-side identifiers take the
 * UMBRIS register.
 */
export interface RunInput {
  query: string;
  budget_usd: number;
  constraints?: string;
  colony_mode?: ConvocationMode;
  research_depth?: number;
  time_cap_hours?: number;
  sources_lock?: boolean;
  preset_id?: PresetId;
}

// ─── Runs ──────────────────────────────────────────────────────────

export type RunPhase =
  | "IDLE"
  | "QUERY_POSED"
  | "CONVOCATION_ASSEMBLED"
  | "RESEARCH_INITIATED"
  | "SYNTHESIS_IN_PROGRESS"
  | "VERIFICATION_PENDING"
  | "VERDICT_PENDING"
  | "VERDICT_READY"
  | "FAILED"
  | "CANCELLED";

export interface RecordPayload {
  id: string;
  agent_id: string;
  agent_role: string;     // raw enum string from server: "umbra" | "mercurius" | "venus" ...
  type: string;           // RecordType.value
  content: unknown;       // string | dict
  confidence: number;
  model: string | null;
  cost_estimate: number;
  timestamp: string | null;
  running_cost_usd: number;
}

export interface CompletePayload {
  accepted: boolean;
  answer: unknown;
  confidence: number;
  cost_usd: number;
  wall_seconds: number;
  total_records: number;
  provider: string;
}

export interface Verdict {
  accepted: boolean;
  answer: string;
  limitations?: string;
  confidence: number;
  costUsd: number;
  wallSec: number;
  totalRecords: number;
}

export interface RecentQuery {
  runId: string;
  query: string;          // truncated to 80 chars for display
  timestamp: string;      // ISO
  status: "verified" | "best-remaining" | "failed" | "cancelled";
  costUsd: number;
}

// ─── Custos ────────────────────────────────────────────────────────

export type CustosStatus = "stopped" | "starting" | "idle" | "cycling";

export interface CycleEvent {
  cycle: number;
  started_at: string;
  finished_at: string;
  wall_seconds: number;
  status: "shipped" | "skipped" | "failed" | "halted";
  reason: string;
  observations_count: number;
  verdict_summary: string | null;
  files_changed: string[];
  commit_hash: string | null;
  cost_usd: number;
}

export interface CustosStateSnapshot {
  status: CustosStatus;
  cycles_completed: number;
  last_event: CycleEvent | null;
  today_spent_usd: number;
  history?: CycleEvent[];
}

// ─── Mapping helpers ───────────────────────────────────────────────

/** Map a raw server agent_role string to the typed AgentRole enum. */
export function normalizeAgentRole(raw: string): AgentRole | null {
  const upper = raw.toUpperCase();
  const valid: AgentRole[] = [
    "MERCURIUS", "VENUS", "MARS", "SOL",
    "IUPPITER", "SATURNUS", "LUNA", "STELLA", "UMBRA",
  ];
  return valid.includes(upper as AgentRole) ? (upper as AgentRole) : null;
}
