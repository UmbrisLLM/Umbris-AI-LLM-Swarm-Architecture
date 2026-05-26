interface DividerProps {
  className?: string;
  width?: string;
  color?: string;
  ornament?: boolean;
}

/**
 * Hairline divider with optional rotated-square ornament at centre.
 * Used between major page sections in the UMBRIS register.
 */
export function Divider({
  className,
  width = "240px",
  color = "var(--umbris-grey)",
  ornament = true,
}: DividerProps) {
  return (
    <div
      className={`flex items-center justify-center gap-3 select-none ${className ?? ""}`}
      aria-hidden
    >
      <span className="block h-px" style={{ width, backgroundColor: color }} />
      {ornament && (
        <span
          className="inline-block h-1.5 w-1.5 rotate-45"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="block h-px" style={{ width, backgroundColor: color }} />
    </div>
  );
}
