"use client";

import { useState } from "react";
import { MOCK_HANDOFFS, NEXUS_PHASES } from "@/lib/nexus/mock-data";
import type { Handoff } from "@/types/nexus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// -- Status filter options --

type StatusFilter = "all" | "pending" | "accepted" | "completed";

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "completed", label: "Completed" },
];

// -- Status badge styling --

const STATUS_STYLES: Record<Handoff["status"], string> = {
  pending: "bg-yellow-500/15 text-yellow-700 border-none",
  accepted: "bg-blue-500/15 text-blue-600 border-none",
  completed: "bg-emerald-500/15 text-emerald-600 border-none",
  rejected: "bg-red-500/15 text-red-600 border-none",
};

// -- Priority badge styling --

const PRIORITY_STYLES: Record<Handoff["priority"], string> = {
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

// -- Timeline event component --

function HandoffEvent({ handoff }: { handoff: Handoff }) {
  const phase = NEXUS_PHASES.find((p) => p.id === handoff.phase);

  return (
    <div className="relative flex gap-4 pl-6">
      {/* Timeline dot and line */}
      <div className="absolute left-0 top-0 flex h-full flex-col items-center">
        <div className="mt-3 h-3 w-3 shrink-0 rounded-full border-2 border-blue-500 bg-background" />
        <div className="w-px flex-1 bg-border" />
      </div>

      <Card className="mb-4 flex-1">
        <CardContent className="space-y-3 pt-4">
          {/* Agent transfer row */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 font-medium">
              <span>{handoff.fromEmoji}</span>
              {handoff.fromAgent}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 text-muted-foreground"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </svg>
            <span className="inline-flex items-center gap-1 font-medium">
              <span>{handoff.toEmoji}</span>
              {handoff.toAgent}
            </span>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            {phase && (
              <Badge variant="outline" className="text-[10px]">
                Phase {handoff.phase}: {phase.shortName}
              </Badge>
            )}
            <Badge className={`${PRIORITY_STYLES[handoff.priority]} text-[10px]`}>
              {handoff.priority}
            </Badge>
            <Badge className={`${STATUS_STYLES[handoff.status]} text-[10px]`}>
              {handoff.status}
            </Badge>
          </div>

          <Separator />

          {/* Context message */}
          <p className="text-xs leading-relaxed text-muted-foreground">
            {handoff.context}
          </p>

          {/* Timestamp */}
          <p className="text-[10px] text-muted-foreground/60">
            {getRelativeTime(handoff.createdAt)}
            {handoff.completedAt &&
              ` (completed ${getRelativeTime(handoff.completedAt)})`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// -- Main page --

export default function HandoffsPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filteredHandoffs =
    filter === "all"
      ? MOCK_HANDOFFS
      : MOCK_HANDOFFS.filter((h) => h.status === filter);

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Handoff Timeline
        </h1>
        <p className="text-sm text-muted-foreground">
          {MOCK_HANDOFFS.length} handoffs between agents
        </p>
      </div>

      {/* Status filter buttons */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={filter === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Timeline */}
      <div className="flex-1">
        {filteredHandoffs.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No handoffs matching the selected filter.
          </p>
        ) : (
          filteredHandoffs.map((handoff) => (
            <HandoffEvent key={handoff.id} handoff={handoff} />
          ))
        )}
      </div>
    </div>
  );
}
