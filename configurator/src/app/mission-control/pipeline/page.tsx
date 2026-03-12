"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PipelineDiagram } from "@/components/mission-control/pipeline-diagram";
import { NEXUS_PHASES } from "@/lib/nexus/mock-data";
import {
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { NexusPhase } from "@/types/nexus";

// Expandable detail card for a single pipeline phase
function PhaseDetailCard({ phase }: { phase: NexusPhase }) {
  const [expanded, setExpanded] = useState(phase.status === "active");

  const statusBadge = {
    completed: { variant: "secondary" as const, className: "bg-emerald-500/10 text-emerald-500" },
    active: { variant: "secondary" as const, className: "bg-blue-500/10 text-blue-500" },
    upcoming: { variant: "secondary" as const, className: "bg-muted text-muted-foreground" },
  } as const;

  const gateBadge = {
    passed: { label: "Passed", className: "bg-emerald-500/10 text-emerald-500" },
    pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-500" },
    blocked: { label: "Blocked", className: "bg-red-500/10 text-red-500" },
  } as const;

  return (
    <Card>
      <CardHeader>
        <button
          type="button"
          className="flex w-full items-center gap-3 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Expand/collapse chevron */}
          {expanded ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          )}

          {/* Phase number indicator */}
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
              phase.status === "completed" &&
                "border-emerald-500 bg-emerald-500/10 text-emerald-500",
              phase.status === "active" &&
                "border-blue-500 bg-blue-500/10 text-blue-500",
              phase.status === "upcoming" &&
                "border-muted-foreground/40 bg-muted text-muted-foreground"
            )}
          >
            {phase.id}
          </span>

          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm">{phase.name}</CardTitle>
            <CardDescription className="text-xs">
              {phase.description}
            </CardDescription>
          </div>

          {/* Status badge */}
          <Badge
            variant={statusBadge[phase.status].variant}
            className={cn("shrink-0", statusBadge[phase.status].className)}
          >
            {phase.status}
          </Badge>
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          <Separator />

          {/* Agents assigned to this phase */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Users className="size-3.5" />
              Assigned Agents
            </div>
            <div className="flex flex-wrap gap-1.5">
              {phase.agents.map((agent) => (
                <Badge key={agent} variant="outline" className="text-xs">
                  {agent}
                </Badge>
              ))}
            </div>
          </div>

          {/* Quality gate status */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Quality Gate
            </div>
            {phase.gateStatus ? (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    gateBadge[phase.gateStatus].className
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      phase.gateStatus === "passed" && "bg-emerald-500",
                      phase.gateStatus === "pending" && "bg-yellow-500",
                      phase.gateStatus === "blocked" && "bg-red-500"
                    )}
                  />
                  {gateBadge[phase.gateStatus].label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {phase.gateStatus === "passed" &&
                    "All criteria met. Phase deliverables approved."}
                  {phase.gateStatus === "pending" &&
                    "Review in progress. Awaiting QA sign-off."}
                  {phase.gateStatus === "blocked" &&
                    "Blocking issues must be resolved before proceeding."}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                Not yet evaluated. Phase has not started.
              </span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function PipelinePage() {
  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold">NEXUS Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          7-phase delivery pipeline with quality gates
        </p>
      </div>

      {/* Large pipeline diagram */}
      <PipelineDiagram phases={NEXUS_PHASES} className="rounded-lg border bg-card p-6" />

      <Separator />

      {/* Phase detail cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Phase Details</h2>
        {NEXUS_PHASES.map((phase) => (
          <PhaseDetailCard key={phase.id} phase={phase} />
        ))}
      </div>
    </div>
  );
}
