"use client";

import { create } from "zustand";
import type { CycleEvent, CustosStateSnapshot, CustosStatus } from "@/lib/types";
import { useEngineStore } from "./useEngineStore";

interface CustosState {
  status: CustosStatus;
  cyclesCompleted: number;
  recentCycles: CycleEvent[];
  todaySpentUsd: number;
  costCapPerCycleUsd: number;
  costCapPerDayUsd: number;
  intervalSeconds: number;
  gates: { tests: boolean; build: boolean; commit: boolean };
  error: string | null;

  setInterval: (seconds: number) => void;
  setCostCapPerCycle: (n: number) => void;
  setCostCapPerDay: (n: number) => void;
  setGate: (gate: keyof CustosState["gates"], v: boolean) => void;

  start: () => Promise<void>;
  stop: () => Promise<void>;
  refresh: () => Promise<void>;
  _pollHandle: number | null;
  _startPolling: () => void;
  _stopPolling: () => void;
}

export const useCustosStore = create<CustosState>((set, get) => ({
  status: "stopped",
  cyclesCompleted: 0,
  recentCycles: [],
  todaySpentUsd: 0,
  costCapPerCycleUsd: 5,
  costCapPerDayUsd: 50,
  intervalSeconds: 7200,
  gates: { tests: true, build: true, commit: false },
  error: null,
  _pollHandle: null,

  setInterval: (s) => set({ intervalSeconds: Math.max(60, s) }),
  setCostCapPerCycle: (n) => set({ costCapPerCycleUsd: n }),
  setCostCapPerDay: (n) => set({ costCapPerDayUsd: n }),
  setGate: (gate, v) =>
    set((state) => ({ gates: { ...state.gates, [gate]: v } })),

  start: async () => {
    const baseUrl = useEngineStore.getState().baseUrl;
    if (!baseUrl) {
      set({ error: "engine not ready" });
      return;
    }
    set({ status: "starting", error: null });

    const s = get();
    const config = {
      interval: `${s.intervalSeconds}`,
      cost_cap_per_cycle_usd: s.costCapPerCycleUsd,
      cost_cap_per_day_usd: s.costCapPerDayUsd,
      commit_and_push: s.gates.commit,
      run_tests: s.gates.tests,
      run_build_when_web_touched: s.gates.build,
    };

    try {
      // wire path stays `/api/daemon/*` for umbris-core server compatibility
      const res = await fetch(`${baseUrl}/api/daemon/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ reason: res.statusText }));
        throw new Error(err.reason || `HTTP ${res.status}`);
      }
      set({ status: "idle" });
      get()._startPolling();
    } catch (e: any) {
      set({ status: "stopped", error: e?.message ?? String(e) });
    }
  },

  stop: async () => {
    const baseUrl = useEngineStore.getState().baseUrl;
    if (!baseUrl) return;
    try {
      await fetch(`${baseUrl}/api/daemon/stop`, { method: "POST" });
    } catch (e: any) {
      console.error("[umbris-studio] custos stop failed", e);
    }
    get()._stopPolling();
    set({ status: "stopped" });
  },

  refresh: async () => {
    const baseUrl = useEngineStore.getState().baseUrl;
    if (!baseUrl) return;
    try {
      const res = await fetch(`${baseUrl}/api/daemon/state`);
      if (!res.ok) return;
      const data: CustosStateSnapshot = await res.json();
      set({
        status: data.status,
        cyclesCompleted: data.cycles_completed,
        recentCycles: data.history ?? get().recentCycles,
        todaySpentUsd: data.today_spent_usd,
      });
    } catch (e) {
      // silent: polling failures shouldn't surface
    }
  },

  _startPolling: () => {
    if (get()._pollHandle !== null) return;
    const tick = async () => {
      await get().refresh();
    };
    tick();
    const handle = window.setInterval(tick, 5000);
    set({ _pollHandle: handle });
  },

  _stopPolling: () => {
    const h = get()._pollHandle;
    if (h !== null) window.clearInterval(h);
    set({ _pollHandle: null });
  },
}));
