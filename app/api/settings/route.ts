import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { settings } from "@/lib/schema";
import { currentUser } from "@/lib/auth-server";
import type { Settings } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const numOrNull = (v: unknown) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(0, n) : null;
};

function toClient(row: typeof settings.$inferSelect): Settings {
  return {
    target: row.target,
    trainingProtein: row.trainingProtein,
    trainingCarbs: row.trainingCarbs,
    trainingFat: row.trainingFat,
    restTarget: row.restTarget,
    restProtein: row.restProtein,
    restCarbs: row.restCarbs,
    restFat: row.restFat,
    trainingDays: Array.isArray(row.trainingDays) ? row.trainingDays : [1, 3, 5, 0],
    overrides: row.overrides && typeof row.overrides === "object" ? row.overrides : {},
  };
}

export async function GET() {
  const username = currentUser();
  if (!username) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = getDb();
  let [row] = await db.select().from(settings).where(eq(settings.username, username));
  if (!row) {
    await db.insert(settings).values({ username }).onConflictDoNothing();
    [row] = await db.select().from(settings).where(eq(settings.username, username));
  }
  return NextResponse.json(toClient(row));
}

export async function PUT(req: Request) {
  const username = currentUser();
  if (!username) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const values = {
    target: numOrNull(b.target),
    trainingProtein: numOrNull(b.trainingProtein),
    trainingCarbs: numOrNull(b.trainingCarbs),
    trainingFat: numOrNull(b.trainingFat),
    restTarget: numOrNull(b.restTarget),
    restProtein: numOrNull(b.restProtein),
    restCarbs: numOrNull(b.restCarbs),
    restFat: numOrNull(b.restFat),
    trainingDays: Array.isArray(b.trainingDays)
      ? b.trainingDays.map((n: unknown) => Math.round(Number(n))).filter((n: number) => n >= 0 && n <= 6)
      : [1, 3, 5, 0],
    overrides:
      b.overrides && typeof b.overrides === "object" && !Array.isArray(b.overrides)
        ? (b.overrides as Record<string, string>)
        : {},
  };

  await getDb()
    .insert(settings)
    .values({ username, ...values })
    .onConflictDoUpdate({ target: settings.username, set: values });

  return NextResponse.json({ ...values } satisfies Settings);
}
