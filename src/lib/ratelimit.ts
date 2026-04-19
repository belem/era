import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

/**
 * Rate limiter factory. Returns null if Upstash env vars are not configured,
 * so the app works in development without Redis.
 */
function createLimiter(requests: number, window: string) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    analytics: true,
  });
}

// Per design doc: /api/schedule — 60 req/min per student
export const scheduleLimiter = createLimiter(60, "1 m");

// Per design doc: /api/pinyin-gen — 10 req/min per user
export const pinyinLimiter = createLimiter(10, "1 m");

// General API limiter — 30 req/min per user
export const generalLimiter = createLimiter(30, "1 m");

/**
 * Check rate limit for a given identifier.
 * Returns a 429 NextResponse if exceeded, or null if allowed.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<NextResponse | null> {
  if (!limiter) return null; // No limiter configured, allow all

  const { success, reset } = await limiter.limit(identifier);
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }
  return null;
}
