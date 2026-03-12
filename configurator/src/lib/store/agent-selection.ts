"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Agent, AgentConfig } from "@/types/agent";

interface AgentSelectionState {
  selected: Map<string, AgentConfig>;
  addAgent: (agent: Agent) => void;
  removeAgent: (slug: string) => void;
  toggleAgent: (agent: Agent) => void;
  isSelected: (slug: string) => boolean;
  clearAll: () => void;
  setFromSlugs: (slugs: string[], allAgents: Agent[]) => void;
  updateConfig: (slug: string, updates: Partial<AgentConfig>) => void;
  getSelectedArray: () => AgentConfig[];
  count: () => number;
}

function agentToConfig(agent: Agent): AgentConfig {
  return {
    ...agent,
    includeSoul: true,
    includeAgents: true,
    includeIdentity: true,
  };
}

export const useAgentSelection = create<AgentSelectionState>()(
  persist(
    (set, get) => ({
      selected: new Map(),

      addAgent: (agent) =>
        set((state) => {
          const next = new Map(state.selected);
          next.set(agent.slug, agentToConfig(agent));
          return { selected: next };
        }),

      removeAgent: (slug) =>
        set((state) => {
          const next = new Map(state.selected);
          next.delete(slug);
          return { selected: next };
        }),

      toggleAgent: (agent) => {
        if (get().selected.has(agent.slug)) {
          get().removeAgent(agent.slug);
        } else {
          get().addAgent(agent);
        }
      },

      isSelected: (slug) => get().selected.has(slug),

      clearAll: () => set({ selected: new Map() }),

      setFromSlugs: (slugs, allAgents) => {
        const next = new Map<string, AgentConfig>();
        for (const slug of slugs) {
          const agent = allAgents.find((a) => a.slug === slug);
          if (agent) next.set(slug, agentToConfig(agent));
        }
        set({ selected: next });
      },

      updateConfig: (slug, updates) =>
        set((state) => {
          const next = new Map(state.selected);
          const existing = next.get(slug);
          if (existing) {
            next.set(slug, { ...existing, ...updates });
          }
          return { selected: next };
        }),

      getSelectedArray: () => Array.from(get().selected.values()),

      count: () => get().selected.size,
    }),
    {
      name: "agent-selection",
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          // Rehydrate Map from array
          if (parsed.state?.selected) {
            parsed.state.selected = new Map(
              Object.entries(parsed.state.selected)
            );
          }
          return parsed;
        },
        setItem: (name, value) => {
          // Serialize Map to object
          const toStore = {
            ...value,
            state: {
              ...value.state,
              selected: Object.fromEntries(value.state.selected),
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
