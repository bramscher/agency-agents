"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAgentSelection } from "@/lib/store/agent-selection";
import { PROFILE_TEMPLATES } from "@/lib/profiles/templates";
import type { ProfileTemplate, NexusMode } from "@/types/profile";
import type { Agent, Division } from "@/types/agent";
import { DIVISION_LABELS } from "@/types/agent";
import { Loader2, ArrowRight, Users, Zap, Layers } from "lucide-react";

// Human-readable labels for NEXUS modes
const NEXUS_MODE_LABELS: Record<NexusMode, string> = {
  full: "Full NEXUS",
  sprint: "Sprint NEXUS",
  micro: "Micro NEXUS",
};

// Human-readable phase labels (0-indexed phase numbers used by templates)
const PHASE_LABELS: Record<number, string> = {
  0: "Phase 0 - Discovery",
  1: "Phase 1 - Strategy",
  2: "Phase 2 - Design",
  3: "Phase 3 - Build",
  4: "Phase 4 - Test",
  5: "Phase 5 - Launch",
  6: "Phase 6 - Growth",
};

// Group slugs by division based on the comment structure in templates.ts
function categorizeSlugs(slugs: string[]): Record<string, string[]> {
  // We derive categories from the template comments structure.
  // Since we do not have the agent objects at render time (only slugs),
  // we can at least return the raw slugs. The actual division breakdown
  // comes from matching against the fetched agents during apply.
  // For the static display, we parse the known groupings from the template file.
  return { all: slugs };
}

// Given the agentSlugs and the full agent catalog, build a division breakdown
function buildDivisionBreakdown(
  slugs: string[],
  allAgents: Agent[]
): { division: Division; label: string; count: number; slugs: string[] }[] {
  const map = new Map<
    Division,
    { label: string; count: number; slugs: string[] }
  >();
  for (const slug of slugs) {
    const agent = allAgents.find((a) => a.slug === slug);
    if (!agent) continue;
    const entry = map.get(agent.division);
    if (entry) {
      entry.count++;
      entry.slugs.push(slug);
    } else {
      map.set(agent.division, {
        label: DIVISION_LABELS[agent.division],
        count: 1,
        slugs: [slug],
      });
    }
  }
  return Array.from(map.entries())
    .map(([division, data]) => ({ division, ...data }))
    .sort((a, b) => b.count - a.count);
}

// Static pre-computed breakdown using known slug-to-division mapping from
// the template file comments. This avoids fetching on initial render.
// We hard-code the counts based on the template source comments.
function getStaticBreakdown(
  template: ProfileTemplate
): { label: string; count: number }[] {
  // Parse from the slug arrays -- we rely on the fact that the template file
  // groups slugs by division with comment headers. Since we cannot parse
  // comments at runtime, we use a heuristic: fetch agents on demand.
  // For now return a single entry so the UI can populate dynamically.
  return [{ label: "Total Agents", count: template.agentSlugs.length }];
}

function ProfileCard({ template }: { template: ProfileTemplate }) {
  const router = useRouter();
  const { setFromSlugs } = useAgentSelection();
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<
    { division: Division; label: string; count: number; slugs: string[] }[] | null
  >(null);
  const [breakdownLoaded, setBreakdownLoaded] = useState(false);

  // Lazily load the division breakdown when the card is first visible
  // or when the user interacts. We fetch once and cache.
  async function loadBreakdown() {
    if (breakdownLoaded) return;
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) return;
      const data: { agents: Agent[] } = await res.json();
      const result = buildDivisionBreakdown(template.agentSlugs, data.agents);
      setBreakdown(result);
      setBreakdownLoaded(true);
    } catch {
      // Silently fail -- the card still shows static info
    }
  }

  async function handleApply() {
    setLoading(true);
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error("Failed to fetch agents");
      const data: { agents: Agent[] } = await res.json();
      setFromSlugs(template.agentSlugs, data.agents);
      router.push("/configurator");
    } catch (err) {
      console.error("Error applying profile:", err);
      setLoading(false);
    }
  }

  return (
    <Card
      className="relative flex flex-col overflow-hidden border-t-4"
      style={{ borderTopColor: template.color }}
      onMouseEnter={loadBreakdown}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <span
            className="flex size-12 items-center justify-center rounded-lg text-2xl"
            style={{ backgroundColor: `${template.color}15` }}
            aria-hidden="true"
          >
            {template.icon}
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription className="mt-1 leading-relaxed">
              {template.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Quick stats row */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="secondary"
            className="gap-1"
            style={{
              backgroundColor: `${template.color}15`,
              color: template.color,
            }}
          >
            <Users className="size-3" />
            {template.agentSlugs.length} agents
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Zap className="size-3" />
            {NEXUS_MODE_LABELS[template.defaultNexusMode]}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Layers className="size-3" />
            {template.interAgentEnabled ? "Inter-agent ON" : "Inter-agent OFF"}
          </Badge>
        </div>

        {/* Primary phases */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Primary Phases
          </p>
          <div className="flex flex-wrap gap-1.5">
            {template.primaryPhases.map((phase) => (
              <Badge key={phase} variant="secondary" className="text-[10px]">
                {PHASE_LABELS[phase] ?? `Phase ${phase}`}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Division breakdown */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Agent Breakdown by Division
          </p>
          {breakdown && breakdown.length > 0 ? (
            <div className="space-y-1.5">
              {breakdown.map((entry) => (
                <div
                  key={entry.division}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{entry.label}</span>
                  <Badge variant="secondary" className="tabular-nums text-[10px]">
                    {entry.count}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {/* Static fallback: show total count */}
              {getStaticBreakdown(template).map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{entry.label}</span>
                  <Badge variant="secondary" className="tabular-nums text-[10px]">
                    {entry.count}
                  </Badge>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground/60">
                Hover for full breakdown
              </p>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {template.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-[10px] text-muted-foreground"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full gap-2"
          size="lg"
          disabled={loading}
          onClick={handleApply}
          style={
            !loading
              ? { backgroundColor: template.color, borderColor: template.color }
              : undefined
          }
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Applying...
            </>
          ) : (
            <>
              Apply This Profile
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function ProfilesPage() {
  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight mb-1">
          Profile Templates
        </h1>
        <p className="text-sm text-muted-foreground">
          Start from a pre-built agent configuration tailored to a specific use
          case. Applying a profile selects the agents and redirects you to the
          browse page to review.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {PROFILE_TEMPLATES.map((template) => (
          <ProfileCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
