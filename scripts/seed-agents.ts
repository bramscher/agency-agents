/**
 * Seed all agent markdown files into Supabase.
 *
 * Usage:
 *   npx tsx scripts/seed-agents.ts
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const REPO_ROOT = path.resolve(__dirname, "..");

const DIVISIONS = [
  "design",
  "engineering",
  "game-development",
  "marketing",
  "paid-media",
  "product",
  "project-management",
  "spatial-computing",
  "specialized",
  "strategy",
  "support",
  "testing",
] as const;

const SOUL_KEYWORDS = [
  "identity",
  "communication",
  "style",
  "critical rule",
  "rules you must follow",
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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

function splitContent(body: string): {
  soul: string;
  agents: string;
} {
  const lines = body.split("\n");
  let soulContent = "";
  let agentsContent = "";
  let currentTarget: "soul" | "agents" = "agents";
  let currentSection = "";

  for (const line of lines) {
    if (line.match(/^##\s/)) {
      if (currentSection) {
        if (currentTarget === "soul") soulContent += currentSection;
        else agentsContent += currentSection;
      }
      currentSection = "";
      const headerLower = line.toLowerCase();
      const isSoul = SOUL_KEYWORDS.some((kw) => headerLower.includes(kw));
      currentTarget = isSoul ? "soul" : "agents";
    }
    currentSection += line + "\n";
  }

  if (currentSection) {
    if (currentTarget === "soul") soulContent += currentSection;
    else agentsContent += currentSection;
  }

  return { soul: soulContent.trim(), agents: agentsContent.trim() };
}

async function main() {
  const rows: Array<Record<string, unknown>> = [];

  for (const division of DIVISIONS) {
    const divDir = path.join(REPO_ROOT, division);
    const mdFiles = findMdFiles(divDir);

    for (const filePath of mdFiles) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const { data, content: body } = matter(raw);

        if (!data.name || !data.description) {
          console.warn(`  skip (no name/desc): ${filePath}`);
          continue;
        }

        const relative = path.relative(REPO_ROOT, filePath);
        const parts = relative.split(path.sep);
        const subDivision =
          parts.length > 2
            ? parts.slice(1, parts.length - 1).join("/")
            : null;

        const { soul, agents: agentsText } = splitContent(body.trim());

        const emoji = data.emoji || "";
        const vibe = data.vibe || data.description;
        const identity =
          emoji && vibe
            ? `# ${emoji} ${data.name}\n${vibe}`
            : `# ${data.name}\n${data.description}`;

        rows.push({
          slug: slugify(data.name),
          name: data.name,
          description: data.description,
          division,
          sub_division: subDivision,
          color: data.color || "gray",
          emoji,
          vibe,
          system_prompt: body.trim(),
          soul_content: soul || null,
          agents_content: agentsText || null,
          identity_content: identity,
          default_model: "claude-sonnet-4-20250514",
          is_system: true,
        });
      } catch (err) {
        console.warn(`  error parsing ${filePath}:`, err);
      }
    }
  }

  console.log(`Parsed ${rows.length} agents. Upserting to Supabase...`);

  // Upsert in batches of 50
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error, count } = await supabase
      .from("agents")
      .upsert(batch, { onConflict: "slug", count: "exact" });

    if (error) {
      console.error(`Batch ${i / BATCH + 1} failed:`, error.message);
    } else {
      inserted += count ?? batch.length;
      console.log(
        `  Batch ${i / BATCH + 1}: ${batch.length} agents upserted`
      );
    }
  }

  console.log(`Done. ${inserted} agents in Supabase.`);
}

main().catch(console.error);
