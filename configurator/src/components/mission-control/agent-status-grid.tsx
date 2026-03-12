"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AgentStatusCard } from "@/components/mission-control/agent-status-card";
import type { AgentSession, AgentStatus } from "@/types/nexus";

interface AgentStatusGridProps {
  agents: AgentSession[];
}

type StatusFilter = "all" | AgentStatus;
type SortKey = "name" | "status" | "lastActive";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "idle", label: "Idle" },
  { value: "error", label: "Error" },
  { value: "queued", label: "Queued" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "status", label: "Status" },
  { value: "lastActive", label: "Last Active" },
];

// Numeric priority for sorting by status (lower number = higher priority)
const STATUS_PRIORITY: Record<AgentStatus, number> = {
  error: 0,
  active: 1,
  queued: 2,
  idle: 3,
};

export function AgentStatusGrid({ agents }: AgentStatusGridProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("status");

  const activeCount = agents.filter((a) => a.status === "active").length;

  const filteredAndSorted = useMemo(() => {
    let result = agents;

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Apply sort
    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.agentName.localeCompare(b.agentName);
        case "status":
          return STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
        case "lastActive":
          return (
            new Date(b.lastActive).getTime() -
            new Date(a.lastActive).getTime()
          );
        default:
          return 0;
      }
    });

    return result;
  }, [agents, statusFilter, sortKey]);

  return (
    <div className="space-y-4">
      {/* Filter and sort controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? "default" : "outline"}
              size="xs"
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Count summary */}
          <span className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{activeCount}</span>{" "}
            active of{" "}
            <span className="font-medium text-foreground">{agents.length}</span>{" "}
            total
          </span>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Sort:</span>
            {SORT_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={sortKey === option.value ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setSortKey(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Agent cards grid */}
      <div
        className={cn(
          "grid gap-3",
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        )}
      >
        {filteredAndSorted.map((agent) => (
          <AgentStatusCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Empty state */}
      {filteredAndSorted.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No agents match the current filter.
        </div>
      )}
    </div>
  );
}
