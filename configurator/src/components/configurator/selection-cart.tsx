"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAgentSelection } from "@/lib/store/agent-selection";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronUp,
  ChevronDown,
  X,
  Trash2,
  MessageSquare,
} from "lucide-react";

export function SelectionCart() {
  const { getSelectedArray, removeAgent, clearAll, count } =
    useAgentSelection();
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teamName, setTeamName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const selectedCount = count();
  const selectedAgents = getSelectedArray();

  // Focus name input when expanded
  useEffect(() => {
    if (expanded) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [expanded]);

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

  const handleCreateTeam = useCallback(async () => {
    setSaving(true);
    const supabase = createClient();

    // Check if user is logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      // Store intent, redirect to login
      router.push("/auth/login?redirect=/configurator");
      setSaving(false);
      return;
    }

    const name = teamName.trim() || `My Team (${selectedCount} agents)`;

    // Create team
    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .insert({
        name,
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
    setTeamName("");
    // Go straight to team detail where they can chat or manage agents
    router.push(`/teams/${team.id}`);
  }, [selectedAgents, selectedCount, clearAll, router, teamName]);

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
            <ScrollArea className="max-h-48">
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

            {/* Team name + actions */}
            <div className="px-3 pb-3 space-y-2.5">
              <input
                ref={nameInputRef}
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateTeam();
                  }
                }}
                placeholder="Team name (optional)"
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex items-center gap-2">
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
                  onClick={handleCreateTeam}
                  disabled={saving}
                >
                  <MessageSquare className="size-3.5 mr-1" />
                  {saving ? "Creating..." : "Create Team"}
                </Button>
              </div>
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
