"use client";

import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NexusPhase } from "@/types/nexus";

interface PipelineDiagramProps {
  phases: NexusPhase[];
  className?: string;
}

// Gate indicator dot between pipeline phases
function GateIndicator({
  status,
}: {
  status?: "passed" | "pending" | "blocked";
}) {
  if (!status) return null;

  const colorMap = {
    passed: "bg-emerald-500",
    pending: "bg-yellow-500",
    blocked: "bg-red-500",
  } as const;

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          "size-2.5 rounded-full ring-2 ring-background",
          colorMap[status]
        )}
        title={`Gate: ${status}`}
      />
    </div>
  );
}

// Arrow connector between phases (hidden on mobile where phases wrap)
function PhaseConnector({ gateStatus }: { gateStatus?: "passed" | "pending" | "blocked" }) {
  return (
    <div className="hidden items-center gap-1 md:flex">
      <div className="h-px w-4 bg-border lg:w-6" />
      <GateIndicator status={gateStatus} />
      <div className="h-px w-2 bg-border lg:w-3" />
      <ArrowRight className="size-3 text-muted-foreground" />
    </div>
  );
}

// Single phase node in the pipeline
function PhaseNode({
  phase,
  isSelected,
  onSelect,
}: {
  phase: NexusPhase;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const statusStyles = {
    completed: {
      circle: "border-emerald-500 bg-emerald-500/10 text-emerald-500",
      label: "text-emerald-500",
    },
    active: {
      circle: "border-blue-500 bg-blue-500/10 text-blue-500",
      label: "text-blue-500",
    },
    upcoming: {
      circle: "border-muted-foreground/40 bg-muted text-muted-foreground",
      label: "text-muted-foreground",
    },
  } as const;

  const styles = statusStyles[phase.status];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-muted/50",
        isSelected && "bg-muted/80 ring-1 ring-ring/30"
      )}
    >
      {/* Phase circle */}
      <div
        className={cn(
          "relative flex size-10 items-center justify-center rounded-full border-2 transition-all md:size-12",
          styles.circle,
          phase.status === "active" && "animate-pulse"
        )}
      >
        {phase.status === "completed" ? (
          <Check className="size-5 md:size-6" />
        ) : (
          <span className="text-sm font-bold md:text-base">{phase.id}</span>
        )}
      </div>

      {/* Phase name */}
      <div className="flex flex-col items-center gap-0.5">
        <span
          className={cn(
            "text-center text-xs font-medium leading-tight md:text-sm",
            styles.label
          )}
        >
          {phase.shortName}
        </span>
        {/* Mobile gate indicator (shown below name when phases wrap) */}
        <div className="md:hidden">
          <GateIndicator status={phase.gateStatus} />
        </div>
      </div>
    </button>
  );
}

export function PipelineDiagram({ phases, className }: PipelineDiagramProps) {
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);

  const selectedPhase = phases.find((p) => p.id === selectedPhaseId);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Pipeline row -- wraps on mobile, horizontal on desktop */}
      <div className="flex flex-wrap items-center justify-center gap-1 md:flex-nowrap md:gap-0">
        {phases.map((phase, idx) => (
          <div key={phase.id} className="flex items-center">
            <PhaseNode
              phase={phase}
              isSelected={selectedPhaseId === phase.id}
              onSelect={() =>
                setSelectedPhaseId((prev) =>
                  prev === phase.id ? null : phase.id
                )
              }
            />
            {/* Connector arrow + gate between phases (not after last) */}
            {idx < phases.length - 1 && (
              <PhaseConnector gateStatus={phase.gateStatus} />
            )}
          </div>
        ))}
      </div>

      {/* Expanded detail panel for selected phase */}
      {selectedPhase && (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{selectedPhase.name}</span>
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                selectedPhase.status === "completed" &&
                  "bg-emerald-500/10 text-emerald-500",
                selectedPhase.status === "active" &&
                  "bg-blue-500/10 text-blue-500",
                selectedPhase.status === "upcoming" &&
                  "bg-muted text-muted-foreground"
              )}
            >
              {selectedPhase.status}
            </span>
          </div>
          <p className="mt-1 text-muted-foreground">
            {selectedPhase.description}
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Agents: </span>
            {selectedPhase.agents.join(", ")}
          </div>
          {selectedPhase.gateStatus && (
            <div className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Gate: </span>
              <span
                className={cn(
                  selectedPhase.gateStatus === "passed" && "text-emerald-500",
                  selectedPhase.gateStatus === "pending" && "text-yellow-500",
                  selectedPhase.gateStatus === "blocked" && "text-red-500"
                )}
              >
                {selectedPhase.gateStatus}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
