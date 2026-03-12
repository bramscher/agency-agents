/**
 * Run migration SQL against Supabase.
 * Uses the service role key to execute raw SQL via the pg_net extension
 * or falls back to running individual statements.
 *
 * Usage: npx tsx scripts/run-migration.ts
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: { schema: "public" },
});

async function main() {
  const sqlPath = path.resolve(
    __dirname,
    "../configurator/supabase/migrations/001_schema.sql"
  );
  const sql = fs.readFileSync(sqlPath, "utf-8");

  // Split into individual statements (simple split on semicolons not inside strings)
  // We'll use Supabase's rpc to execute raw SQL
  const { error } = await supabase.rpc("exec_sql", { sql_text: sql });

  if (error) {
    // If exec_sql doesn't exist, we need to create it first
    if (error.message.includes("function") || error.message.includes("exec_sql")) {
      console.log("Creating exec_sql helper function...");

      // Create the helper function using the REST API
      const createFnRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        method: "POST",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
      });

      console.log(
        "Can't run raw SQL via client library directly. Please run the migration via the Supabase Dashboard SQL Editor."
      );
      console.log(`\nSQL file: ${sqlPath}`);
      console.log("\nSteps:");
      console.log("1. Go to https://supabase.com/dashboard/project/rblfjfsuwihzkvhspufk/sql");
      console.log("2. Copy-paste the contents of the SQL file");
      console.log("3. Click 'Run'");
      process.exit(1);
    }
    console.error("Migration error:", error.message);
    process.exit(1);
  }

  console.log("Migration completed successfully!");
}

main().catch(console.error);
