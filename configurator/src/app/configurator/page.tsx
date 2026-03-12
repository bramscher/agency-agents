"use client";

import { useCallback, useEffect, useState } from "react";
import { DivisionFilter } from "@/components/configurator/division-filter";
import { SearchBar } from "@/components/configurator/search-bar";
import { AgentGrid } from "@/components/configurator/agent-grid";
import { SelectionCart } from "@/components/configurator/selection-cart";
import type { Agent, Division } from "@/types/agent";
import { DIVISION_LABELS, DIVISION_COLORS } from "@/types/agent";

interface AgentsResponse {
  agents: Agent[];
  divisions: { division: Division; count: number }[];
  total: number;
  filtered: number;
}

export default function ConfiguratorPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [divisions, setDivisions] = useState<
    { division: Division; count: number }[]
  >([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedDivisions, setSelectedDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) {
        params.set("q", search);
      }
      if (selectedDivisions.length > 0) {
        params.set("divisions", selectedDivisions.join(","));
      }

      const queryString = params.toString();
      const url = `/api/agents${queryString ? `?${queryString}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch agents: ${res.status}`);
      }
      const data: AgentsResponse = await res.json();

      setAgents(data.agents);
      setTotal(data.total);
      // Only update the division counts on the initial load so counts
      // remain stable when the user is filtering by search query.
      setDivisions((prev) => (prev.length === 0 ? data.divisions : prev));
    } catch (err) {
      console.error("Error fetching agents:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedDivisions]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Reload division counts when the component mounts (always)
  useEffect(() => {
    async function loadDivisions() {
      try {
        const res = await fetch("/api/agents");
        if (res.ok) {
          const data: AgentsResponse = await res.json();
          setDivisions(data.divisions);
        }
      } catch {
        // Silently fail -- the main fetch will also populate divisions
      }
    }
    loadDivisions();
  }, []);

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
