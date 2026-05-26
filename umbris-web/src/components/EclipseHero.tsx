/**
 * EclipseHero · the central visual of the homepage.
 *
 * SVG-rendered brand mark · pure black umbra ringed by a cosmic violet
 * corona, ringed in turn by a fainter outer orbit. Mathematically
 * precise, NOT hand-drawn. Subtle diamond-ring flash at one o'clock.
 *
 * Sized via the `size` prop; defaults to 360. Pure SVG, no animation
 * in v1.0 (the Studio's ColonyOrb gets the animation).
 */

interface EclipseHeroProps {
  size?: number;
  className?: string;
}

export function EclipseHero({ size = 360, className }: EclipseHeroProps) {
  return (
    <div className={`relative select-none ${className ?? ""}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 360 360" width={size} height={size} className="absolute inset-0">
        <defs>
          <radialGradient id="eclipse-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(156,123,217,0.22)" />
            <stop offset="55%" stopColor="rgba(156,123,217,0.06)" />
            <stop offset="100%" stopColor="rgba(156,123,217,0)" />
          </radialGradient>
          <linearGradient id="diamond-ring" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"  stopColor="rgba(156,123,217,1)" />
            <stop offset="50%" stopColor="rgba(250,230,176,1)" />
            <stop offset="100%" stopColor="rgba(156,123,217,1)" />
          </linearGradient>
        </defs>

        {/* Soft outer halo behind everything */}
        <circle cx="180" cy="180" r="170" fill="url(#eclipse-halo)" />

        {/* Outer dashed orbit hint */}
        <circle
          cx="180" cy="180" r="155"
          fill="none"
          stroke="#9C7BD9"
          strokeWidth="0.5"
          strokeOpacity="0.25"
          strokeDasharray="3 3"
        />

        {/* The corona ring · cosmic violet */}
        <circle
          cx="180" cy="180" r="105"
          fill="none"
          stroke="#9C7BD9"
          strokeWidth="2.5"
          strokeOpacity="0.85"
        />

        {/* Fine inscribed markings on the corona ring · 12 tick marks */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
          const r1 = 102;
          const r2 = 108;
          const x1 = 180 + r1 * Math.cos(angle);
          const y1 = 180 + r1 * Math.sin(angle);
          const x2 = 180 + r2 * Math.cos(angle);
          const y2 = 180 + r2 * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#DCDEE7"
              strokeWidth="0.5"
              strokeOpacity="0.45"
            />
          );
        })}

        {/* The diamond-ring flash · upper right of corona */}
        <path
          d="M 245 130 A 105 105 0 0 1 268 198"
          fill="none"
          stroke="url(#diamond-ring)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />

        {/* The umbra · pure black disc */}
        <circle cx="180" cy="180" r="100" fill="#000000" />
        <circle
          cx="180" cy="180" r="100"
          fill="none"
          stroke="#000000"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
}
