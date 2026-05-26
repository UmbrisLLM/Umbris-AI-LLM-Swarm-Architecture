/**
 * Corner brackets · the framing motif from the UMBRIS broadside.
 * Wraps any children with four engraved L-shaped marks at the corners.
 */

import clsx from "clsx";

interface OrnamentProps {
  children?: React.ReactNode;
  size?: number; // px length of each bracket arm
  inset?: number; // px inset from the edges
  color?: string; // CSS color
  className?: string;
}

export function Ornament({
  children,
  size = 28,
  inset = 16,
  color = "var(--umbris-lunar)",
  className,
}: OrnamentProps) {
  const armStyle = {
    backgroundColor: color,
    width: `${size}px`,
    height: "1px",
  } as const;
  const stemStyle = {
    backgroundColor: color,
    width: "1px",
    height: `${size}px`,
  } as const;

  return (
    <div className={clsx("relative", className)}>
      {/* top-left */}
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{ top: inset, left: inset }}
      >
        <span className="absolute" style={armStyle} />
        <span className="absolute" style={stemStyle} />
      </span>
      {/* top-right */}
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{ top: inset, right: inset }}
      >
        <span className="absolute right-0" style={armStyle} />
        <span className="absolute right-0" style={stemStyle} />
      </span>
      {/* bottom-left */}
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{ bottom: inset, left: inset }}
      >
        <span className="absolute bottom-0" style={armStyle} />
        <span className="absolute bottom-0" style={stemStyle} />
      </span>
      {/* bottom-right */}
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{ bottom: inset, right: inset }}
      >
        <span className="absolute bottom-0 right-0" style={armStyle} />
        <span className="absolute bottom-0 right-0" style={stemStyle} />
      </span>
      {children}
    </div>
  );
}
