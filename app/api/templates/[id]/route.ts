import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { templates } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await getDb().delete(templates).where(eq(templates.id, params.id));
  return NextResponse.json({ ok: true });
}
