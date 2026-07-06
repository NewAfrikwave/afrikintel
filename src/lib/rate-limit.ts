import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const enabled = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

const limiter = enabled
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
      prefix: 'afrikintel',
    })
  : null

function clientId(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || req.headers.get('x-real-ip') || 'anonymous'
}

export async function checkRateLimit(req: NextRequest, scope: string) {
  if (!limiter) return null

  const result = await limiter.limit(`${scope}:${clientId(req)}`)
  if (result.success) return null

  return NextResponse.json(
    { error: 'Too many requests. Please try again shortly.' },
    {
      status: 429,
      headers: {
        'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
      },
    },
  )
}
