// One-shot database setup. Reads DATABASE_URL and runs every migration in
// drizzle/ (in filename order). Idempotent — safe to run more than once, and on
// an existing database it applies any new columns. `npm run db:push`
// (drizzle-kit) is an alternative.
//
// Usage:  DATABASE_URL=postgres://... node scripts/setup-db.mjs
import { neon } from "@neondatabase/serverless";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local or your shell.");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "..", "drizzle");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

// Each statement is run on its own (Neon's HTTP driver is one command per call;
// no semicolons appear inside our DDL, so splitting on ";" is safe). Comment
// lines (-- ...) are stripped from each statement before running.
const statements = files.flatMap((f) =>
  readFileSync(join(dir, f), "utf8")
    .split(";")
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter(Boolean),
);

const sql = neon(url);

const run = async () => {
  for (const stmt of statements) {
    await sql.query(stmt);
    console.log("ok:", stmt.split("\n")[0].slice(0, 60));
  }
  console.log(`\nDone — ${statements.length} statements across ${files.length} file(s).`);
};

run().catch((err) => {
  console.error("Setup failed:", err.message || err);
  process.exit(1);
});
