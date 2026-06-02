import { headers } from "next/headers"

interface RateLimitInfo {
  count: number
  resetTime: number
}

// Declare global type properly to avoid @ts-ignore
declare global {
  // eslint-disable-next-line no-var
  var __rateLimitMap: Map<string, RateLimitInfo> | undefined
  // eslint-disable-next-line no-var
  var __rateLimitCleanupInterval: ReturnType<typeof setInterval> | undefined
}

// Use globalThis to persist across hot reloads in dev
const rateLimitMap: Map<string, RateLimitInfo> =
  globalThis.__rateLimitMap ?? (globalThis.__rateLimitMap = new Map())

// Clear expired entries periodically to prevent memory leaks (every 5 minutes)
if (!globalThis.__rateLimitCleanupInterval) {
  globalThis.__rateLimitCleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

/**
 * Checks if a request exceeds the specified limit.
 * 
 * ⚠️ Note: This uses an in-memory Map which resets on serverless cold starts.
 * For production at scale, migrate to Upstash Redis or Vercel KV.
 * 
 * @param key Unique identifier for the operation (e.g., "register")
 * @param limit Max requests allowed in the window
 * @param windowMs Time window in milliseconds
 * @returns Rate limit evaluation result
 */
export async function rateLimit(key: string, limit: number, windowMs: number) {
  const headersList = await headers()
  
  // Resolve client IP address securely
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || headersList.get("x-real-ip") || "127.0.0.1"
  
  const finalKey = `${key}:${ip}`
  const now = Date.now()
  const record = rateLimitMap.get(finalKey)
  
  if (!record) {
    rateLimitMap.set(finalKey, {
      count: 1,
      resetTime: now + windowMs
    })
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs }
  }
  
  if (now > record.resetTime) {
    record.count = 1
    record.resetTime = now + windowMs
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs }
  }
  
  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, reset: record.resetTime }
  }
  
  record.count++
  return { success: true, limit, remaining: limit - record.count, reset: record.resetTime }
}
