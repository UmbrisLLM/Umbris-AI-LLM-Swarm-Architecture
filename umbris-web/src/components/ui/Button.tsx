import clsx from "clsx";
import Link from "next/link";

interface ButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "violet";
  className?: string;
  external?: boolean;
}

export function Button({
  href,
  onClick,
  children,
  variant = "primary",
  className,
  external = false,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center px-6 py-3 umbris-mono text-xs uppercase tracking-widest transition-all duration-300 border";

  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "border-umbris-lunar text-umbris-lunar hover:bg-umbris-lunar hover:text-umbris-void",
    ghost:
      "border-umbris-grey text-umbris-stellar hover:border-umbris-lunar hover:text-umbris-lunar",
    violet:
      "border-umbris-violet text-umbris-violet hover:bg-umbris-violet hover:text-umbris-void",
  };

  const classes = clsx(base, variants[variant], className);

  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
