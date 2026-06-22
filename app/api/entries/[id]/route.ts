import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { entries } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await getDb().delete(entries).where(eq(entries.id, params.id));
  return NextResponse.json({ ok: true });
}
