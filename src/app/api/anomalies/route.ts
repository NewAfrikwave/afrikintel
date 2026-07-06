import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/anomalies - list anomaly alerts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'open'
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: Record<string, unknown> = {}
  if (status !== 'all') where.status = status

  const anomalies = await db.anomalyAlert.findMany({
    where,
    orderBy: { detectedAt: 'desc' },
    take: limit,
    include: {
      monitor: { select: { id: true, name: true, type: true, target: true } },
    },
  })
  return NextResponse.json({ anomalies })
}
