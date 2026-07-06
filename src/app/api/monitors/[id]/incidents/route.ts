import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const incidents = await db.incident.findMany({
    where: { monitorId: id },
    orderBy: { startedAt: 'desc' },
    take: 20,
    include: { updates: true },
  })
  return NextResponse.json({ incidents })
}
