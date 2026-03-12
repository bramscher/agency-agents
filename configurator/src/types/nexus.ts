export type NexusPhaseId = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface NexusPhase {
  id: NexusPhaseId;
  name: string;
  shortName: string;
  description: string;
  status: "completed" | "active" | "upcoming";
  agents: string[];
  gateStatus?: "passed" | "pending" | "blocked";
}

export type TaskStatus =
  | "backlog"
  | "in_progress"
  | "in_qa"
  | "passed"
  | "failed"
  | "blocked";

export type TaskPriority = "critical" | "high" | "medium" | "low";

export interface Task {
  id: string;
  title: string;
  description: string;
  phase: NexusPhaseId;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgent?: string;
  qaAgent?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
}

export type AgentStatus = "active" | "idle" | "error" | "queued";

export interface AgentSession {
  id: string;
  agentSlug: string;
  agentName: string;
  agentEmoji: string;
  division: string;
  status: AgentStatus;
  currentTask?: string;
  phase?: NexusPhaseId;
  lastActive: string;
  tasksCompleted: number;
  firstPassRate: number;
}

export interface Handoff {
  id: string;
  fromAgent: string;
  fromEmoji: string;
  toAgent: string;
  toEmoji: string;
  phase: NexusPhaseId;
  priority: TaskPriority;
  context: string;
  status: "pending" | "accepted" | "completed" | "rejected";
  createdAt: string;
  completedAt?: string;
}

export interface MissionMetrics {
  activeAgents: number;
  totalAgents: number;
  currentPhase: NexusPhaseId;
  phaseName: string;
  tasksInProgress: number;
  tasksCompleted: number;
  totalTasks: number;
  estimatedCost: number;
  firstPassRate: number;
  avgRetries: number;
}
