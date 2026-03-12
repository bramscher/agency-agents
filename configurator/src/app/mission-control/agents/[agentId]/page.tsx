"use client";

import { use } from "react";
import Link from "next/link";
import { MOCK_AGENTS, MOCK_TASKS } from "@/lib/nexus/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// -- Status badge styling --

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-emerald-500/15", text: "text-emerald-600", label: "Active" },
  idle: { bg: "bg-zinc-500/15", text: "text-zinc-500", label: "Idle" },
  error: { bg: "bg-red-500/15", text: "text-red-600", label: "Error" },
  queued: { bg: "bg-blue-500/15", text: "text-blue-600", label: "Queued" },
};

// -- Relative time helper --

function getRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// -- First-pass rate color helper --

function rateColorClass(rate: number): string {
  if (rate >= 0.8) return "text-emerald-600";
  if (rate >= 0.6) return "text-yellow-600";
  return "text-red-600";
}

// -- Mock activity log entries (placeholders) --

function generateMockLogs(agentName: string) {
  const now = Date.now();
  return [
    {
      id: "log-1",
      message: `${agentName} started working on assigned task`,
      timestamp: new Date(now - 120000).toISOString(),
    },
    {
      id: "log-2",
      message: `${agentName} requested code review from Evidence Collector`,
      timestamp: new Date(now - 300000).toISOString(),
    },
    {
      id: "log-3",
      message: `${agentName} completed subtask: initial scaffolding`,
      timestamp: new Date(now - 900000).toISOString(),
    },
    {
      id: "log-4",
      message: `${agentName} received handoff context from Sprint Prioritizer`,
      timestamp: new Date(now - 1800000).toISOString(),
    },
    {
      id: "log-5",
      message: `${agentName} session started for Phase 3`,
      timestamp: new Date(now - 3600000).toISOString(),
    },
  ];
}

// -- Main page --

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);

  const agent = MOCK_AGENTS.find((a) => a.id === agentId || a.agentSlug === agentId);

  // 404 state
  if (!agent) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <p className="text-6xl font-bold text-muted-foreground/30">404</p>
        <p className="text-lg text-muted-foreground">Agent not found</p>
        <p className="text-sm text-muted-foreground">
          No agent with slug &ldquo;{agentId}&rdquo; exists.
        </p>
        <Link href="/mission-control/agents">
          <Button variant="outline" size="sm">
            Back to agents
          </Button>
        </Link>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[agent.status] ?? STATUS_STYLES.idle;
  const agentTasks = MOCK_TASKS.filter(
    (t) => t.assignedAgent === agent.agentName
  );
  const logs = generateMockLogs(agent.agentName);

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Back link */}
      <Link href="/mission-control/agents">
        <Button variant="ghost" size="sm" className="gap-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Back to agents
        </Button>
      </Link>

      {/* Agent header */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-5xl">{agent.agentEmoji}</span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {agent.agentName}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary" className="capitalize text-xs">
              {agent.division}
            </Badge>
            <Badge className={`${statusStyle.bg} ${statusStyle.text} border-none text-xs`}>
              {statusStyle.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Tasks Completed</p>
            <p className="text-2xl font-semibold">{agent.tasksCompleted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">First-Pass Rate</p>
            <p className={`text-2xl font-semibold ${rateColorClass(agent.firstPassRate)}`}>
              {Math.round(agent.firstPassRate * 100)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Last Active</p>
            <p className="text-2xl font-semibold">
              {getRelativeTime(agent.lastActive)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current task section */}
      {agent.currentTask && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Current Task
          </h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{agent.currentTask}</CardTitle>
            </CardHeader>
            <CardContent>
              {agentTasks
                .filter((t) => t.title === agent.currentTask)
                .map((t) => (
                  <div key={t.id} className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{t.id}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] capitalize"
                    >
                      {t.status.replace("_", " ")}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] capitalize"
                    >
                      {t.priority}
                    </Badge>
                    {t.retryCount > 0 && (
                      <span className="text-amber-600">
                        Attempt {t.retryCount + 1}/{t.maxRetries + 1}
                      </span>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>
        </section>
      )}

      <Separator />

      {/* Activity log placeholder */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Activity Log
        </h2>
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/30" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground">{log.message}</p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {getRelativeTime(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
