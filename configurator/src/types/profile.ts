export type NexusMode = "full" | "sprint" | "micro";

export interface ProfileTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  agentSlugs: string[];
  defaultNexusMode: NexusMode;
  primaryPhases: number[];
  interAgentEnabled: boolean;
  defaultModel: string;
  tags: string[];
}

export interface SavedProfile {
  id: string;
  name: string;
  description?: string;
  templateId?: string;
  agentSlugs: string[];
  nexusMode: NexusMode;
  primaryPhases: number[];
  interAgent: boolean;
  defaultModel: string;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
