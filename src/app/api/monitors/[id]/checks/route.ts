import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const limit = 60
  const checks = await db.check.findMany({
    where: { monitorId: id },
    orderBy: { checkedAt: 'desc' },
    take: limit,
  })
  return NextResponse.json({ checks: checks.reverse() })
}
