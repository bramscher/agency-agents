import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Agent, Division } from "@/types/agent";

const VALID_DIVISIONS: Division[] = [
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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseAgentFile(filePath: string): Agent | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(content);

    if (!data.name || !data.description) return null;

    // Derive division from directory path
    const repoRoot = path.resolve(process.cwd(), "..");
    const relative = path.relative(repoRoot, filePath);
    const parts = relative.split(path.sep);
    const divisionDir = parts[0] as Division;

    if (!VALID_DIVISIONS.includes(divisionDir)) return null;

    // Check for sub-division (e.g., game-development/unity/)
    const subDivision =
      parts.length > 2 ? parts.slice(1, parts.length - 1).join("/") : undefined;

    return {
      slug: slugify(data.name),
      name: data.name,
      description: data.description,
      division: divisionDir,
      subDivision,
      color: data.color || "gray",
      emoji: data.emoji || "",
      vibe: data.vibe || data.description,
      filePath,
    };
  } catch {
    return null;
  }
}

export function getAgentBody(filePath: string): string {
  const content = fs.readFileSync(filePath, "utf-8");
  const { content: body } = matter(content);
  return body.trim();
}
