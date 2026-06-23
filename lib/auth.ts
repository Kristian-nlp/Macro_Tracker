import crypto from "crypto";

// Username + 4-digit PIN auth. The session cookie holds the username signed with
// an HMAC so the server can trust it without a sessions table. PINs are stored
// as a salted scrypt hash, never in plaintext.

export const COOKIE_NAME = "mt_user";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Signing secret for the session cookie. Prefer an explicit AUTH_SECRET; fall
// back to DATABASE_URL (a stable server-only value) so the app works without an
// extra env var.
function secret(): string {
  return process.env.AUTH_SECRET || process.env.DATABASE_URL || "insecure-dev-secret";
}

/** Canonicalize a username: lowercase, trimmed, safe characters, max 32. */
export function normalizeUsername(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "")
    .slice(0, 32);
}

export function isValidPin(pin: unknown): boolean {
  return /^\d{4}$/.test(String(pin ?? ""));
}

export function makeSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function hashPin(pin: string, salt: string): string {
  return crypto.scryptSync(String(pin), salt, 32).toString("hex");
}

export function verifyPin(pin: string, salt: string, hash: string): boolean {
  const a = Buffer.from(hashPin(pin, salt), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function signSession(username: string): string {
  const mac = crypto.createHmac("sha256", secret()).update(username).digest("hex");
  const u = Buffer.from(username, "utf8").toString("base64url");
  return `${u}.${mac}`;
}

/** Returns the username if the cookie is a valid signature, else null. */
export function verifySession(value: string | undefined): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  let username: string;
  try {
    username = Buffer.from(value.slice(0, dot), "base64url").toString("utf8");
  } catch {
    return null;
  }
  const mac = value.slice(dot + 1);
  const expected = crypto.createHmac("sha256", secret()).update(username).digest("hex");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return username;
}
