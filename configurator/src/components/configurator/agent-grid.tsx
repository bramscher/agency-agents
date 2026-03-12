"use client";

import { AgentCard } from "@/components/configurator/agent-card";
import type { Agent } from "@/types/agent";

interface AgentGridProps {
  agents: Agent[];
  total?: number;
}

export function AgentGrid({ agents, total }: AgentGridProps) {
  const showing = agents.length;
  const totalCount = total ?? showing;

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3" aria-hidden="true">
          &#x1F50D;
        </div>
        <h3 className="text-base font-medium text-foreground">
          No agents found
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Try adjusting your search query or division filters to find what you
          are looking for.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-4 tabular-nums">
        Showing {showing} of {totalCount} agents
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={agent.slug} agent={agent} />
        ))}
      </div>
    </div>
  );
}
