"use client";

import { useCallback, useEffect, useState } from "react";
import { DivisionFilter } from "@/components/configurator/division-filter";
import { SearchBar } from "@/components/configurator/search-bar";
import { AgentGrid } from "@/components/configurator/agent-grid";
import { SelectionCart } from "@/components/configurator/selection-cart";
import type { Agent, Division } from "@/types/agent";
import { DIVISION_LABELS, DIVISION_COLORS } from "@/types/agent";
import { createClient } from "@/lib/supabase/client";
import { useMemo } from "react";

export default function ConfiguratorPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [divisions, setDivisions] = useState<
    { division: Division; count: number }[]
  >([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedDivisions, setSelectedDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("agents")
        .select("*")
        .eq("is_system", true)
        .order("name");

      if (selectedDivisions.length > 0) {
        query = query.in("division", selectedDivisions);
      }

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,description.ilike.%${search}%,vibe.ilike.%${search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching agents:", error.message);
        return;
      }

      // Map DB rows to Agent type
      const mapped: Agent[] = (data ?? []).map((row) => ({
        slug: row.slug,
        name: row.name,
        description: row.description,
        division: row.division as Division,
        subDivision: row.sub_division ?? undefined,
        color: row.color,
        emoji: row.emoji,
        vibe: row.vibe,
        filePath: "", // not used with Supabase
      }));

      setAgents(mapped);
      setTotal(mapped.length);
    } catch (err) {
      console.error("Error fetching agents:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedDivisions, supabase]);

  // Load division counts once on mount
  useEffect(() => {
    async function loadDivisions() {
      const { data, error } = await supabase
        .from("agents")
        .select("division")
        .eq("is_system", true);

      if (error || !data) return;

      const counts = new Map<Division, number>();
      for (const row of data) {
        const d = row.division as Division;
        counts.set(d, (counts.get(d) || 0) + 1);
      }

      const divList = Array.from(counts.entries())
        .map(([division, count]) => ({ division, count }))
        .sort((a, b) => a.division.localeCompare(b.division));

      setDivisions(divList);
    }
    loadDivisions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return (
    <div className="flex min-h-screen">
      {/* Left sidebar with division filters */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-card/50 p-4 pt-6 sticky top-0 h-screen overflow-y-auto">
        <DivisionFilter
          divisions={divisions}
          selected={selectedDivisions}
          onChange={setSelectedDivisions}
        />
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-4 pb-24 md:p-6 md:pb-24">
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight mb-1">
            Agent Configurator
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse and select the agents you want to include in your
            configuration.
          </p>
        </div>

        <div className="mb-5 max-w-md">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {/* Mobile division filter hint */}
        <div className="md:hidden mb-4">
          <MobileDivisionFilter
            divisions={divisions}
            selected={selectedDivisions}
            onChange={setSelectedDivisions}
          />
        </div>

        {loading && agents.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-sm text-muted-foreground">
              Loading agents...
            </div>
          </div>
        ) : (
          <AgentGrid agents={agents} total={total} />
        )}
      </main>

      {/* Floating selection cart */}
      <SelectionCart />
    </div>
  );
}

// Compact mobile division filter shown as horizontal scrollable badges
function MobileDivisionFilter({
  divisions,
  selected,
  onChange,
}: {
  divisions: { division: Division; count: number }[];
  selected: Division[];
  onChange: (divisions: Division[]) => void;
}) {
  const toggleDivision = (division: Division) => {
    if (selected.includes(division)) {
      onChange(selected.filter((d) => d !== division));
    } else {
      onChange([...selected, division]);
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
      <button
        onClick={() => onChange([])}
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
          selected.length === 0
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card text-foreground border-border hover:bg-accent"
        }`}
      >
        All
      </button>
      {divisions.map(({ division }) => {
        const isActive = selected.includes(division);
        const color = DIVISION_COLORS[division];
        return (
          <button
            key={division}
            onClick={() => toggleDivision(division)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              isActive
                ? "text-white border-transparent"
                : "bg-card text-foreground border-border hover:bg-accent"
            }`}
            style={
              isActive
                ? { backgroundColor: color, borderColor: color }
                : undefined
            }
          >
            {DIVISION_LABELS[division]}
          </button>
        );
      })}
    </div>
  );
}
