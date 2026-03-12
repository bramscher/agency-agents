"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Plus, Users, Bot } from "lucide-react";

interface Team {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  agent_count: number;
  created_at: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const fetchTeams = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data, error } = await supabase
      .from("teams")
      .select("id, name, description, icon, color, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching teams:", error.message);
      return;
    }

    // Get agent counts per team
    const teamIds = (data ?? []).map((t) => t.id);
    const { data: counts } = await supabase
      .from("team_agents")
      .select("team_id")
      .in("team_id", teamIds);

    const countMap = new Map<string, number>();
    for (const row of counts ?? []) {
      countMap.set(row.team_id, (countMap.get(row.team_id) ?? 0) + 1);
    }

    setTeams(
      (data ?? []).map((t) => ({
        ...t,
        agent_count: countMap.get(t.id) ?? 0,
      }))
    );
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("teams")
      .insert({ name: newName.trim(), user_id: user.id })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating team:", error.message);
      setCreating(false);
      return;
    }

    router.push(`/teams/${data.id}`);
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight mb-1">My Teams</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage your agent teams.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          New Team
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-6 flex gap-3 items-end p-4 rounded-lg border border-border bg-card"
        >
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1.5">
              Team Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Marketing Squad"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating..." : "Create"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCreate(false);
              setNewName("");
            }}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">Loading teams...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="size-12 text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-semibold mb-1">No teams yet</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Create a team to group agents together for your projects.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Create your first team
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="group rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex size-10 items-center justify-center rounded-lg text-lg"
                  style={{ backgroundColor: team.color + "20", color: team.color }}
                >
                  {team.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                    {team.name}
                  </h3>
                  {team.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {team.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Bot className="size-3" />
                    <span>
                      {team.agent_count} agent{team.agent_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
