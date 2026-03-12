"use client";

import { Separator } from "@/components/ui/separator";
import { MetricsBar } from "@/components/mission-control/metrics-bar";
import { PipelineDiagram } from "@/components/mission-control/pipeline-diagram";
import { AgentStatusGrid } from "@/components/mission-control/agent-status-grid";
import { GatewayStatus } from "@/components/mission-control/gateway-status";
import {
  NEXUS_PHASES,
  MOCK_AGENTS,
  MOCK_METRICS,
} from "@/lib/nexus/mock-data";

export default function MissionControlPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Mission Control</h1>
          <p className="text-sm text-muted-foreground">
            NEXUS pipeline status and agent activity overview
          </p>
        </div>
        <div className="w-80 shrink-0">
          <GatewayStatus />
        </div>
      </div>

      {/* Top-level metrics */}
      <MetricsBar metrics={MOCK_METRICS} />

      {/* Pipeline visualization */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Pipeline</h2>
        <PipelineDiagram phases={NEXUS_PHASES} />
      </div>

      <Separator />

      {/* Agent grid */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Agents</h2>
        <AgentStatusGrid agents={MOCK_AGENTS} />
      </div>
    </div>
  );
}
