import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Layers, ListChecks, ShieldCheck } from "lucide-react";
import type { MissionMetrics } from "@/types/nexus";

interface MetricsBarProps {
  metrics: MissionMetrics;
}

// Individual stat card used inside the metrics bar
function StatCard({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="mt-0.5">{children}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// Thin horizontal progress bar
function ProgressBar({
  value,
  max,
  className,
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all", className)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function MetricsBar({ metrics }: MetricsBarProps) {
  const qaPercent = Math.round(metrics.firstPassRate * 100);
  const taskPercent =
    metrics.totalTasks > 0
      ? Math.round((metrics.tasksCompleted / metrics.totalTasks) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* Active Agents */}
      <StatCard icon={Users} label="Active Agents">
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold leading-none">
            {metrics.activeAgents}
          </span>
          <span className="text-xs text-muted-foreground">
            / {metrics.totalAgents}
          </span>
        </div>
        <ProgressBar
          value={metrics.activeAgents}
          max={metrics.totalAgents}
          className="bg-blue-500"
        />
      </StatCard>

      {/* Current Phase */}
      <StatCard icon={Layers} label="Current Phase">
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold leading-none">
            {metrics.currentPhase}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {metrics.phaseName}
          </span>
        </div>
      </StatCard>

      {/* Tasks */}
      <StatCard icon={ListChecks} label="Tasks">
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold leading-none">
            {metrics.tasksInProgress}
          </span>
          <span className="text-xs text-muted-foreground">
            in progress / {metrics.totalTasks} total
          </span>
        </div>
        <ProgressBar
          value={metrics.tasksCompleted}
          max={metrics.totalTasks}
          className="bg-emerald-500"
        />
        <span className="mt-0.5 block text-[10px] text-muted-foreground">
          {taskPercent}% complete
        </span>
      </StatCard>

      {/* First-Pass QA Rate */}
      <StatCard icon={ShieldCheck} label="First-Pass QA Rate">
        <span
          className={cn(
            "text-lg font-bold leading-none",
            qaPercent >= 80
              ? "text-emerald-500"
              : qaPercent >= 60
                ? "text-yellow-500"
                : "text-red-500"
          )}
        >
          {qaPercent}%
        </span>
        <ProgressBar
          value={qaPercent}
          max={100}
          className={cn(
            qaPercent >= 80
              ? "bg-emerald-500"
              : qaPercent >= 60
                ? "bg-yellow-500"
                : "bg-red-500"
          )}
        />
      </StatCard>
    </div>
  );
}
