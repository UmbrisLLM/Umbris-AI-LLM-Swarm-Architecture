/**
 * Tauri command wrappers.
 *
 * Thin typed shims around `tauri.invoke` so the rest of the codebase
 * never touches the raw IPC bridge.
 */

import { invoke } from "@tauri-apps/api/core";
import type { EngineStatusPayload } from "./types";

/** Safe to call from browser dev mode (no Tauri): returns a stub. */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

// ─── Engine ────────────────────────────────────────────────────────

export async function engineStatus(): Promise<EngineStatusPayload> {
  if (!isTauri()) {
    // Browser dev fallback: assume sidecar runs on the default port 8000
    // so devs can launch `umbris serve --port 8000` in another terminal.
    return {
      ready: true,
      port: 8000,
      base_url: "http://127.0.0.1:8000",
      error: null,
    };
  }
  return invoke<EngineStatusPayload>("engine_status");
}

export async function engineBoot(): Promise<number> {
  if (!isTauri()) return 8000;
  return invoke<number>("engine_boot");
}

export async function studioPing(): Promise<string> {
  if (!isTauri()) return "the convocation hears you. (dev mode)";
  return invoke<string>("studio_ping");
}
