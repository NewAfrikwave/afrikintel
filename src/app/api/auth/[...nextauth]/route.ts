import NextAuth from 'next-auth'
import type { NextRequest } from 'next/server'
import { authOptions } from '@/lib/auth/auth-options'
import { checkRateLimit } from '@/lib/rate-limit'

const nextAuthHandler = NextAuth(authOptions)

async function handler(req: NextRequest, context: any) {
  const limited = await checkRateLimit(req, 'auth')
  if (limited) return limited
  return nextAuthHandler(req as any, context)
}

export { handler as GET, handler as POST }
