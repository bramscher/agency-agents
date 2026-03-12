"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAgentSelection } from "@/lib/store/agent-selection";
import { DivisionBadge } from "@/components/shared/division-badge";
import type { AgentConfig } from "@/types/agent";
import {
  Trash2,
  ArrowRight,
  ArrowLeft,
  PackageOpen,
  Settings2,
} from "lucide-react";

const MODEL_OPTIONS = [
  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
  { value: "claude-opus-4-20250514", label: "Claude Opus 4" },
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
] as const;

function AgentConfigCard({ agent }: { agent: AgentConfig }) {
  const { updateConfig, removeAgent } = useAgentSelection();

  return (
    <Card className="border-l-4" style={{ borderLeftColor: agent.color }}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="text-2xl shrink-0" aria-hidden="true">
            {agent.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm truncate">{agent.name}</CardTitle>
            <div className="mt-1">
              <DivisionBadge division={agent.division} />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => removeAgent(agent.slug)}
            aria-label={`Remove ${agent.name}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Custom display name */}
        <div>
          <label
            htmlFor={`name-${agent.slug}`}
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Custom Display Name
          </label>
          <Input
            id={`name-${agent.slug}`}
            placeholder={agent.name}
            value={agent.customName ?? ""}
            onChange={(e) =>
              updateConfig(agent.slug, {
                customName: e.target.value || undefined,
              })
            }
          />
        </div>

        {/* LLM model select */}
        <div>
          <label
            htmlFor={`model-${agent.slug}`}
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            LLM Model
          </label>
          <select
            id={`model-${agent.slug}`}
            value={agent.model ?? "claude-sonnet-4-20250514"}
            onChange={(e) =>
              updateConfig(agent.slug, { model: e.target.value })
            }
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {MODEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Include checkboxes */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            Include Files
          </p>

          <div className="flex items-center gap-2">
            <Checkbox
              id={`soul-${agent.slug}`}
              checked={agent.includeSoul}
              onCheckedChange={(checked) =>
                updateConfig(agent.slug, { includeSoul: !!checked })
              }
            />
            <label
              htmlFor={`soul-${agent.slug}`}
              className="text-sm cursor-pointer select-none"
            >
              Include SOUL.md
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id={`agents-${agent.slug}`}
              checked={agent.includeAgents}
              onCheckedChange={(checked) =>
                updateConfig(agent.slug, { includeAgents: !!checked })
              }
            />
            <label
              htmlFor={`agents-${agent.slug}`}
              className="text-sm cursor-pointer select-none"
            >
              Include AGENTS.md
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id={`identity-${agent.slug}`}
              checked={agent.includeIdentity}
              onCheckedChange={(checked) =>
                updateConfig(agent.slug, { includeIdentity: !!checked })
              }
            />
            <label
              htmlFor={`identity-${agent.slug}`}
              className="text-sm cursor-pointer select-none"
            >
              Include IDENTITY.md
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
        <PackageOpen className="size-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold mb-1">No Agents Selected</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        You have not selected any agents to customize. Browse the agent catalog
        or apply a profile template to get started.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" render={<Link href="/configurator" />}>
          <ArrowLeft className="size-4 mr-1.5" />
          Browse Agents
        </Button>
        <Button render={<Link href="/configurator/profiles" />}>
          View Profiles
        </Button>
      </div>
    </div>
  );
}

export default function CustomizePage() {
  const { getSelectedArray, count } = useAgentSelection();
  const selectedAgents = getSelectedArray();
  const selectedCount = count();

  // Global settings (local state, could be lifted to store later)
  const [deploymentName, setDeploymentName] = useState("");
  const [defaultModel, setDefaultModel] = useState("claude-sonnet-4-20250514");
  const [interAgentComm, setInterAgentComm] = useState(true);

  if (selectedCount === 0) {
    return (
      <div className="p-4 md:p-6">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight mb-1">
            Customize Your Agents
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure each selected agent before deployment.
            <Badge variant="secondary" className="ml-2 tabular-nums">
              {selectedCount}
            </Badge>{" "}
            {selectedCount === 1 ? "agent" : "agents"} selected
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/configurator" />}
        >
          <ArrowLeft className="size-3.5 mr-1" />
          Back
        </Button>
      </div>

      {/* Global settings */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="size-4 text-muted-foreground" />
            <CardTitle>Global Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Deployment name */}
            <div>
              <label
                htmlFor="deployment-name"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Deployment Name
              </label>
              <Input
                id="deployment-name"
                placeholder="e.g. My Venture Studio"
                value={deploymentName}
                onChange={(e) => setDeploymentName(e.target.value)}
              />
            </div>

            {/* Default model */}
            <div>
              <label
                htmlFor="default-model"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Default Model
              </label>
              <select
                id="default-model"
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {MODEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Inter-agent communication toggle */}
            <div className="flex flex-col justify-end">
              <div className="flex items-center gap-2 h-8">
                <Checkbox
                  id="inter-agent"
                  checked={interAgentComm}
                  onCheckedChange={(checked) => setInterAgentComm(!!checked)}
                />
                <label
                  htmlFor="inter-agent"
                  className="text-sm cursor-pointer select-none"
                >
                  Enable inter-agent communication
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="mb-6" />

      {/* Agent list */}
      <ScrollArea className="h-full">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {selectedAgents.map((agent) => (
            <AgentConfigCard key={agent.slug} agent={agent} />
          ))}
        </div>
      </ScrollArea>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6 lg:ml-64">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{selectedCount}</span>{" "}
            {selectedCount === 1 ? "agent" : "agents"} configured
          </p>
          <Button
            size="lg"
            className="gap-2"
            render={<Link href="/configurator/deploy" />}
          >
            Continue to Deploy
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
