"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ITEMS = [
  { label: "Manifesto",        href: "/manifesto" },
  { label: "Compositione",     href: "/compositione" },
  { label: "Triplici Minimo",  href: "/triplici-minimo" },
  { label: "Convocation",      href: "/convocation" },
  { label: "Now",              href: "/now" },
] as const;

export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 px-8 py-5 transition-colors duration-300 ${
        scrolled ? "bg-umbris-void/85 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between max-w-[1440px] mx-auto">
        <Link
          href="/"
          className="umbris-display text-umbris-lunar text-sm tracking-widest"
        >
          UMBRIS
        </Link>
        <div className="flex items-center gap-7">
          {ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`umbris-mono text-[11px] uppercase tracking-widest transition-colors duration-150 ${
                  active
                    ? "text-umbris-violet"
                    : "text-umbris-stellar hover:text-umbris-lunar"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <a
            href="https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture"
            target="_blank"
            rel="noreferrer"
            className="umbris-mono text-[11px] uppercase tracking-widest text-umbris-violet border border-umbris-violet/60 px-3 py-1.5 hover:bg-umbris-violet hover:text-umbris-void transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}
