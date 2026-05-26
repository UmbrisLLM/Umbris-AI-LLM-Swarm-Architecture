"use client";

import { useState } from "react";
import {
  IconHub,
  IconConnections,
  IconDocs,
  IconRevolutions,
  IconData,
  IconMetrics,
  IconSettings,
  IconAccount,
} from "@umbris/design/rail-icons";

type RouteKey =
  | "hub"
  | "connections"
  | "docs"
  | "revolutions"
  | "data"
  | "metrics"
  | "settings"
  | "account";

const ITEMS: ReadonlyArray<{
  key: RouteKey;
  label: string;
  Icon: typeof IconHub;
}> = [
  { key: "hub",         label: "HUB",         Icon: IconHub },
  { key: "connections", label: "CONNECTIONS", Icon: IconConnections },
  { key: "docs",        label: "DOCS",        Icon: IconDocs },
  { key: "revolutions", label: "REVOLUTIONS", Icon: IconRevolutions },
  { key: "data",        label: "DATA",        Icon: IconData },
  { key: "metrics",     label: "METRICS",     Icon: IconMetrics },
  { key: "settings",    label: "SETTINGS",    Icon: IconSettings },
];

export function LeftRail() {
  const [active, setActive] = useState<RouteKey>("hub");
  const [hovered, setHovered] = useState<RouteKey | null>(null);

  return (
    <nav
      className="flex h-full w-16 flex-col items-center justify-between border-r border-umbris-grey/30 bg-umbris-void py-6"
      aria-label="Studio navigation"
    >
      {/* ── Primary group ────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1">
        {ITEMS.map(({ key, label, Icon }) => {
          const isActive = active === key;
          const isHovered = hovered === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              className="group relative flex h-11 w-11 items-center justify-center transition-colors duration-150"
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              {/* active left-edge marker */}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute -left-3 top-2 bottom-2 w-[2px] bg-umbris-violet"
                />
              )}
              <Icon
                className={
                  isActive
                    ? "text-umbris-violet"
                    : isHovered
                      ? "text-umbris-lunar"
                      : "text-umbris-grey"
                }
              />
              {isHovered && (
                <span
                  aria-hidden
                  className="absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-sm border border-umbris-violet/40 bg-umbris-void/95 px-2 py-1 text-[10px] tracking-widest text-umbris-violet umbris-mono uppercase"
                >
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Account (bottom) ────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setActive("account")}
        onMouseEnter={() => setHovered("account")}
        onMouseLeave={() => setHovered(null)}
        className="group relative flex h-11 w-11 items-center justify-center transition-colors duration-150"
        aria-label="ACCOUNT"
        aria-current={active === "account" ? "page" : undefined}
      >
        {active === "account" && (
          <span
            aria-hidden
            className="absolute -left-3 top-2 bottom-2 w-[2px] bg-umbris-violet"
          />
        )}
        <IconAccount
          className={
            active === "account"
              ? "text-umbris-violet"
              : hovered === "account"
                ? "text-umbris-lunar"
                : "text-umbris-grey"
          }
        />
        {hovered === "account" && (
          <span
            aria-hidden
            className="absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-sm border border-umbris-violet/40 bg-umbris-void/95 px-2 py-1 text-[10px] tracking-widest text-umbris-violet umbris-mono uppercase"
          >
            ACCOUNT
          </span>
        )}
      </button>
    </nav>
  );
}
