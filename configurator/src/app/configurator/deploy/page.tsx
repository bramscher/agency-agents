"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useAgentSelection } from "@/lib/store/agent-selection";
import {
  Monitor,
  Container,
  Cloud,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  FileCode2,
  PackageOpen,
} from "lucide-react";
import Link from "next/link";
import type { DeploymentTarget, DeploymentConfig } from "@/types/deployment";

// -- Target definitions -------------------------------------------------

interface TargetOption {
  id: DeploymentTarget;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TARGETS: TargetOption[] = [
  {
    id: "mac-local",
    name: "Mac Local",
    description:
      "Run on your Mac with Docker Desktop. Best for development and testing.",
    icon: Monitor,
  },
  {
    id: "docker",
    name: "Docker",
    description:
      "Generic Docker deployment. Works on any machine with Docker installed.",
    icon: Container,
  },
  {
    id: "aws-lightsail",
    name: "AWS Lightsail",
    description:
      "Deploy to an AWS Lightsail instance. Binds to 0.0.0.0 for remote access.",
    icon: Cloud,
  },
];

// -- File preview helpers -----------------------------------------------

const PREVIEW_TABS = ["docker-compose.yml", "openclaw.json", "startup.sh"] as const;
type PreviewTab = (typeof PREVIEW_TABS)[number];

function languageForTab(tab: PreviewTab): string {
  if (tab === "docker-compose.yml") return "yaml";
  if (tab === "openclaw.json") return "json";
  return "bash";
}

// Build a preview config so we can render generated file contents client-side.
// This duplicates some logic from the server generator so the preview is instant
// without requiring a round-trip.
function buildPreviewFiles(
  config: DeploymentConfig
): Record<PreviewTab, string> {
  const host = config.target === "aws-lightsail" ? "0.0.0.0" : "127.0.0.1";
  const bind = config.target === "aws-lightsail" ? "0.0.0.0" : "127.0.0.1";

  const compose = `version: "3.8"

services:
  openclaw:
    image: openclaw/openclaw:latest
    container_name: ${config.name}
    ports:
      - "${bind}:${config.gatewayPort}:${config.gatewayPort}"
      - "${bind}:${config.dashboardPort}:${config.dashboardPort}"
    volumes:
      - ./openclaw.json:/app/openclaw.json:ro
      - ./workspaces:/app/workspaces
    environment:
      - OPENCLAW_GATEWAY_PORT=${config.gatewayPort}
      - OPENCLAW_GATEWAY_HOST=${host}
      - OPENCLAW_DASHBOARD_PORT=${config.dashboardPort}
    restart: unless-stopped
    env_file:
      - .env`;

  const agents = config.agents.map((a) => ({
    id: a.slug,
    name: a.customName || a.name,
    workspace: `./workspaces/${a.slug}`,
    model: a.model || config.defaultModel,
  }));

  const openclawJson = JSON.stringify(
    {
      gateway: { port: config.gatewayPort, host },
      dashboard: { port: config.dashboardPort },
      agents,
      sessions: { interAgentEnabled: config.interAgentEnabled },
      defaultModel: config.defaultModel,
    },
    null,
    2
  );

  const awsBlock =
    config.target === "aws-lightsail"
      ? `
# Verify Docker is installed on this instance
if ! command -v docker &> /dev/null; then
  echo "Docker is not installed. Installing..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker \\$USER
  echo "Docker installed. You may need to log out and back in for group changes."
fi

if ! command -v docker compose &> /dev/null; then
  echo "Docker Compose plugin not found. Please install docker-compose-plugin."
  exit 1
fi
`
      : "";

  const startup = `#!/usr/bin/env bash
set -euo pipefail

echo "============================================"
echo "  ${config.name}"
echo "  Target: ${config.target}"
echo "  Agents: ${config.agents.length}"
echo "============================================"
${awsBlock}
echo "Starting services..."
docker compose up -d

echo ""
echo "Services are starting up."
echo "  Gateway:   http://${host}:${config.gatewayPort}"
echo "  Dashboard: http://${host}:${config.dashboardPort}"
echo ""
echo "Use 'docker compose logs -f' to follow logs."
echo "Use 'docker compose down' to stop all services."`;

  return {
    "docker-compose.yml": compose,
    "openclaw.json": openclawJson,
    "startup.sh": startup,
  };
}

// -- Page Component -----------------------------------------------------

export default function DeployPage() {
  const { getSelectedArray, count } = useAgentSelection();
  const selectedAgents = getSelectedArray();
  const agentCount = count();

  // Step tracking
  const [step, setStep] = useState(1);

  // Step 1: target
  const [target, setTarget] = useState<DeploymentTarget>("docker");

  // Step 2: configuration
  const [name, setName] = useState(() => {
    const ts = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `openclaw-deploy-${ts}`;
  });
  const [gatewayPort, setGatewayPort] = useState(18789);
  const [dashboardPort, setDashboardPort] = useState(3000);
  const [defaultModel, setDefaultModel] = useState("claude-sonnet-4-20250514");
  const [interAgentEnabled, setInterAgentEnabled] = useState(true);

  // Step 3: preview tab
  const [previewTab, setPreviewTab] = useState<PreviewTab>("docker-compose.yml");

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    id: string;
    downloadUrl: string;
    agentCount: number;
    files: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Build the deployment config from the current form state
  const deploymentConfig = useMemo<DeploymentConfig>(
    () => ({
      name,
      target,
      gatewayPort,
      dashboardPort,
      defaultModel,
      interAgentEnabled,
      agents: selectedAgents.map((a) => ({
        slug: a.slug,
        name: a.name,
        customName: a.customName,
        model: a.model,
      })),
    }),
    [name, target, gatewayPort, dashboardPort, defaultModel, interAgentEnabled, selectedAgents]
  );

  // Preview files generated client-side
  const previewFiles = useMemo(() => buildPreviewFiles(deploymentConfig), [deploymentConfig]);

  // Handle the generate and download action
  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deploymentConfig),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      setResult(data);

      // Trigger the download automatically
      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.download = `deployment-${data.id}.tar.gz`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setGenerating(false);
    }
  }, [deploymentConfig]);

  // -- Empty state when no agents are selected --------------------------

  if (agentCount === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="rounded-full bg-muted p-4">
          <PackageOpen className="size-8 text-muted-foreground" />
        </div>
        <div className="max-w-sm space-y-2">
          <h2 className="text-lg font-semibold">No agents selected</h2>
          <p className="text-sm text-muted-foreground">
            Select agents from the configurator before creating a deployment
            package.
          </p>
        </div>
        <Button render={<Link href="/configurator" />}>
          <ArrowLeft className="size-4 mr-1.5" />
          Browse Agents
        </Button>
      </div>
    );
  }

  // -- Main deploy UI ---------------------------------------------------

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 pb-16 md:p-6 md:pb-16">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Deploy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate a deployment package for your{" "}
          <span className="font-medium text-foreground">{agentCount}</span>{" "}
          selected {agentCount === 1 ? "agent" : "agents"}.
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-3">
        {[1, 2, 3].map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              step === s
                ? "bg-primary text-primary-foreground"
                : step > s
                  ? "bg-muted text-foreground"
                  : "bg-muted/50 text-muted-foreground"
            }`}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-background/20 text-xs font-bold">
              {s}
            </span>
            {s === 1 && "Target"}
            {s === 2 && "Configure"}
            {s === 3 && "Preview"}
          </button>
        ))}
      </div>

      <Separator />

      {/* ---- Step 1: Target Selection ---- */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Choose a deployment target</h2>
            <p className="text-sm text-muted-foreground">
              Where will this deployment run?
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {TARGETS.map((t) => {
              const selected = target === t.id;
              return (
                <Card
                  key={t.id}
                  className={`cursor-pointer transition-all ${
                    selected
                      ? "ring-2 ring-primary"
                      : "hover:ring-1 hover:ring-foreground/20"
                  }`}
                  onClick={() => setTarget(t.id)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <t.icon
                        className={`size-5 ${
                          selected ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <CardTitle>{t.name}</CardTitle>
                    </div>
                    <CardDescription>{t.description}</CardDescription>
                  </CardHeader>
                  {selected && (
                    <CardContent>
                      <Badge variant="default">Selected</Badge>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setStep(2)}>
              Next
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ---- Step 2: Configuration ---- */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold">Configure deployment</h2>
            <p className="text-sm text-muted-foreground">
              Set ports, model, and other options for your deployment.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Deployment name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="deploy-name"
                className="text-sm font-medium"
              >
                Deployment Name
              </label>
              <Input
                id="deploy-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-deployment"
              />
            </div>

            {/* Gateway port */}
            <div className="space-y-1.5">
              <label
                htmlFor="gateway-port"
                className="text-sm font-medium"
              >
                Gateway Port
              </label>
              <Input
                id="gateway-port"
                type="number"
                value={gatewayPort}
                onChange={(e) => setGatewayPort(Number(e.target.value))}
              />
            </div>

            {/* Dashboard port */}
            <div className="space-y-1.5">
              <label
                htmlFor="dashboard-port"
                className="text-sm font-medium"
              >
                Dashboard Port
              </label>
              <Input
                id="dashboard-port"
                type="number"
                value={dashboardPort}
                onChange={(e) => setDashboardPort(Number(e.target.value))}
              />
            </div>

            {/* Default model */}
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="default-model"
                className="text-sm font-medium"
              >
                Default Model
              </label>
              <Input
                id="default-model"
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                placeholder="claude-sonnet-4-20250514"
              />
            </div>

            {/* Inter-agent communication */}
            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox
                checked={interAgentEnabled}
                onCheckedChange={(checked) =>
                  setInterAgentEnabled(checked === true)
                }
                id="inter-agent"
              />
              <label
                htmlFor="inter-agent"
                className="text-sm font-medium cursor-pointer select-none"
              >
                Enable inter-agent communication
              </label>
            </div>
          </div>

          <Separator />

          {/* Selected agents summary */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              Agents ({agentCount})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {selectedAgents.map((a) => (
                <Badge key={a.slug} variant="secondary">
                  {a.emoji ? `${a.emoji} ` : ""}
                  {a.customName || a.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="size-4 mr-1.5" />
              Back
            </Button>
            <Button onClick={() => setStep(3)}>
              Next
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ---- Step 3: Preview & Generate ---- */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold">Preview generated files</h2>
            <p className="text-sm text-muted-foreground">
              Review the files that will be included in your deployment package.
            </p>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {PREVIEW_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setPreviewTab(tab)}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  previewTab === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Code preview */}
          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <span className="text-xs font-medium text-muted-foreground">
                {previewTab}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {languageForTab(previewTab)}
              </Badge>
            </div>
            <pre className="max-h-96 overflow-auto p-4 text-xs leading-relaxed">
              <code>{previewFiles[previewTab]}</code>
            </pre>
          </div>

          {/* Workspace files info */}
          <Card size="sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileCode2 className="size-4 text-muted-foreground" />
                <CardTitle>Workspace files</CardTitle>
              </div>
              <CardDescription>
                {agentCount} agent {agentCount === 1 ? "workspace" : "workspaces"}{" "}
                will be generated, each containing SOUL.md, AGENTS.md, and IDENTITY.md.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {selectedAgents.map((a) => (
                  <Badge key={a.slug} variant="outline" className="font-mono text-[11px]">
                    workspaces/{a.slug}/
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Generate and download */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="size-4 mr-1.5" />
                Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                size="lg"
              >
                {generating ? (
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                ) : (
                  <Download className="size-4 mr-1.5" />
                )}
                {generating ? "Generating..." : "Generate & Download"}
              </Button>
            </div>

            {/* Success message */}
            {result && (
              <div className="flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-500">
                    Deployment package generated
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {result.agentCount} {result.agentCount === 1 ? "agent" : "agents"},{" "}
                    {result.files.length} files packaged.
                    Your download should start automatically.
                  </p>
                  <a
                    href={result.downloadUrl}
                    download
                    className="inline-block text-xs font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    Download again
                  </a>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">
                    Generation failed
                  </p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
