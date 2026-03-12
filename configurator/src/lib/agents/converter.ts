import { getAgentBody } from "./parser";
import type { Agent } from "@/types/agent";

const SOUL_KEYWORDS = [
  "identity",
  "communication",
  "style",
  "critical rule",
  "rules you must follow",
];

interface OpenClawFiles {
  "SOUL.md": string;
  "AGENTS.md": string;
  "IDENTITY.md": string;
}

export function convertToOpenClaw(agent: Agent): OpenClawFiles {
  const body = getAgentBody(agent.filePath);
  const lines = body.split("\n");

  let soulContent = "";
  let agentsContent = "";
  let currentTarget: "soul" | "agents" = "agents";
  let currentSection = "";

  for (const line of lines) {
    if (line.match(/^##\s/)) {
      // Flush previous section
      if (currentSection) {
        if (currentTarget === "soul") {
          soulContent += currentSection;
        } else {
          agentsContent += currentSection;
        }
      }
      currentSection = "";

      // Classify header
      const headerLower = line.toLowerCase();
      const isSoul = SOUL_KEYWORDS.some((kw) => headerLower.includes(kw));
      currentTarget = isSoul ? "soul" : "agents";
    }

    currentSection += line + "\n";
  }

  // Flush final section
  if (currentSection) {
    if (currentTarget === "soul") {
      soulContent += currentSection;
    } else {
      agentsContent += currentSection;
    }
  }

  // Build IDENTITY.md
  let identity: string;
  if (agent.emoji && agent.vibe) {
    identity = `# ${agent.emoji} ${agent.name}\n${agent.vibe}\n`;
  } else {
    identity = `# ${agent.name}\n${agent.description}\n`;
  }

  return {
    "SOUL.md": soulContent.trim() + "\n",
    "AGENTS.md": agentsContent.trim() + "\n",
    "IDENTITY.md": identity,
  };
}
