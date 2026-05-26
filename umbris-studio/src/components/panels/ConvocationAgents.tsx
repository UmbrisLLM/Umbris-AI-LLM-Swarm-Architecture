"use client";

import {
  AGENT_ROLES,
  AGENT_DESCRIPTORS,
  type AgentRole,
} from "@umbris/design";
import { Sigil } from "@umbris/design/sigils";

interface ConvocationAgentsProps {
  activeAgents?: ReadonlySet<AgentRole>;
  pendingAgents?: ReadonlySet<AgentRole>;
  doneAgents?: ReadonlySet<AgentRole>;
  onAgentClick?: (agent: AgentRole) => void;
}

export function ConvocationAgents({
  activeAgents = new Set(),
  pendingAgents = new Set(),
  doneAgents = new Set(),
  onAgentClick,
}: ConvocationAgentsProps) {
  const activeCount = activeAgents.size;
  return (
    <section className="umbris-panel p-4">
      <header className="flex items-center justify-between mb-3">
        <span className="umbris-eyebrow">CONVOCATION AGENTS</span>
        <span className="umbris-mono text-umbris-violet text-[10px] tracking-widest">
          {activeCount} ACTIVE
        </span>
      </header>
      <ul className="flex flex-col">
        {AGENT_ROLES.map((role) => {
          const isActive = activeAgents.has(role);
          const isPending = pendingAgents.has(role);
          const isDone = doneAgents.has(role);

          let status: "active" | "pending" | "done" | "idle";
          if (isActive) status = "active";
          else if (isPending) status = "pending";
          else if (isDone) status = "done";
          else status = "idle";

          return (
            <li key={role}>
              <button
                type="button"
                onClick={onAgentClick ? () => onAgentClick(role) : undefined}
                className="flex w-full items-center gap-3 py-1.5 px-2 text-left transition-colors hover:bg-umbris-violet/5 border-b border-umbris-grey/15 last:border-0"
              >
                <span
                  className={`flex-shrink-0 ${
                    status === "active" ? "text-umbris-violet" : "text-umbris-grey"
                  }`}
                >
                  <Sigil role={role} size={20} strokeWidth={1.2} />
                </span>
                <span className="umbris-display text-[11px] tracking-widest text-umbris-lunar w-24">
                  {role}
                </span>
                <span className="umbris-serif italic text-[12px] text-umbris-stellar flex-1">
                  {AGENT_DESCRIPTORS[role]}
                </span>
                <StatusBadge status={status} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function StatusBadge({
  status,
}: {
  status: "active" | "pending" | "done" | "idle";
}) {
  if (status === "active") {
    return (
      <div className="flex items-center gap-2">
        <span className="umbris-mono text-umbris-violet text-[10px] tracking-widest">
          ACTIVE
        </span>
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-umbris-violet opacity-60 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-umbris-violet" />
        </span>
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="flex items-center gap-2">
        <span className="umbris-mono text-umbris-grey text-[10px] tracking-widest">
          PENDING
        </span>
        <span className="inline-flex h-1.5 w-1.5 rounded-full border border-umbris-grey" />
      </div>
    );
  }
  if (status === "done") {
    return (
      <div className="flex items-center gap-2">
        <span className="umbris-mono text-umbris-stellar text-[10px] tracking-widest">
          DONE
        </span>
        <span className="umbris-mono text-umbris-stellar text-[12px] leading-none">✓</span>
      </div>
    );
  }
  return (
    <span className="umbris-mono text-umbris-grey text-[10px] tracking-widest">
      IDLE
    </span>
  );
}
