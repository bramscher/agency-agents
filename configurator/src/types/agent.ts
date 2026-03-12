export type Division =
  | "design"
  | "engineering"
  | "game-development"
  | "marketing"
  | "paid-media"
  | "product"
  | "project-management"
  | "testing"
  | "support"
  | "spatial-computing"
  | "specialized"
  | "strategy";

export const DIVISION_LABELS: Record<Division, string> = {
  design: "Design",
  engineering: "Engineering",
  "game-development": "Game Development",
  marketing: "Marketing",
  "paid-media": "Paid Media",
  product: "Product",
  "project-management": "Project Management",
  testing: "Testing",
  support: "Support",
  "spatial-computing": "Spatial Computing",
  specialized: "Specialized",
  strategy: "Strategy",
};

export const DIVISION_COLORS: Record<Division, string> = {
  design: "#EC4899",
  engineering: "#3B82F6",
  "game-development": "#8B5CF6",
  marketing: "#F97316",
  "paid-media": "#EF4444",
  product: "#10B981",
  "project-management": "#6366F1",
  testing: "#F59E0B",
  support: "#06B6D4",
  "spatial-computing": "#8B5CF6",
  specialized: "#64748B",
  strategy: "#14B8A6",
};

export interface Agent {
  slug: string;
  name: string;
  description: string;
  division: Division;
  subDivision?: string;
  color: string;
  emoji: string;
  vibe: string;
  filePath: string;
}

export interface AgentConfig extends Agent {
  customName?: string;
  customSlug?: string;
  model?: string;
  includeSoul: boolean;
  includeAgents: boolean;
  includeIdentity: boolean;
}

export interface AgentCatalog {
  agents: Agent[];
  divisions: { division: Division; count: number }[];
  total: number;
}
