import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter
// For production, consider using Redis or a database-backed solution

const requestCounts = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = 100 // requests per window
const WINDOW_SIZE = 15 * 60 * 1000 // 15 minutes in ms

export async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Get IP from headers or fallback
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             '127.0.0.1'

  const now = Date.now()
  const record = requestCounts.get(ip)

  if (!record || now > record.resetTime) {
    // New window
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + WINDOW_SIZE,
    })
  } else {
    if (record.count >= RATE_LIMIT) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please try again later.',
          retryAfter,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.floor(record.resetTime / 1000).toString(),
          },
        }
      )
    }
    record.count++
  }

  // Return null to indicate request should continue
  return null
}

export function getRateLimitHeaders(remaining: number = RATE_LIMIT - 1): Record<string, string> {
  return {
    'X-RateLimit-Limit': RATE_LIMIT.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.floor(Date.now() / 1000 + 900).toString(),
  }
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(ip)
    }
  }
}, 60 * 60 * 1000)
