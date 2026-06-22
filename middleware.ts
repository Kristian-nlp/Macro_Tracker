import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, isValidSession } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const authed = await isValidSession(token);
  if (authed) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // API requests get a clean 401 so the client can redirect to /login.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Everything else bounces to the login page.
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except the login flow, Next internals, and public PWA
  // assets (manifest, service worker, icons).
  matcher: [
    "/((?!login|api/login|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icon-192.png|icon-512.png|apple-touch-icon.png|robots.txt).*)",
  ],
};
