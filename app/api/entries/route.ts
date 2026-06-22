import { NextResponse } from "next/server";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { entries } from "@/lib/schema";
import { isAuthed } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const int = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));

export async function GET(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const db = getDb();

  let rows;
  if (date) {
    rows = await db.select().from(entries).where(eq(entries.date, date)).orderBy(asc(entries.time));
  } else if (from && to) {
    rows = await db
      .select()
      .from(entries)
      .where(and(gte(entries.date, from), lte(entries.date, to)))
      .orderBy(asc(entries.date), asc(entries.time));
  } else {
    rows = await db.select().from(entries).orderBy(asc(entries.date), asc(entries.time));
  }
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.date !== "string" || typeof body.time !== "string") {
    return NextResponse.json({ error: "date and time are required" }, { status: 400 });
  }

  const row = {
    id: crypto.randomUUID(),
    date: body.date,
    time: body.time,
    label: String(body.label || "Meal").slice(0, 200),
    kcal: int(body.kcal),
    protein: int(body.protein),
    carbs: int(body.carbs),
    fat: int(body.fat),
    note: body.note ? String(body.note).slice(0, 500) : null,
  };

  await getDb().insert(entries).values(row);
  return NextResponse.json(row, { status: 201 });
}
