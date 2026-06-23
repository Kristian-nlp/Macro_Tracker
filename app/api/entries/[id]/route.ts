import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { entries } from "@/lib/schema";
import { currentUser } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const int = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const username = currentUser();
  if (!username) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await getDb()
    .delete(entries)
    .where(and(eq(entries.id, params.id), eq(entries.username, username)));
  return NextResponse.json({ ok: true });
}

// Edit a logged meal's values (from the Today detail view).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const username = currentUser();
  if (!username) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const values = {
    label: String(body.label || "Meal").slice(0, 200),
    kcal: int(body.kcal),
    protein: int(body.protein),
    carbs: int(body.carbs),
    fat: int(body.fat),
    note: body.note != null ? String(body.note).slice(0, 500) : null,
  };

  const updated = await getDb()
    .update(entries)
    .set(values)
    .where(and(eq(entries.id, params.id), eq(entries.username, username)))
    .returning();

  if (!updated.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(updated[0]);
}
