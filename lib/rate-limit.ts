// Simple per-instance, in-memory sliding-window rate limiter. This is enough to
// stop a leaked URL from running up a large OpenAI bill in normal use. On
// serverless, memory is per-instance and resets on cold start, so this is a
// soft cap rather than a hard global limit. For a durable cross-instance limit,
// wire in Upstash Redis (see UPSTASH_* env vars) behind the same interface.

const hits = new Map<string, number[]>();

export type RateLimitResult = { ok: boolean; remaining: number; retryAfter: number };

export function rateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    hits.set(key, recent);
    const oldest = recent[0];
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    return { ok: false, remaining: 0, retryAfter };
  }

  recent.push(now);
  hits.set(key, recent);

  // Opportunistically prune to keep the map small for a single-user app.
  if (hits.size > 500) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }

  return { ok: true, remaining: limit - recent.length, retryAfter: 0 };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
