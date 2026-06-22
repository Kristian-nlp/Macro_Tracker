import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { templates } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const int = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));

export async function GET() {
  const rows = await getDb().select().from(templates).orderBy(asc(templates.name));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const row = {
    id: crypto.randomUUID(),
    name: String(body.name || "Saved meal").slice(0, 200),
    kcal: int(body.kcal),
    protein: int(body.protein),
    carbs: int(body.carbs),
    fat: int(body.fat),
  };
  await getDb().insert(templates).values(row);
  return NextResponse.json(row, { status: 201 });
}
