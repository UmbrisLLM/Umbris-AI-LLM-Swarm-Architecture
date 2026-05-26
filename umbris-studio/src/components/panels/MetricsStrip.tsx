"use client";

interface MetricsStripProps {
  convocationHealth?: "OPTIMAL" | "DEGRADED" | "STRAINED";
  consensusPct?: number;
  tokensConsumed?: string;
  estCompletion?: string;
}

export function MetricsStrip({
  convocationHealth = "OPTIMAL",
  consensusPct = 47,
  tokensConsumed = "1.24M",
  estCompletion = "2H 47M",
}: MetricsStripProps) {
  const healthColor =
    convocationHealth === "OPTIMAL"
      ? "text-umbris-violet"
      : convocationHealth === "DEGRADED"
        ? "text-umbris-stellar"
        : "text-umbris-error";

  return (
    <section className="umbris-panel grid grid-cols-4 divide-x divide-umbris-grey/30">
      <Metric label="CONVOCATION HEALTH" value={convocationHealth} valueClass={healthColor} />
      <Metric label="CONSENSUS PROGRESS" value={`${consensusPct}%`} valueClass="text-umbris-violet" />
      <Metric label="TOKENS CONSUMED" value={tokensConsumed} valueClass="text-umbris-violet" />
      <Metric label="EST. COMPLETION" value={estCompletion} valueClass="text-umbris-violet" />
    </section>
  );
}

function Metric({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-3 px-4 gap-1">
      <span className="umbris-eyebrow text-[9.5px]">{label}</span>
      <span className={`umbris-display text-[14px] tracking-widest ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}
