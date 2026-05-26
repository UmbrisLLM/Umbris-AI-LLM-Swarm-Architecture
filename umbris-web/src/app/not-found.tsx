import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-umbris-void text-umbris-lunar flex flex-col items-center justify-center px-6 text-center">
      <p className="umbris-eyebrow text-umbris-violet mb-6">
        — § VISIO NON INVENTA · MMXXVI —
      </p>
      <h1 className="umbris-display text-umbris-lunar text-[clamp(3rem,8vw,5rem)] leading-none mb-6">
        404
      </h1>
      <p className="umbris-serif italic text-umbris-stellar text-lg max-w-md mx-auto mb-10">
        The shadow you sought has not yet been cast. The convocation has no
        record of this path.
      </p>
      <Link
        href="/"
        className="umbris-mono text-umbris-violet text-xs uppercase tracking-widest border border-umbris-violet/60 px-5 py-2.5 hover:bg-umbris-violet hover:text-umbris-void transition-colors"
      >
        return to the eclipse
      </Link>
    </main>
  );
}
