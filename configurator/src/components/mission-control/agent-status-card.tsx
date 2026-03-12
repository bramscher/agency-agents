"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AgentSession, AgentStatus } from "@/types/nexus";

interface AgentStatusCardProps {
  agent: AgentSession;
}

// Maps agent status to display properties
const STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  active: {
    label: "Active",
    dotClass: "bg-emerald-500 animate-pulse",
    badgeClass: "bg-emerald-500/10 text-emerald-500",
  },
  idle: {
    label: "Idle",
    dotClass: "bg-muted-foreground/50",
    badgeClass: "bg-muted text-muted-foreground",
  },
  error: {
    label: "Error",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-500/10 text-red-500",
  },
  queued: {
    label: "Queued",
    dotClass: "bg-yellow-500",
    badgeClass: "bg-yellow-500/10 text-yellow-500",
  },
};

// Computes a human-readable relative time string (e.g. "2m ago", "1h ago")
function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AgentStatusCard({ agent }: AgentStatusCardProps) {
  const statusConfig = STATUS_CONFIG[agent.status];
  const qaPercent = Math.round(agent.firstPassRate * 100);

  return (
    <Link href={`/mission-control/agents/${agent.id}`}>
    <Card size="sm" className="cursor-pointer transition-shadow hover:ring-1 hover:ring-foreground/20">
      <CardHeader className="flex-row items-center gap-3">
        {/* Agent emoji */}
        <span className="text-2xl leading-none" role="img" aria-label={agent.agentName}>
          {agent.agentEmoji}
        </span>

        <div className="min-w-0 flex-1">
          {/* Agent name */}
          <CardTitle className="truncate text-sm font-semibold">
            {agent.agentName}
          </CardTitle>

          {/* Division badge */}
          <Badge variant="secondary" className="mt-1 text-[10px] capitalize">
            {agent.division}
          </Badge>
        </div>

        {/* Status indicator */}
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
            statusConfig.badgeClass
          )}
        >
          <span className={cn("size-2 rounded-full", statusConfig.dotClass)} />
          {statusConfig.label}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Current task (only shown when agent is active and has a task) */}
        {agent.currentTask && (
          <p className="truncate text-xs text-muted-foreground">
            {agent.currentTask}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              <span className="font-medium text-foreground">
                {agent.tasksCompleted}
              </span>{" "}
              tasks
            </span>
            <span>
              <span
                className={cn(
                  "font-medium",
                  qaPercent >= 80
                    ? "text-emerald-500"
                    : qaPercent >= 60
                      ? "text-yellow-500"
                      : "text-red-500"
                )}
              >
                {qaPercent}%
              </span>{" "}
              QA
            </span>
          </div>
          <span>{formatRelativeTime(agent.lastActive)}</span>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}
