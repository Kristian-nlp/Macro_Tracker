// One-shot database setup. Reads DATABASE_URL and runs the initial migration
// (drizzle/0000_init.sql). Idempotent — safe to run more than once. This is the
// simplest path; `npm run db:push` (drizzle-kit) is an alternative.
//
// Usage:  DATABASE_URL=postgres://... node scripts/setup-db.mjs
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local or your shell.");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const sqlText = readFileSync(join(here, "..", "drizzle", "0000_init.sql"), "utf8");

// Split into individual statements (no semicolons appear inside our DDL).
const statements = sqlText
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

const sql = neon(url);

const run = async () => {
  for (const stmt of statements) {
    await sql.query(stmt);
    console.log("ok:", stmt.split("\n")[0].slice(0, 60));
  }
  console.log(`\nDone — ${statements.length} statements applied.`);
};

run().catch((err) => {
  console.error("Setup failed:", err.message || err);
  process.exit(1);
});
