"use client";

import { useCustosStore } from "@/store/useCustosStore";

export function BottomBar() {
  const status = useCustosStore((s) => s.status);
  const cyclesCompleted = useCustosStore((s) => s.cyclesCompleted);
  const todaySpent = useCustosStore((s) => s.todaySpentUsd);
  const start = useCustosStore((s) => s.start);
  const stop = useCustosStore((s) => s.stop);
  const error = useCustosStore((s) => s.error);

  const isActive = status === "idle" || status === "cycling";
  const isCycling = status === "cycling";
  const isStarting = status === "starting";
  const isStopped = status === "stopped";

  // Mock wallet for now (Phase 2B will wire to real Solana RPC).
  const walletAddress = "0x7A3F4D8C9E1B2F5A6D8E0F1A2B3C4D5E6F7A8C2B";
  const umbrisBalance = 1247.83;
  const truncated = `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;

  return (
    <footer
      className="grid w-full items-center border-t border-umbris-grey/30 bg-umbris-void px-6"
      style={{
        gridTemplateColumns: "260px 240px 160px 1fr 56px",
        height: "72px",
      }}
    >
      {/* 1 · Custos status */}
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={`relative inline-flex h-2 w-2 ${isActive ? "" : "opacity-40"}`}
        >
          {isCycling && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-umbris-violet opacity-60 animate-ping" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              isActive ? "bg-umbris-violet" : "bg-umbris-grey"
            }`}
          />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="umbris-display text-umbris-lunar text-[12px] tracking-widest">
            UMBRIS CUSTOS
          </span>
          <div className="flex items-center gap-3 mt-0.5">
            <span
              className={`umbris-display text-[10px] tracking-widest ${
                isCycling
                  ? "text-umbris-violet"
                  : isActive
                    ? "text-umbris-stellar"
                    : isStarting
                      ? "text-umbris-violet"
                      : "text-umbris-grey"
              }`}
            >
              {isStarting ? "STARTING…" : isCycling ? "CYCLING" : isActive ? "IDLE" : "STOPPED"}
            </span>
            <span className="umbris-mono text-umbris-grey text-[9px]">
              {cyclesCompleted > 0 ? `${cyclesCompleted} CYCLES · $${todaySpent.toFixed(2)} TODAY` : "v1.1.0"}
            </span>
          </div>
        </div>
      </div>

      {/* 2 · START THE CUSTOS */}
      <button
        type="button"
        onClick={isActive ? stop : start}
        disabled={isStarting}
        className={`mx-3 h-12 border transition-colors duration-150 ${
          isActive
            ? "border-umbris-stellar/60 text-umbris-stellar hover:border-umbris-stellar"
            : "border-umbris-violet/60 text-umbris-violet hover:bg-umbris-violet/5 hover:shadow-[0_0_24px_rgba(156,123,217,0.18)]"
        } disabled:opacity-50`}
        aria-label={isActive ? "Pause the Custos" : "Start the Custos"}
      >
        <span className="flex items-center justify-center gap-3">
          <span className="umbris-display text-[13px] tracking-widest">
            {isActive ? "PAUSE THE CUSTOS" : "START THE CUSTOS"}
          </span>
          <span aria-hidden className="text-base leading-none">
            {isActive ? "▮▮" : "▷"}
          </span>
        </span>
      </button>

      {/* 3 · STOP */}
      <button
        type="button"
        disabled={!isActive}
        onClick={stop}
        className={`mr-3 h-12 border transition-colors duration-150 ${
          isActive
            ? "border-umbris-stellar/60 text-umbris-stellar hover:border-umbris-lunar hover:text-umbris-lunar"
            : "border-umbris-grey/30 text-umbris-grey cursor-not-allowed"
        }`}
        aria-label="Stop"
      >
        <span className="flex items-center justify-center gap-3">
          <span className="umbris-display text-[13px] tracking-widest">STOP</span>
          <span aria-hidden className="text-base leading-none">■</span>
        </span>
      </button>

      {/* 4 · Wallet */}
      <div className="flex items-center justify-end gap-6">
        {error && (
          <span className="umbris-mono text-umbris-error text-[10px] tracking-widest max-w-[200px] truncate">
            {error}
          </span>
        )}
        <div className="flex flex-col leading-tight">
          <span className="umbris-eyebrow">WALLET</span>
          <span className="umbris-mono text-umbris-lunar text-[12px] mt-1">
            {truncated}
          </span>
        </div>
        <div className="flex flex-col leading-tight items-end">
          <span className="umbris-eyebrow">BALANCE</span>
          <span className="umbris-mono text-umbris-violet text-[14px] mt-1 tabular-nums">
            {umbrisBalance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {/* 5 · trailing ornament */}
      <div className="flex items-center justify-end text-umbris-violet/60">
        <svg
          width={36}
          height={36}
          viewBox="0 0 56 56"
          fill="none"
          stroke="currentColor"
          strokeWidth={0.8}
          aria-hidden
        >
          <circle cx="28" cy="28" r="18" opacity="0.55" />
          <circle cx="28" cy="28" r="12" opacity="0.35" />
          <path d="M28 6 L28 50" opacity="0.4" />
          <path d="M6 28 L50 28" opacity="0.4" />
          <circle cx="28" cy="28" r="1.8" fill="currentColor" stroke="none" />
        </svg>
      </div>
    </footer>
  );
}
