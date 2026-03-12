import fs from "fs";
import path from "path";
import { parseAgentFile } from "./parser";
import type { Agent, AgentCatalog, Division } from "@/types/agent";

const AGENT_DIRS: Division[] = [
  "design",
  "engineering",
  "game-development",
  "marketing",
  "paid-media",
  "product",
  "project-management",
  "testing",
  "support",
  "spatial-computing",
  "specialized",
];

function findMdFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findMdFiles(fullPath));
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".md") &&
      entry.name !== "README.md"
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

let cachedCatalog: AgentCatalog | null = null;

export function getRepoRoot(): string {
  // In Docker, agent dirs are mounted at /app/<division> so AGENT_ROOT=/app
  // In dev, cwd is configurator/ so repo root is one level up
  return process.env.AGENT_ROOT ?? path.resolve(process.cwd(), "..");
}

export function buildCatalog(): AgentCatalog {
  if (cachedCatalog) return cachedCatalog;

  const repoRoot = getRepoRoot();
  const agents: Agent[] = [];

  for (const division of AGENT_DIRS) {
    const divDir = path.join(repoRoot, division);
    const mdFiles = findMdFiles(divDir);

    for (const file of mdFiles) {
      const agent = parseAgentFile(file);
      if (agent) agents.push(agent);
    }
  }

  agents.sort((a, b) => a.name.localeCompare(b.name));

  const divisionCounts = new Map<Division, number>();
  for (const agent of agents) {
    divisionCounts.set(agent.division, (divisionCounts.get(agent.division) || 0) + 1);
  }

  const divisions = Array.from(divisionCounts.entries())
    .map(([division, count]) => ({ division, count }))
    .sort((a, b) => a.division.localeCompare(b.division));

  cachedCatalog = { agents, divisions, total: agents.length };
  return cachedCatalog;
}

export function searchAgents(
  catalog: AgentCatalog,
  query?: string,
  divisions?: Division[]
): Agent[] {
  let results = catalog.agents;

  if (divisions && divisions.length > 0) {
    results = results.filter((a) => divisions.includes(a.division));
  }

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.vibe.toLowerCase().includes(q)
    );
  }

  return results;
}
