import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/journeys/[id]/runs - list recent runs
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const runs = await db.journeyRun.findMany({
    where: { journeyId: id },
    orderBy: { checkedAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ runs })
}
