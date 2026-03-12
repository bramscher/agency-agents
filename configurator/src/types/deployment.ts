export type DeploymentTarget = "mac-local" | "docker" | "aws-lightsail";

export interface DeploymentConfig {
  name: string;
  target: DeploymentTarget;
  gatewayPort: number;
  dashboardPort: number;
  defaultModel: string;
  interAgentEnabled: boolean;
  agents: DeploymentAgent[];
}

export interface DeploymentAgent {
  slug: string;
  name: string;
  customName?: string;
  model?: string;
}

export interface Deployment {
  id: string;
  profileId?: string;
  name: string;
  target: DeploymentTarget;
  agentCount: number;
  status: "generated" | "running" | "stopped" | "error";
  gatewayUrl?: string;
  dashboardUrl?: string;
  packagePath?: string;
  config?: DeploymentConfig;
  createdAt: string;
  updatedAt: string;
}
