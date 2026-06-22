// Edge-safe auth helpers. No next/headers import here so this module can be used
// from middleware (edge runtime). Server-only helpers live in auth-server.ts.

export const COOKIE_NAME = "mt_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Derive the session cookie value from the shared password. The cookie holds
 * this opaque digest, never the password itself. Uses Web Crypto, which is
 * available in both the edge (middleware) and Node (route handler) runtimes.
 */
export async function sessionTokenFor(password: string): Promise<string> {
  const data = new TextEncoder().encode(`macro-tracker:v1:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string comparison to avoid leaking match progress via timing. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function isValidSession(cookieValue: string | undefined): Promise<boolean> {
  const password = process.env.APP_PASSWORD;
  if (!password || !cookieValue) return false;
  const expected = await sessionTokenFor(password);
  return timingSafeEqual(cookieValue, expected);
}
