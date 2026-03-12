"use client";

import {
  MOCK_TASKS,
  MOCK_AGENTS,
  MOCK_METRICS,
  NEXUS_PHASES,
} from "@/lib/nexus/mock-data";
import type { TaskStatus } from "@/types/nexus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// -- Stat card component --

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {detail && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
        )}
      </CardContent>
    </Card>
  );
}

// -- Status colors for the distribution bar --

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "bg-zinc-400" },
  in_progress: { label: "In Progress", color: "bg-blue-500" },
  in_qa: { label: "In QA", color: "bg-purple-500" },
  passed: { label: "Passed", color: "bg-emerald-500" },
  failed: { label: "Failed", color: "bg-red-500" },
  blocked: { label: "Blocked", color: "bg-amber-500" },
};

// -- First-pass rate color helper --

function rateColorClass(rate: number): string {
  if (rate >= 0.8) return "text-emerald-600";
  if (rate >= 0.6) return "text-yellow-600";
  return "text-red-600";
}

// -- Agent status dot styling --

const AGENT_STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500",
  idle: "bg-zinc-400",
  error: "bg-red-500",
  queued: "bg-blue-500",
};

// -- Main page --

export default function MetricsPage() {
  const metrics = MOCK_METRICS;

  // Compute task counts per status
  const statusCounts: Record<TaskStatus, number> = {
    backlog: 0,
    in_progress: 0,
    in_qa: 0,
    passed: 0,
    failed: 0,
    blocked: 0,
  };
  for (const task of MOCK_TASKS) {
    statusCounts[task.status]++;
  }

  // Compute tasks per phase
  const phaseCounts = NEXUS_PHASES.map((phase) => ({
    phase,
    count: MOCK_TASKS.filter((t) => t.phase === phase.id).length,
  }));
  const maxPhaseTasks = Math.max(...phaseCounts.map((p) => p.count), 1);

  // Sort agents by tasks completed descending
  const sortedAgents = [...MOCK_AGENTS].sort(
    (a, b) => b.tasksCompleted - a.tasksCompleted
  );

  const totalTasks = MOCK_TASKS.length;

  return (
    <div className="flex h-full flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Metrics & Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Phase {metrics.currentPhase}: {metrics.phaseName}
        </p>
      </div>

      {/* -- Overview stat cards -- */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Overview
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard
            label="Total Tasks"
            value={metrics.totalTasks}
            detail={`${metrics.tasksInProgress} in progress`}
          />
          <StatCard
            label="Completed Tasks"
            value={metrics.tasksCompleted}
            detail={`of ${metrics.totalTasks} total`}
          />
          <StatCard
            label="First-Pass Rate"
            value={`${Math.round(metrics.firstPassRate * 100)}%`}
            detail="Tasks passing QA on first attempt"
          />
          <StatCard
            label="Avg Retries"
            value={metrics.avgRetries.toFixed(2)}
            detail="Per task"
          />
          <StatCard
            label="Active Agents"
            value={`${metrics.activeAgents}/${metrics.totalAgents}`}
            detail="Currently working"
          />
          <StatCard
            label="Estimated Cost"
            value={`$${metrics.estimatedCost.toFixed(2)}`}
            detail="This mission"
          />
        </div>
      </section>

      <Separator />

      {/* -- Phase Progress -- */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Phase Progress
        </h2>
        <Card>
          <CardContent className="space-y-3 pt-4">
            {phaseCounts.map(({ phase, count }) => {
              const widthPct = maxPhaseTasks > 0 ? (count / maxPhaseTasks) * 100 : 0;
              return (
                <div key={phase.id} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">
                    P{phase.id}: {phase.shortName}
                  </span>
                  <div className="flex-1">
                    <div className="h-5 w-full rounded-md bg-muted">
                      <div
                        className="flex h-5 items-center rounded-md bg-blue-500 px-2 text-[10px] font-medium text-white transition-all"
                        style={{
                          width: `${Math.max(widthPct, count > 0 ? 8 : 0)}%`,
                        }}
                      >
                        {count > 0 && count}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* -- Task Distribution -- */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Task Distribution
        </h2>
        <Card>
          <CardContent className="space-y-3 pt-4">
            {/* Segmented bar */}
            <div className="flex h-6 w-full overflow-hidden rounded-md">
              {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((status) => {
                const count = statusCounts[status];
                if (count === 0) return null;
                const widthPct = (count / totalTasks) * 100;
                return (
                  <div
                    key={status}
                    className={`${STATUS_CONFIG[status].color} transition-all`}
                    style={{ width: `${widthPct}%` }}
                    title={`${STATUS_CONFIG[status].label}: ${count}`}
                  />
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((status) => (
                <div key={status} className="flex items-center gap-1.5">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_CONFIG[status].color}`}
                  />
                  <span className="text-[11px] text-muted-foreground">
                    {STATUS_CONFIG[status].label} ({statusCounts[status]})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* -- Agent Performance Table -- */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Agent Performance
        </h2>
        <Card>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Agent</th>
                    <th className="pb-2 pr-4 font-medium">Division</th>
                    <th className="pb-2 pr-4 font-medium text-right">
                      Tasks Completed
                    </th>
                    <th className="pb-2 pr-4 font-medium text-right">
                      First-Pass Rate
                    </th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAgents.map((agent) => (
                    <tr key={agent.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <span>{agent.agentEmoji}</span>
                          <span className="font-medium">{agent.agentName}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-4 capitalize text-muted-foreground">
                        {agent.division}
                      </td>
                      <td className="py-2 pr-4 text-right font-mono">
                        {agent.tasksCompleted}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <span
                          className={`font-mono font-medium ${rateColorClass(agent.firstPassRate)}`}
                        >
                          {Math.round(agent.firstPassRate * 100)}%
                        </span>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${AGENT_STATUS_DOT[agent.status] ?? "bg-zinc-400"}`}
                          />
                          <span className="text-xs capitalize text-muted-foreground">
                            {agent.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
