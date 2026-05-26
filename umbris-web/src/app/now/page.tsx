import type { Metadata } from "next";
import Link from "next/link";
import { Divider } from "@/components/ui/Divider";
import {
  CONVOCATION_NOW,
  REPO_BASE,
  type Revolution,
} from "@/data/convocationNow";

export const metadata: Metadata = {
  title: "UMBRIS · The Convocation Now",
  description:
    "The three latest revolutions the convocation has surfaced. Updated every two hours by the Custos sentinel.",
};

export default function NowPage() {
  return (
    <main className="min-h-screen bg-umbris-void text-umbris-lunar overflow-x-hidden">
      {/* ─── Hero ──────────────────────────────────────────────── */}
      <section className="relative w-full px-6 pt-32 pb-12 md:pt-40 md:pb-16 text-center">
        <p className="umbris-eyebrow text-umbris-violet mb-6">
          — § THE CONVOCATION NOW · MMXXVI —
        </p>
        <h1 className="umbris-display text-umbris-lunar text-[clamp(2.4rem,8vw,5.5rem)] leading-none mb-8">
          THE LATEST THREE
        </h1>
        <p className="umbris-serif italic text-umbris-stellar text-base md:text-xl max-w-2xl mx-auto">
          What the convocation has cast, is casting, and is preparing to cast.
        </p>
      </section>

      <section className="mx-auto max-w-[860px] px-6 pb-20">
        <div className="border-l-2 border-umbris-violet pl-6 md:pl-8 py-3 mb-16">
          <p className="umbris-serif text-umbris-lunar text-[1.05rem] md:text-[1.1rem] leading-relaxed mb-3">
            This page surfaces only the convocation's three most recent revolutions. When a fourth lands, the oldest steps off. Every shipped entry carries a real commit hash. Every in-progress entry names the window in which it will be decided.
          </p>
          <p className="umbris-serif italic text-umbris-violet text-base md:text-lg leading-snug">
            The page is provable, not decorative.
          </p>
        </div>

        <Divider width="80px" color="var(--umbris-violet)" className="mb-12" />

        <div className="space-y-10">
          {CONVOCATION_NOW.map((revolution, index) => (
            <RevolutionCard
              key={revolution.numeral}
              revolution={revolution}
              isLatest={index === 0}
            />
          ))}
        </div>

        <Divider width="120px" color="var(--umbris-violet)" className="my-20" />

        <div className="text-center space-y-6">
          <p className="umbris-serif italic text-umbris-stellar text-base md:text-lg max-w-xl mx-auto">
            When v1.1 lands, the Custos sentinel will write this page every two hours · the convocation's pulse, in public.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href={`${REPO_BASE}/tree/main/lore/revolutions`}
              target="_blank"
              rel="noreferrer"
              className="umbris-mono text-umbris-violet text-xs uppercase tracking-widest border border-umbris-violet/60 px-5 py-2.5 hover:bg-umbris-violet hover:text-umbris-void transition-colors"
            >
              the full revolutions log →
            </a>
            <Link
              href="/compositione"
              className="umbris-mono text-umbris-stellar text-xs uppercase tracking-widest border border-umbris-grey/40 px-5 py-2.5 hover:border-umbris-lunar hover:text-umbris-lunar transition-colors"
            >
              the doctrine of how
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function RevolutionCard({
  revolution,
  isLatest,
}: {
  revolution: Revolution;
  isLatest: boolean;
}) {
  const shipped = revolution.status === "shipped";

  return (
    <article
      className={`relative border ${
        isLatest
          ? "border-umbris-violet/60 bg-umbris-violet/[0.025]"
          : "border-umbris-grey/40"
      } p-7 md:p-9`}
    >
      {isLatest && (
        <div className="absolute -top-3 left-7 bg-umbris-void px-2">
          <span className="umbris-mono text-umbris-violet text-[10px] uppercase tracking-widest">
            · the most recent ·
          </span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-start md:gap-8">
        {/* Numeral */}
        <div className="md:w-32 md:flex-shrink-0 mb-4 md:mb-0">
          <p
            className="umbris-display text-umbris-violet text-[3rem] md:text-[4rem] leading-none"
            style={{ textShadow: "0 0 24px rgba(156,123,217,0.25)" }}
          >
            {revolution.numeral}
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <StatusBadge shipped={shipped} />
            <span className="umbris-mono text-umbris-grey text-[10px] uppercase tracking-widest">
              · {revolution.date}
            </span>
          </div>

          <h2 className="umbris-display text-umbris-lunar text-[1.35rem] md:text-[1.6rem] leading-tight mb-4">
            {revolution.title}
          </h2>

          <p className="umbris-serif text-umbris-lunar text-[1.05rem] leading-relaxed mb-6">
            {revolution.description}
          </p>

          {revolution.candidates && revolution.candidates.length > 0 && (
            <div className="border-l border-umbris-violet/50 pl-5 mb-6 space-y-3">
              <p className="umbris-eyebrow text-umbris-violet text-[10px] tracking-widest">
                — IMAGINES UNDER DELIBERATION —
              </p>
              {revolution.candidates.map((candidate, i) => (
                <div key={i}>
                  <p className="umbris-display text-umbris-lunar text-sm tracking-widest mb-1">
                    {candidate.label}
                  </p>
                  <p className="umbris-serif italic text-umbris-stellar text-sm leading-snug">
                    {candidate.thesis}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-umbris-grey/30">
            {shipped && revolution.commitHash && (
              <a
                href={`${REPO_BASE}/commit/${revolution.commitHash}`}
                target="_blank"
                rel="noreferrer"
                className="umbris-mono text-umbris-violet text-[11px] uppercase tracking-widest hover:underline underline-offset-2"
              >
                commit · {revolution.commitHash}
              </a>
            )}
            {revolution.decideIn && (
              <span className="umbris-mono text-umbris-stellar text-[11px] uppercase tracking-widest">
                decides in · {revolution.decideIn}
              </span>
            )}
            {revolution.loreRef && (
              <a
                href={`${REPO_BASE}/blob/main/${revolution.loreRef}`}
                target="_blank"
                rel="noreferrer"
                className="umbris-mono text-umbris-grey text-[11px] uppercase tracking-widest hover:text-umbris-lunar"
              >
                lore · {revolution.loreRef.replace("lore/revolutions/", "")}
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ shipped }: { shipped: boolean }) {
  return (
    <span
      className={`umbris-mono text-[10px] uppercase tracking-widest px-2.5 py-1 border ${
        shipped
          ? "text-umbris-corona border-umbris-corona/60"
          : "text-umbris-violet border-umbris-violet/60"
      }`}
    >
      · {shipped ? "shipped · verified" : "in deliberation"} ·
    </span>
  );
}
