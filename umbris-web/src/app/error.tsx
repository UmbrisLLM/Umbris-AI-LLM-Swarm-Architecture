"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-umbris-void text-umbris-lunar flex flex-col items-center justify-center px-6 text-center">
      <p className="umbris-eyebrow text-umbris-violet mb-6">
        — § SATURNUS FALSIFICAVIT · MMXXVI —
      </p>
      <h1 className="umbris-display text-umbris-lunar text-[clamp(3rem,8vw,5rem)] leading-none mb-6">
        Vision Refused
      </h1>
      <p className="umbris-serif italic text-umbris-stellar text-lg max-w-md mx-auto mb-3">
        Saturnus surfaced a falsification. The convocation will re-deliberate.
      </p>
      {error.digest && (
        <p className="umbris-mono text-umbris-grey text-[10px] uppercase tracking-widest mb-10">
          digest · {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="umbris-mono text-umbris-violet text-xs uppercase tracking-widest border border-umbris-violet/60 px-5 py-2.5 hover:bg-umbris-violet hover:text-umbris-void transition-colors"
      >
        cast the question again
      </button>
    </main>
  );
}
