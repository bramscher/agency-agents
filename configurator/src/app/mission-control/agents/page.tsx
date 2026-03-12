"use client";

import { MOCK_AGENTS } from "@/lib/nexus/mock-data";
import { AgentStatusGrid } from "@/components/mission-control/agent-status-grid";
import { Badge } from "@/components/ui/badge";

export default function AgentsPage() {
  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Agent Status</h1>
        <Badge variant="secondary">{MOCK_AGENTS.length} agents</Badge>
      </div>

      <AgentStatusGrid agents={MOCK_AGENTS} />
    </div>
  );
}
