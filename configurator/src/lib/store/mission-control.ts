"use client";

import { create } from "zustand";
import type {
  ConnectionState,
  GatewayHealth,
  AgentInfo,
  SessionInfo,
  AgentEventPayload,
  ChatEventPayload,
} from "@/lib/openclaw/types";
import type { AgentSession, Task, Handoff, NexusPhase } from "@/types/nexus";
import {
  MOCK_AGENTS,
  MOCK_TASKS,
  MOCK_HANDOFFS,
  MOCK_METRICS,
  NEXUS_PHASES,
} from "@/lib/nexus/mock-data";

// --- Live agent run tracking ---

export interface LiveRun {
  runId: string;
  agentId: string;
  sessionKey: string;
  status: "running" | "completed" | "error" | "aborted";
  startedAt: number;
  completedAt?: number;
  lastEvent?: string;
}

// --- Activity feed item ---

export interface ActivityItem {
  id: string;
  type: "agent_event" | "chat_event" | "handoff" | "task_update" | "system";
  message: string;
  agentId?: string;
  agentName?: string;
  timestamp: number;
}

// --- Store State ---

interface MissionControlState {
  // Connection
  connectionState: ConnectionState;
  gatewayUrl: string;
  gatewayHealth: GatewayHealth | null;

  // Agents & Sessions
  agents: AgentSession[];
  gatewayAgents: AgentInfo[];
  sessions: SessionInfo[];

  // Pipeline
  phases: NexusPhase[];
  currentPhase: number;

  // Tasks & Handoffs
  tasks: Task[];
  handoffs: Handoff[];

  // Live runs
  liveRuns: Map<string, LiveRun>;

  // Activity feed
  activityFeed: ActivityItem[];

  // Metrics
  metrics: {
    activeAgents: number;
    totalAgents: number;
    tasksInProgress: number;
    tasksCompleted: number;
    totalTasks: number;
    firstPassRate: number;
    avgRetries: number;
    estimatedCost: number;
  };

  // Actions - Connection
  setConnectionState: (state: ConnectionState) => void;
  setGatewayUrl: (url: string) => void;
  setGatewayHealth: (health: GatewayHealth) => void;

  // Actions - Data
  setGatewayAgents: (agents: AgentInfo[]) => void;
  setSessions: (sessions: SessionInfo[]) => void;
  updateAgentStatus: (
    agentId: string,
    status: AgentSession["status"],
    currentTask?: string
  ) => void;

  // Actions - Tasks
  updateTaskStatus: (taskId: string, status: Task["status"]) => void;
  addTask: (task: Task) => void;

  // Actions - Handoffs
  addHandoff: (handoff: Handoff) => void;
  updateHandoffStatus: (handoffId: string, status: Handoff["status"]) => void;

  // Actions - Live Runs
  startRun: (run: LiveRun) => void;
  updateRun: (runId: string, update: Partial<LiveRun>) => void;
  completeRun: (runId: string, status: "completed" | "error" | "aborted") => void;

  // Actions - Activity
  addActivity: (item: Omit<ActivityItem, "id" | "timestamp">) => void;

  // Actions - Events (from WebSocket)
  handleAgentEvent: (payload: AgentEventPayload) => void;
  handleChatEvent: (payload: ChatEventPayload) => void;

  // Actions - Refresh metrics
  refreshMetrics: () => void;
}

let activityCounter = 0;

export const useMissionControlStore = create<MissionControlState>(
  (set, get) => ({
    // Initial state - loaded from mock data
    connectionState: "disconnected",
    gatewayUrl: "ws://127.0.0.1:18789",
    gatewayHealth: null,

    agents: MOCK_AGENTS,
    gatewayAgents: [],
    sessions: [],

    phases: NEXUS_PHASES,
    currentPhase: 3,

    tasks: MOCK_TASKS,
    handoffs: MOCK_HANDOFFS,

    liveRuns: new Map(),
    activityFeed: [],

    metrics: {
      activeAgents: MOCK_METRICS.activeAgents,
      totalAgents: MOCK_METRICS.totalAgents,
      tasksInProgress: MOCK_METRICS.tasksInProgress,
      tasksCompleted: MOCK_METRICS.tasksCompleted,
      totalTasks: MOCK_METRICS.totalTasks,
      firstPassRate: MOCK_METRICS.firstPassRate,
      avgRetries: MOCK_METRICS.avgRetries,
      estimatedCost: MOCK_METRICS.estimatedCost,
    },

    // --- Connection ---

    setConnectionState: (connectionState) => set({ connectionState }),
    setGatewayUrl: (gatewayUrl) => set({ gatewayUrl }),
    setGatewayHealth: (gatewayHealth) => set({ gatewayHealth }),

    // --- Data ---

    setGatewayAgents: (gatewayAgents) => set({ gatewayAgents }),
    setSessions: (sessions) => set({ sessions }),

    updateAgentStatus: (agentId, status, currentTask) =>
      set((state) => ({
        agents: state.agents.map((a) =>
          a.agentSlug === agentId || a.id === agentId
            ? {
                ...a,
                status,
                currentTask: currentTask ?? a.currentTask,
                lastActive: new Date().toISOString(),
              }
            : a
        ),
      })),

    // --- Tasks ---

    updateTaskStatus: (taskId, status) =>
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? { ...t, status, updatedAt: new Date().toISOString() }
            : t
        ),
      })),

    addTask: (task) =>
      set((state) => ({ tasks: [...state.tasks, task] })),

    // --- Handoffs ---

    addHandoff: (handoff) =>
      set((state) => ({ handoffs: [handoff, ...state.handoffs] })),

    updateHandoffStatus: (handoffId, status) =>
      set((state) => ({
        handoffs: state.handoffs.map((h) =>
          h.id === handoffId
            ? {
                ...h,
                status,
                ...(status === "completed"
                  ? { completedAt: new Date().toISOString() }
                  : {}),
              }
            : h
        ),
      })),

    // --- Live Runs ---

    startRun: (run) =>
      set((state) => {
        const newRuns = new Map(state.liveRuns);
        newRuns.set(run.runId, run);
        return { liveRuns: newRuns };
      }),

    updateRun: (runId, update) =>
      set((state) => {
        const existing = state.liveRuns.get(runId);
        if (!existing) return state;
        const newRuns = new Map(state.liveRuns);
        newRuns.set(runId, { ...existing, ...update });
        return { liveRuns: newRuns };
      }),

    completeRun: (runId, status) =>
      set((state) => {
        const existing = state.liveRuns.get(runId);
        if (!existing) return state;
        const newRuns = new Map(state.liveRuns);
        newRuns.set(runId, {
          ...existing,
          status,
          completedAt: Date.now(),
        });
        return { liveRuns: newRuns };
      }),

    // --- Activity ---

    addActivity: (item) =>
      set((state) => ({
        activityFeed: [
          {
            ...item,
            id: `act-${++activityCounter}`,
            timestamp: Date.now(),
          },
          ...state.activityFeed.slice(0, 99), // keep last 100
        ],
      })),

    // --- WebSocket Event Handlers ---

    handleAgentEvent: (payload) => {
      const { runId, stream } = payload;
      const state = get();

      // Update live run
      const run = state.liveRuns.get(runId);
      if (run) {
        state.updateRun(runId, { lastEvent: stream });
      }

      // Add to activity feed
      state.addActivity({
        type: "agent_event",
        message: `Agent event: ${stream}`,
        agentId: run?.agentId,
      });
    },

    handleChatEvent: (payload) => {
      const { runId, sessionKey, state: eventState } = payload;
      const store = get();

      if (eventState === "final") {
        store.completeRun(runId, "completed");
        store.addActivity({
          type: "chat_event",
          message: `Task completed in session ${sessionKey}`,
        });
      } else if (eventState === "error") {
        store.completeRun(runId, "error");
        store.addActivity({
          type: "chat_event",
          message: `Error in session ${sessionKey}`,
        });
      } else if (eventState === "aborted") {
        store.completeRun(runId, "aborted");
      }
    },

    // --- Metrics ---

    refreshMetrics: () =>
      set((state) => {
        const activeAgents = state.agents.filter(
          (a) => a.status === "active"
        ).length;
        const tasksInProgress = state.tasks.filter(
          (t) => t.status === "in_progress"
        ).length;
        const tasksCompleted = state.tasks.filter(
          (t) => t.status === "passed"
        ).length;
        const totalTasks = state.tasks.length;

        const agentsWithRate = state.agents.filter(
          (a) => a.tasksCompleted > 0
        );
        const firstPassRate =
          agentsWithRate.length > 0
            ? agentsWithRate.reduce((sum, a) => sum + a.firstPassRate, 0) /
              agentsWithRate.length
            : 0;

        const tasksWithRetries = state.tasks.filter((t) => t.retryCount > 0);
        const avgRetries =
          state.tasks.length > 0
            ? state.tasks.reduce((sum, t) => sum + t.retryCount, 0) /
              state.tasks.length
            : 0;

        return {
          metrics: {
            ...state.metrics,
            activeAgents,
            totalAgents: state.agents.length,
            tasksInProgress,
            tasksCompleted,
            totalTasks,
            firstPassRate,
            avgRetries,
          },
        };
      }),
  })
);
