import { NextResponse } from "next/server";
import { COOKIE_NAME, SESSION_MAX_AGE, sessionTokenFor, timingSafeEqual } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    return NextResponse.json({ error: "Server not configured (APP_PASSWORD)" }, { status: 500 });
  }

  let submitted = "";
  try {
    const body = await req.json();
    submitted = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Compare against expected token shape so the check is constant-time even when
  // lengths differ.
  const expected = await sessionTokenFor(password);
  const got = await sessionTokenFor(submitted);
  if (!timingSafeEqual(got, expected)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
