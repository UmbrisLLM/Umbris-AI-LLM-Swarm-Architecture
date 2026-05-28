import Link from "next/link";
import { Divider } from "./ui/Divider";

// Secondary pages · top nav was trimmed to keep the Convocation CTA the
// undisputed centre. The full set lives here so they're reachable from
// every page without cluttering the bar.
const FOOTER_NAV = [
  { label: "Manifesto",       href: "/manifesto" },
  { label: "Compositione",    href: "/compositione" },
  { label: "Triplici Minimo", href: "/triplici-minimo" },
  { label: "Now",             href: "/now" },
  { label: "Convocation",     href: "/convocation" },
] as const;

export function Footer() {
  return (
    <footer className="relative w-full bg-umbris-void px-5 sm:px-6 pt-16 pb-12">
      <div className="mx-auto max-w-4xl">
        <Divider width="80px" className="mb-10 mx-auto" />

        {/* Secondary nav · the scrolls, reachable from every page */}
        <nav
          aria-label="Site sections"
          className="mb-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-8"
        >
          {FOOTER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="umbris-mono text-[11px] uppercase tracking-widest text-umbris-stellar hover:text-umbris-lunar transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture"
            target="_blank"
            rel="noreferrer"
            className="umbris-mono text-[11px] uppercase tracking-widest text-umbris-violet hover:text-umbris-lunar transition-colors"
          >
            GitHub →
          </a>
        </nav>

        <div className="text-center">
          {/* Tiny Eclipse sigil · pitch-black disc, violet corona, one warm flash at 1 o'clock */}
          <div className="flex justify-center mb-4">
            <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
              <circle cx="17" cy="17" r="15" fill="none" stroke="var(--umbris-violet)" strokeWidth="1" />
              <circle cx="17" cy="17" r="12" fill="var(--umbris-void)" stroke="var(--umbris-violet)" strokeWidth="0.4" strokeOpacity="0.6" />
              {(() => {
                const angle = (Math.PI / 180) * -60;
                const x = 17 + Math.cos(angle) * 15;
                const y = 17 + Math.sin(angle) * 15;
                return <circle cx={x} cy={y} r="1.6" fill="#FAE6B0" />;
              })()}
            </svg>
          </div>

          <p className="umbris-display text-umbris-lunar text-base sm:text-lg tracking-widest mb-2">
            UMBRIS — ARS&nbsp;MEMORIAE
          </p>
          <p className="umbris-mono text-umbris-grey text-[10px] sm:text-xs uppercase tracking-widest">
            Magnum&nbsp;Opus · MMXXVI
          </p>
        </div>
      </div>
    </footer>
  );
}
