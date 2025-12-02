/**
 * Simple in-memory rate limiter for auth endpoints
 * In production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (will reset on server restart)
// For production, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>()

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
}

/**
 * Check if a request is rate limited
 * @param key - Unique identifier (e.g., phone number or IP address)
 * @param config - Rate limit configuration
 * @returns true if rate limited, false otherwise
 */
export function isRateLimited(
  key: string,
  config: RateLimitConfig
): { limited: boolean; retryAfter?: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // No entry exists, create one
  if (!entry) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return { limited: false }
  }

  // Entry has expired, reset it
  if (now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return { limited: false }
  }

  // Entry is still valid, check count
  if (entry.count >= config.maxAttempts) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return { limited: true, retryAfter }
  }

  // Increment count
  entry.count++
  return { limited: false }
}

/**
 * Clear rate limit entry for a key
 * Useful for clearing limits after successful authentication
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key)
}

/**
 * Cleanup expired entries periodically
 * Run this in a background task
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Rate limit configurations
export const RATE_LIMITS = {
  sendOtp: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  verifyOtp: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  login: {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000)
}
