"use client";

/**
 * useEngineStore · the Python sidecar's lifecycle from the frontend's POV.
 */

import { create } from "zustand";
import { engineStatus, engineBoot } from "@/lib/tauri";

interface EngineState {
  status: "booting" | "ready" | "crashed";
  port: number | null;
  baseUrl: string | null;
  error: string | null;
  init: () => Promise<void>;
}

export const useEngineStore = create<EngineState>((set, get) => ({
  status: "booting",
  port: null,
  baseUrl: null,
  error: null,
  init: async () => {
    // Poll engine_status until ready (or fail after ~25s).
    const startedAt = Date.now();
    const TIMEOUT_MS = 25_000;
    while (Date.now() - startedAt < TIMEOUT_MS) {
      try {
        const s = await engineStatus();
        if (s.ready && s.base_url) {
          set({
            status: "ready",
            port: s.port,
            baseUrl: s.base_url,
            error: null,
          });
          return;
        }
      } catch (e) {
        // ignore individual failures; we retry
      }
      // Force-boot once after the first second so the sidecar starts.
      if (Date.now() - startedAt > 1000 && get().status === "booting") {
        try {
          await engineBoot();
        } catch (e) {
          // surfaced below
        }
      }
      await sleep(500);
    }
    set({
      status: "crashed",
      error: "the convocation did not respond. Is `umbris serve` reachable?",
    });
  },
}));

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
