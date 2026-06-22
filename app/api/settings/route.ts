import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { settings } from "@/lib/schema";
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
    restTarget: row.restTarget,
    proteinTarget: row.proteinTarget,
    trainingDays: Array.isArray(row.trainingDays) ? row.trainingDays : [1, 3, 5, 0],
    overrides: row.overrides && typeof row.overrides === "object" ? row.overrides : {},
  };
}

export async function GET() {
  const db = getDb();
  let [row] = await db.select().from(settings).where(eq(settings.id, 1));
  if (!row) {
    await db.insert(settings).values({ id: 1 }).onConflictDoNothing();
    [row] = await db.select().from(settings).where(eq(settings.id, 1));
  }
  return NextResponse.json(toClient(row));
}

export async function PUT(req: Request) {
  const b = await req.json().catch(() => ({}));

  const values = {
    target: numOrNull(b.target),
    restTarget: numOrNull(b.restTarget),
    proteinTarget: numOrNull(b.proteinTarget),
    trainingDays: Array.isArray(b.trainingDays)
      ? b.trainingDays.map((n: unknown) => Math.round(Number(n))).filter((n: number) => n >= 0 && n <= 6)
      : [1, 3, 5, 0],
    overrides:
      b.overrides && typeof b.overrides === "object" && !Array.isArray(b.overrides)
        ? (b.overrides as Record<string, string>)
        : {},
  };

  const db = getDb();
  await db
    .insert(settings)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: settings.id, set: values });

  return NextResponse.json({ ...values } satisfies Settings);
}
