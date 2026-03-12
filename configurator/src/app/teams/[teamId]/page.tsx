"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Bot,
  Plus,
  Search,
  Trash2,
  X,
  MessageSquare,
  Settings,
} from "lucide-react";
import { DIVISION_LABELS, type Division } from "@/types/agent";

interface TeamRow {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  default_model: string;
  inter_agent_enabled: boolean;
}

interface TeamAgent {
  id: string; // team_agents row id
  agent_id: string;
  custom_name: string | null;
  sort_order: number;
  agent: {
    id: string;
    slug: string;
    name: string;
    description: string;
    division: string;
    emoji: string;
    color: string;
  };
}

interface CatalogAgent {
  id: string;
  slug: string;
  name: string;
  description: string;
  division: string;
  emoji: string;
  color: string;
}

export default function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [team, setTeam] = useState<TeamRow | null>(null);
  const [teamAgents, setTeamAgents] = useState<TeamAgent[]>([]);
  const [loading, setLoading] = useState(true);

  // Agent picker state
  const [showPicker, setShowPicker] = useState(false);
  const [catalog, setCatalog] = useState<CatalogAgent[]>([]);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerDivision, setPickerDivision] = useState<string | null>(null);
  const [adding, setAdding] = useState<Set<string>>(new Set());

  // Team settings
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const fetchTeam = useCallback(async () => {
    const { data: teamData, error: teamErr } = await supabase
      .from("teams")
      .select("id, name, description, icon, color, default_model, inter_agent_enabled")
      .eq("id", teamId)
      .single();

    if (teamErr || !teamData) {
      console.error("Error fetching team:", teamErr?.message);
      router.push("/teams");
      return;
    }

    setTeam(teamData);
    setEditName(teamData.name);
    setEditDesc(teamData.description ?? "");

    const { data: agentRows } = await supabase
      .from("team_agents")
      .select(
        "id, agent_id, custom_name, sort_order, agent:agents(id, slug, name, description, division, emoji, color)"
      )
      .eq("team_id", teamId)
      .order("sort_order");

    setTeamAgents(
      (agentRows ?? []).map((row: Record<string, unknown>) => ({
        ...(row as unknown as TeamAgent),
        agent: Array.isArray(row.agent) ? row.agent[0] : row.agent,
      })) as TeamAgent[]
    );
    setLoading(false);
  }, [supabase, teamId, router]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // Load catalog when picker opens
  useEffect(() => {
    if (!showPicker || catalog.length > 0) return;

    async function loadCatalog() {
      const { data } = await supabase
        .from("agents")
        .select("id, slug, name, description, division, emoji, color")
        .eq("is_system", true)
        .order("name");
      setCatalog(data ?? []);
    }
    loadCatalog();
  }, [showPicker, catalog.length, supabase]);

  const existingAgentIds = useMemo(
    () => new Set(teamAgents.map((ta) => ta.agent_id)),
    [teamAgents]
  );

  const filteredCatalog = useMemo(() => {
    let filtered = catalog.filter((a) => !existingAgentIds.has(a.id));
    if (pickerDivision) {
      filtered = filtered.filter((a) => a.division === pickerDivision);
    }
    if (pickerSearch) {
      const q = pickerSearch.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [catalog, existingAgentIds, pickerDivision, pickerSearch]);

  const divisions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of catalog) {
      if (!existingAgentIds.has(a.id)) {
        counts.set(a.division, (counts.get(a.division) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([div, count]) => ({ division: div, count }))
      .sort((a, b) => a.division.localeCompare(b.division));
  }, [catalog, existingAgentIds]);

  async function handleAddAgent(agent: CatalogAgent) {
    setAdding((prev) => new Set(prev).add(agent.id));

    const { error } = await supabase.from("team_agents").insert({
      team_id: teamId,
      agent_id: agent.id,
      sort_order: teamAgents.length,
    });

    if (error) {
      console.error("Error adding agent:", error.message);
    } else {
      await fetchTeam();
    }
    setAdding((prev) => {
      const next = new Set(prev);
      next.delete(agent.id);
      return next;
    });
  }

  async function handleRemoveAgent(teamAgentId: string) {
    const { error } = await supabase
      .from("team_agents")
      .delete()
      .eq("id", teamAgentId);

    if (error) {
      console.error("Error removing agent:", error.message);
    } else {
      setTeamAgents((prev) => prev.filter((ta) => ta.id !== teamAgentId));
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase
      .from("teams")
      .update({ name: editName.trim(), description: editDesc.trim() || null })
      .eq("id", teamId);

    if (!error) {
      setTeam((prev) =>
        prev
          ? { ...prev, name: editName.trim(), description: editDesc.trim() || null }
          : prev
      );
      setEditing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">Loading team...</p>
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/teams"
          className="rounded-lg p-1.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-5" />
        </Link>

        {editing ? (
          <form onSubmit={handleSaveSettings} className="flex-1 flex gap-3 items-end">
            <div className="flex-1">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Team description..."
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <span>{team.icon}</span>
                {team.name}
              </h1>
              {team.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {team.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
              >
                <Settings className="size-3.5" />
                Edit
              </button>
              <Link
                href={`/teams/${teamId}/chat`}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <MessageSquare className="size-3.5" />
                Chat
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Team Agents */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Agents ({teamAgents.length})
        </h2>
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          <Plus className="size-3.5" />
          Add Agent
        </button>
      </div>

      {teamAgents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <Bot className="size-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            No agents in this team yet. Add agents to get started.
          </p>
          <button
            onClick={() => setShowPicker(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Add Agents
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {teamAgents.map((ta) => (
            <div
              key={ta.id}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-border/80 transition-colors"
            >
              <span
                className="flex size-9 items-center justify-center rounded-lg text-base shrink-0"
                style={{
                  backgroundColor: ta.agent.color + "20",
                }}
              >
                {ta.agent.emoji || ta.agent.name[0]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {ta.custom_name ?? ta.agent.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {ta.agent.description}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: ta.agent.color + "20",
                  color: ta.agent.color,
                }}
              >
                {DIVISION_LABELS[ta.agent.division as Division] ??
                  ta.agent.division}
              </span>
              <button
                onClick={() => handleRemoveAgent(ta.id)}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all"
                title="Remove from team"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Agent Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl">
            {/* Picker header */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-lg font-semibold">Add Agents</h3>
              <button
                onClick={() => {
                  setShowPicker(false);
                  setPickerSearch("");
                  setPickerDivision(null);
                }}
                className="rounded-lg p-1.5 hover:bg-muted transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Search + filters */}
            <div className="border-b border-border p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search agents..."
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setPickerDivision(null)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    !pickerDivision
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                {divisions.map(({ division, count }) => (
                  <button
                    key={division}
                    onClick={() =>
                      setPickerDivision(
                        pickerDivision === division ? null : division
                      )
                    }
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      pickerDivision === division
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {DIVISION_LABELS[division as Division] ?? division} ({count})
                  </button>
                ))}
              </div>
            </div>

            {/* Agent list */}
            <div className="flex-1 overflow-y-auto p-2">
              {filteredCatalog.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No agents found.
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredCatalog.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
                    >
                      <span
                        className="flex size-8 items-center justify-center rounded-lg text-sm shrink-0"
                        style={{ backgroundColor: agent.color + "20" }}
                      >
                        {agent.emoji || agent.name[0]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {agent.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {agent.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddAgent(agent)}
                        disabled={adding.has(agent.id)}
                        className="shrink-0 flex items-center gap-1 rounded-lg bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium hover:bg-primary/20 disabled:opacity-50 transition-colors"
                      >
                        <Plus className="size-3" />
                        {adding.has(agent.id) ? "Adding..." : "Add"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
