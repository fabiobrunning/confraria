import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  store.forEach((entry, key) => {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  })
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

interface RateLimitConfig {
  /** Max number of requests in the window */
  maxRequests: number
  /** Window duration in milliseconds */
  windowMs: number
}

/**
 * In-memory rate limiter for API routes.
 * Returns null if allowed, or a NextResponse 429 if rate limited.
 */
export function rateLimit(
  request: NextRequest,
  routeKey: string,
  config: RateLimitConfig
): NextResponse | null {
  cleanup()

  const ip = getClientIp(request)
  const key = `${routeKey}:${ip}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return null
  }

  entry.count++

  if (entry.count > config.maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em breve.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
        },
      }
    )
  }

  return null
}
