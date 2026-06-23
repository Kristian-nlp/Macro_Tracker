import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { entries, settings, templates, users } from "@/lib/schema";
import { currentUser } from "@/lib/auth-server";
import { COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Permanently delete the signed-in account and everything scoped to it:
// logged meals, favourites, settings, then the user record. Clears the session.
export async function DELETE() {
  const username = currentUser();
  if (!username) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = getDb();
  await db.delete(entries).where(eq(entries.username, username));
  await db.delete(templates).where(eq(templates.username, username));
  await db.delete(settings).where(eq(settings.username, username));
  await db.delete(users).where(eq(users.username, username));

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
