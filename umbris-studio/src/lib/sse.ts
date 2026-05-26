/**
 * Server-Sent Events subscription for UMBRIS Studio.
 *
 * Wraps the browser EventSource API with typed handlers for the four
 * event types `/api/stream/{run_id}` emits.
 */

import type { CompletePayload, RecordPayload } from "./types";

export interface SSEHandlers {
  onPhase?: (payload: { phase: string; label?: string }) => void;
  onRecord?: (payload: RecordPayload) => void;
  onComplete?: (payload: CompletePayload) => void;
  onError?: (payload: { message?: string }) => void;
}

export function subscribeToRun(
  baseUrl: string,
  runId: string,
  handlers: SSEHandlers,
): () => void {
  const url = `${baseUrl}/api/stream/${runId}`;
  const es = new EventSource(url);
  let receivedComplete = false;
  let userClosed = false;

  es.addEventListener("phase", (e) => {
    try {
      handlers.onPhase?.(JSON.parse((e as MessageEvent).data));
    } catch (err) {
      console.error("[umbris-studio] phase parse error", err);
    }
  });

  es.addEventListener("record", (e) => {
    try {
      handlers.onRecord?.(JSON.parse((e as MessageEvent).data));
    } catch (err) {
      console.error("[umbris-studio] record parse error", err);
    }
  });

  es.addEventListener("complete", (e) => {
    receivedComplete = true;
    try {
      handlers.onComplete?.(JSON.parse((e as MessageEvent).data));
    } catch (err) {
      console.error("[umbris-studio] complete parse error", err);
    } finally {
      userClosed = true;
      es.close();
    }
  });

  es.onerror = (e: Event) => {
    const msg = e as MessageEvent;
    // eslint-disable-next-line no-console
    console.warn("[umbris-studio sse] onerror", {
      receivedComplete,
      userClosed,
      readyState: es.readyState,
      hasData: !!msg.data,
      data: msg.data,
    });
    if (receivedComplete || userClosed) return;
    if (msg.data) {
      // Server-emitted error event with payload.
      const payload = safeParse(String(msg.data));
      handlers.onError?.(payload);
      userClosed = true;
      es.close();
      return;
    }
    // Native error path. EventSource auto-retries when in CONNECTING.
    if (es.readyState === EventSource.CLOSED) {
      handlers.onError?.({ message: "stream closed unexpectedly" });
    }
  };

  // Server-emitted `event: error\ndata: {...}` (from app.py's _sse_event("error", ...))
  // collides with the native `error` event on EventSource. The standard
  // way to receive it is via addEventListener('error') with `data` set.
  // We patch the native-error handler above to read data when present.
  // Belt-and-braces: also listen for a named "server_error" event in case
  // we add one server-side later.
  es.addEventListener("server_error", (e: Event) => {
    receivedComplete = true; // halt retries
    try {
      handlers.onError?.(JSON.parse((e as MessageEvent).data));
    } catch (err) {
      console.error("[umbris-studio] server_error parse", err);
    } finally {
      userClosed = true;
      es.close();
    }
  });

  return () => {
    userClosed = true;
    es.close();
  };
}

function safeParse(s: string): { message: string } {
  try {
    return JSON.parse(s);
  } catch {
    return { message: s };
  }
}
