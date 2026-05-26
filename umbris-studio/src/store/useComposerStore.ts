"use client";

import { create } from "zustand";
import type { ConvocationMode, PresetId, RunInput } from "@/lib/types";

interface ComposerState {
  query: string;
  constraints: string;
  preset: PresetId | null;
  convocationMode: ConvocationMode;
  researchDepth: 1 | 2 | 3 | 4 | 5;
  costCapUsd: number;
  timeCapHours: number;
  sourcesLock: boolean;

  setQuery: (q: string) => void;
  setConstraints: (s: string) => void;
  setConvocationMode: (m: ConvocationMode) => void;
  setResearchDepth: (n: 1 | 2 | 3 | 4 | 5) => void;
  setCostCap: (n: number) => void;
  setTimeCap: (n: number) => void;
  setSourcesLock: (b: boolean) => void;
  applyPreset: (id: PresetId) => void;
  toRunInput: () => RunInput;
  reset: () => void;
}

const PRESETS: Record<PresetId, Partial<ComposerState> & { promptPrefix?: string }> = {
  "deep-research": {
    convocationMode: "DEEP",
    researchDepth: 4,
    costCapUsd: 50,
    timeCapHours: 8,
    sourcesLock: false,
    promptPrefix:
      "Conduct a deep, multi-source investigation into the following. Surface contradictions. Cite explicitly. Do not skip falsification:\n\n",
  },
  "strategic-analysis": {
    convocationMode: "DEEP",
    researchDepth: 3,
    costCapUsd: 25,
    timeCapHours: 4,
    sourcesLock: false,
    promptPrefix:
      "Provide a rigorous strategic analysis of the following. Identify trade-offs. Steelman opposing views before recommending:\n\n",
  },
  "code-audit": {
    convocationMode: "STANDARD",
    researchDepth: 3,
    costCapUsd: 15,
    timeCapHours: 2,
    sourcesLock: true,
    promptPrefix:
      "Audit the following code or system. Flag correctness bugs first, security issues second, style last:\n\n",
  },
  "whitepaper-review": {
    convocationMode: "STANDARD",
    researchDepth: 3,
    costCapUsd: 20,
    timeCapHours: 3,
    sourcesLock: false,
    promptPrefix:
      "Review the following whitepaper or technical document. Surface unstated assumptions, weak claims, missing falsifications, and the strongest critique you can muster before complimenting it:\n\n",
  },
  "market-intelligence": {
    convocationMode: "RAPID",
    researchDepth: 2,
    costCapUsd: 8,
    timeCapHours: 1,
    sourcesLock: false,
    promptPrefix:
      "Surface the highest-leverage market-relevant signals about the following. Speed matters more than exhaustiveness:\n\n",
  },
  custom: {},
};

const INITIAL = {
  query: "",
  constraints: "",
  preset: null as PresetId | null,
  convocationMode: "STANDARD" as ConvocationMode,
  researchDepth: 3 as 1 | 2 | 3 | 4 | 5,
  costCapUsd: 5,
  timeCapHours: 1,
  sourcesLock: false,
};

export const useComposerStore = create<ComposerState>((set, get) => ({
  ...INITIAL,

  setQuery: (q) => set({ query: q.slice(0, 4000) }),
  setConstraints: (s) => set({ constraints: s.slice(0, 1000) }),
  setConvocationMode: (m) => set({ convocationMode: m }),
  setResearchDepth: (n) => set({ researchDepth: n }),
  setCostCap: (n) => set({ costCapUsd: Math.max(0.1, Math.min(500, n)) }),
  setTimeCap: (n) => set({ timeCapHours: Math.max(0.1, Math.min(24, n)) }),
  setSourcesLock: (b) => set({ sourcesLock: b }),

  applyPreset: (id) => {
    const cfg = PRESETS[id];
    const current = get();
    set({
      preset: id,
      convocationMode: cfg.convocationMode ?? current.convocationMode,
      researchDepth: cfg.researchDepth ?? current.researchDepth,
      costCapUsd: cfg.costCapUsd ?? current.costCapUsd,
      timeCapHours: cfg.timeCapHours ?? current.timeCapHours,
      sourcesLock: cfg.sourcesLock ?? current.sourcesLock,
      // Only prepend prefix if the user hasn't typed anything yet.
      query:
        current.query.trim().length === 0 && cfg.promptPrefix
          ? cfg.promptPrefix
          : current.query,
    });
  },

  toRunInput: () => {
    const s = get();
    return {
      query: s.query.trim(),
      budget_usd: s.costCapUsd,
      constraints: s.constraints.trim() || undefined,
      // wire field stays `colony_mode` for umbris-core server compatibility
      colony_mode: s.convocationMode,
      research_depth: s.researchDepth,
      time_cap_hours: s.timeCapHours,
      sources_lock: s.sourcesLock || undefined,
      preset_id: s.preset || undefined,
    };
  },

  reset: () => set(INITIAL),
}));
