"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAgentSelection } from "@/lib/store/agent-selection";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronUp,
  ChevronDown,
  X,
  ArrowRight,
  Trash2,
  UsersRound,
} from "lucide-react";

export function SelectionCart() {
  const { getSelectedArray, removeAgent, clearAll, count } =
    useAgentSelection();
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const selectedCount = count();
  const selectedAgents = getSelectedArray();

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleRemove = useCallback(
    (slug: string, e: React.MouseEvent) => {
      e.stopPropagation();
      removeAgent(slug);
    },
    [removeAgent]
  );

  const handleClearAll = useCallback(() => {
    clearAll();
    setExpanded(false);
  }, [clearAll]);

  const handleSaveAsTeam = useCallback(async () => {
    setSaving(true);
    const supabase = createClient();

    // Check if user is logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login?redirect=/teams");
      return;
    }

    // Create team
    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .insert({
        name: `Team (${selectedCount} agents)`,
        user_id: user.id,
      })
      .select("id")
      .single();

    if (teamErr || !team) {
      console.error("Error creating team:", teamErr?.message);
      setSaving(false);
      return;
    }

    // Look up agent IDs by slug
    const slugs = selectedAgents.map((a) => a.slug);
    const { data: agents } = await supabase
      .from("agents")
      .select("id, slug")
      .in("slug", slugs);

    if (agents && agents.length > 0) {
      const teamAgentRows = agents.map((a, i) => ({
        team_id: team.id,
        agent_id: a.id,
        sort_order: i,
      }));

      await supabase.from("team_agents").insert(teamAgentRows);
    }

    clearAll();
    router.push(`/teams/${team.id}`);
  }, [selectedAgents, selectedCount, clearAll, router]);

  // Do not render when nothing is selected
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 max-w-[calc(100vw-3rem)]">
      <div className="rounded-xl border bg-card text-card-foreground shadow-lg ring-1 ring-foreground/5 overflow-hidden">
        {/* Expanded agent list */}
        {expanded && (
          <div className="border-b">
            <ScrollArea className="max-h-64">
              <div className="p-3 space-y-1">
                {selectedAgents.map((agent) => (
                  <div
                    key={agent.slug}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 group"
                  >
                    <span className="text-base shrink-0" aria-hidden="true">
                      {agent.emoji}
                    </span>
                    <span className="flex-1 truncate">{agent.name}</span>
                    <button
                      onClick={(e) => handleRemove(agent.slug, e)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${agent.name}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Actions inside expanded area */}
            <div className="flex items-center gap-2 px-3 pb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3.5 mr-1" />
                Clear
              </Button>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="outline"
                render={<Link href="/configurator/customize" />}
              >
                Customize
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
              <Button size="sm" onClick={handleSaveAsTeam} disabled={saving}>
                <UsersRound className="size-3.5 mr-1" />
                {saving ? "Saving..." : "Save Team"}
              </Button>
            </div>
          </div>
        )}

        {/* Collapsed header bar -- always visible */}
        <button
          onClick={toggleExpanded}
          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-accent/30 transition-colors"
        >
          <Badge variant="default" className="tabular-nums">
            {selectedCount}
          </Badge>
          <span className="flex-1 text-left">
            {selectedCount === 1 ? "agent selected" : "agents selected"}
          </span>
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="size-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}
