import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { entries } from "@/lib/schema";
import { currentUser } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const username = currentUser();
  if (!username) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await getDb()
    .delete(entries)
    .where(and(eq(entries.id, params.id), eq(entries.username, username)));
  return NextResponse.json({ ok: true });
}
