import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"

// Serverless-safe rate limiting backed by Upstash Redis (sliding window).
//
// FAIL-OPEN BY DESIGN: if UPSTASH_REDIS_REST_URL / _TOKEN are not set, every
// limiter is null and checkRateLimit() allows the request. That means the app
// keeps working before Upstash is provisioned — but it also means rate limiting
// is OFF until those env vars exist in the environment. Set them in Vercel to
// turn protection on. (In prod we log once if they're missing.)

// Accept both the Upstash-native names and the KV_* names that Vercel's
// Upstash Marketplace integration injects.
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
const redis = url && token ? new Redis({ url, token }) : null

if (!redis && process.env.NODE_ENV === "production") {
  console.warn("[ratelimit] No Redis REST URL/token (UPSTASH_* or KV_*) — rate limiting is DISABLED (fail-open).")
}

function make(limiter: ReturnType<typeof Ratelimit.slidingWindow>): Ratelimit | null {
  if (!redis) return null
  return new Ratelimit({ redis, limiter, analytics: true, prefix: "meow-rl" })
}

// Tunable limits. These are per-key (usually per-IP or per-user). Rationale:
//  - auth:  brute-force / credential-stuffing surface — kept tight.
//  - write: form/record creation — generous enough for real use, blocks floods.
//  - proxy: third-party API proxies (adzuna/eventbrite/geocoding) — protects
//           our upstream quota/cost from being drained.
//  - sat:   new SAT explanations, each a paid Claude call; cached ones are free.
export const limiters = {
  auth: make(Ratelimit.slidingWindow(8, "15 m")),    // 8 attempts / 15 min
  write: make(Ratelimit.slidingWindow(20, "10 m")),  // 20 writes / 10 min
  proxy: make(Ratelimit.slidingWindow(60, "1 m")),   // 60 calls / min
  sat: make(Ratelimit.slidingWindow(40, "1 h")),     // 40 new SAT explanations / hour (each is a paid Claude call)
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? "unknown"
}

export async function checkRateLimit(
  limiter: Ratelimit | null,
  key: string,
): Promise<{ ok: boolean; reset?: number; remaining?: number }> {
  if (!limiter) return { ok: true } // fail-open when Upstash isn't configured
  try {
    const { success, reset, remaining } = await limiter.limit(key)
    return { ok: success, reset, remaining }
  } catch (e) {
    // If Redis is unreachable, don't hard-block real users — log and allow.
    console.error("[ratelimit] limiter error, allowing request:", e instanceof Error ? e.message : e)
    return { ok: true }
  }
}

/** Standard 429 response with Retry-After. */
export function tooManyRequests(reset?: number): NextResponse {
  const retryAfter = reset ? Math.max(1, Math.ceil((reset - Date.now()) / 1000)) : 60
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again in a moment." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  )
}
