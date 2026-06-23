import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { settings, users } from "@/lib/schema";
import {
  COOKIE_NAME,
  SESSION_MAX_AGE,
  hashPin,
  isValidPin,
  makeSalt,
  normalizeUsername,
  signSession,
  verifyPin,
} from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Throttle attempts so a 4-digit PIN can't be brute-forced online.
  const limit = rateLimit(`login:${clientIp(req)}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const body = await req.json().catch(() => null);
  const username = normalizeUsername(body?.username);
  const pin = String(body?.pin ?? "");
  if (!username) return NextResponse.json({ error: "Enter a username." }, { status: 400 });
  if (!isValidPin(pin)) return NextResponse.json({ error: "PIN must be 4 digits." }, { status: 400 });

  const db = getDb();
  const found = await db.select().from(users).where(eq(users.username, username));

  if (found.length) {
    // Existing user — verify the PIN.
    if (!verifyPin(pin, found[0].pinSalt, found[0].pinHash)) {
      return NextResponse.json({ error: "Wrong PIN for that username." }, { status: 401 });
    }
  } else {
    // New username — register it with this PIN and seed a settings row.
    const salt = makeSalt();
    await db.insert(users).values({ username, pinSalt: salt, pinHash: hashPin(pin, salt) });
    await db.insert(settings).values({ username }).onConflictDoNothing();
  }

  const res = NextResponse.json({ username });
  res.cookies.set(COOKIE_NAME, signSession(username), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
