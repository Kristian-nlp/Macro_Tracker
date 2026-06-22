import { cookies } from "next/headers";
import { COOKIE_NAME, isValidSession } from "./auth";

/**
 * Server-side auth check for route handlers. Reads the httpOnly session cookie
 * and verifies it against APP_PASSWORD. Middleware already gates every route,
 * but the estimate endpoint (and the other API routes) verify again as defense
 * in depth — a leaked URL must not be able to burn Anthropic credits.
 */
export async function isAuthed(): Promise<boolean> {
  const value = cookies().get(COOKIE_NAME)?.value;
  return isValidSession(value);
}
