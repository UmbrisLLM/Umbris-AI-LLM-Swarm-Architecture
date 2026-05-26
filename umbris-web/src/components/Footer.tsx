import { Divider } from "./ui/Divider";

export function Footer() {
  return (
    <footer className="relative w-full bg-umbris-void px-6 pt-16 pb-12">
      <div className="mx-auto max-w-4xl text-center">
        <Divider width="80px" className="mb-8" />

        {/* Tiny Eclipse sigil · pitch-black disc, violet corona, one warm flash at 1 o'clock */}
        <div className="flex justify-center mb-4">
          <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
            {/* Corona ring */}
            <circle cx="17" cy="17" r="15" fill="none" stroke="var(--umbris-violet)" strokeWidth="1" />
            {/* Eclipsed body */}
            <circle cx="17" cy="17" r="12" fill="var(--umbris-void)" stroke="var(--umbris-violet)" strokeWidth="0.4" strokeOpacity="0.6" />
            {/* Warm flash at 1 o'clock */}
            {(() => {
              const angle = (Math.PI / 180) * -60;
              const x = 17 + Math.cos(angle) * 15;
              const y = 17 + Math.sin(angle) * 15;
              return <circle cx={x} cy={y} r="1.6" fill="#FAE6B0" />;
            })()}
          </svg>
        </div>

        <p className="umbris-display text-umbris-lunar text-lg tracking-widest mb-2">
          UMBRIS — ARS&nbsp;MEMORIAE
        </p>
        <p className="umbris-mono text-umbris-grey text-xs uppercase tracking-widest">
          Magnum&nbsp;Opus · MMXXVI
        </p>
      </div>
    </footer>
  );
}
