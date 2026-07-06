import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const monitorId = searchParams.get('monitorId')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (monitorId) where.monitorId = monitorId

  const incidents = await db.incident.findMany({
    where,
    orderBy: { startedAt: 'desc' },
    take: limit,
    include: {
      monitor: { select: { id: true, name: true, type: true } },
      updates: { orderBy: { createdAt: 'desc' } },
    },
  })
  return NextResponse.json({ incidents })
}
