import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const username = currentUser();
  if (!username) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ username });
}
