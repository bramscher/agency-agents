"use client";

import { MOCK_TASKS } from "@/lib/nexus/mock-data";
import type { Task, TaskStatus, TaskPriority } from "@/types/nexus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// -- Column configuration --

interface ColumnConfig {
  status: TaskStatus;
  label: string;
  headerBg: string;
  headerText: string;
  dotColor: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: "backlog",
    label: "Backlog",
    headerBg: "bg-zinc-100 dark:bg-zinc-800",
    headerText: "text-zinc-700 dark:text-zinc-300",
    dotColor: "bg-zinc-400",
  },
  {
    status: "in_progress",
    label: "In Progress",
    headerBg: "bg-blue-100 dark:bg-blue-900/40",
    headerText: "text-blue-700 dark:text-blue-300",
    dotColor: "bg-blue-500",
  },
  {
    status: "in_qa",
    label: "In QA",
    headerBg: "bg-purple-100 dark:bg-purple-900/40",
    headerText: "text-purple-700 dark:text-purple-300",
    dotColor: "bg-purple-500",
  },
  {
    status: "passed",
    label: "Passed",
    headerBg: "bg-emerald-100 dark:bg-emerald-900/40",
    headerText: "text-emerald-700 dark:text-emerald-300",
    dotColor: "bg-emerald-500",
  },
  {
    status: "failed",
    label: "Failed",
    headerBg: "bg-red-100 dark:bg-red-900/40",
    headerText: "text-red-700 dark:text-red-300",
    dotColor: "bg-red-500",
  },
  {
    status: "blocked",
    label: "Blocked",
    headerBg: "bg-amber-100 dark:bg-amber-900/40",
    headerText: "text-amber-700 dark:text-amber-300",
    dotColor: "bg-amber-500",
  },
];

// -- Priority badge styling --

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  critical: "bg-red-500/15 text-red-600 border-none",
  high: "bg-orange-500/15 text-orange-600 border-none",
  medium: "bg-yellow-500/15 text-yellow-700 border-none",
  low: "bg-zinc-500/10 text-zinc-500 border-none",
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

// -- Task card component --

function TaskCard({ task }: { task: Task }) {
  return (
    <Card size="sm" className="gap-2">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-muted-foreground">
              {task.id}
            </p>
            <CardTitle className="text-xs leading-snug">{task.title}</CardTitle>
          </div>
          <Badge className={`${PRIORITY_STYLES[task.priority]} shrink-0 text-[10px]`}>
            {task.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-0">
        {task.assignedAgent && (
          <p className="text-[11px] text-muted-foreground">
            {task.assignedAgent}
          </p>
        )}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          {task.retryCount > 0 ? (
            <span className="font-medium text-amber-600">
              Attempt {task.retryCount + 1}/{task.maxRetries + 1}
            </span>
          ) : (
            <span />
          )}
          <span>{getRelativeTime(task.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// -- Main page --

export default function TasksPage() {
  // Group tasks by status
  const grouped = COLUMNS.map((col) => ({
    ...col,
    tasks: MOCK_TASKS.filter((t) => t.status === col.status),
  }));

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Task Board</h1>
        <p className="text-sm text-muted-foreground">
          {MOCK_TASKS.length} tasks across {COLUMNS.length} stages
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex gap-4 pb-4" style={{ minWidth: "max-content" }}>
          {grouped.map((col) => (
            <div
              key={col.status}
              className="flex w-72 shrink-0 flex-col gap-3"
            >
              {/* Column header */}
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 ${col.headerBg}`}
              >
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${col.dotColor}`}
                />
                <span className={`text-sm font-medium ${col.headerText}`}>
                  {col.label}
                </span>
                <Badge
                  variant="secondary"
                  className="ml-auto text-[10px]"
                >
                  {col.tasks.length}
                </Badge>
              </div>

              {/* Task cards */}
              <div className="flex flex-col gap-2">
                {col.tasks.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    No tasks
                  </p>
                ) : (
                  col.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
