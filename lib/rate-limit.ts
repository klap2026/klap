/**
 * In-memory rate limiter
 *
 * Tracks requests by identifier (IP address or user ID) and enforces limits
 * within a sliding time window. For production with multiple instances,
 * consider using Redis or similar distributed cache.
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

// Store rate limit records in memory
const rateLimitMap = new Map<string, RateLimitRecord>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitOptions {
  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  windowMs?: number
  /**
   * Maximum number of requests in the time window
   * @default 10
   */
  max?: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (IP address or user ID)
 * @param options - Rate limit configuration
 * @returns Result indicating if request is allowed and current status
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const windowMs = options.windowMs ?? 60000 // Default: 1 minute
  const max = options.max ?? 10 // Default: 10 requests

  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  // No existing record or window has expired
  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs
    rateLimitMap.set(identifier, { count: 1, resetTime })

    return {
      success: true,
      limit: max,
      remaining: max - 1,
      resetTime,
    }
  }

  // Increment count in current window
  record.count++

  // Check if limit exceeded
  if (record.count > max) {
    return {
      success: false,
      limit: max,
      remaining: 0,
      resetTime: record.resetTime,
    }
  }

  return {
    success: true,
    limit: max,
    remaining: max - record.count,
    resetTime: record.resetTime,
  }
}

/**
 * Extract IP address from request headers
 * Checks X-Forwarded-For, X-Real-IP, and falls back to remote address
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback - in development this might be undefined
  return 'unknown'
}

/**
 * Create rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  }
}
