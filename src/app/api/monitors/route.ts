import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const monitors = await db.monitor.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    include: {
      _count: { select: { incidents: true } },
    },
  })
  return NextResponse.json({ monitors })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    name,
    type,
    target,
    port,
    interval = 60,
    timeout = 30,
    description,
    tags,
    region,
    checkRegions,
    thresholdResponseTime = 2000,
    thresholdCpu = 85,
    thresholdRam = 85,
    thresholdDisk = 90,
    thresholdRetries = 2,
    public: isPublic = true,
  } = body

  if (!name || !type || !target) {
    return NextResponse.json({ error: 'name, type, and target are required' }, { status: 400 })
  }

  const monitor = await db.monitor.create({
    data: {
      name,
      type,
      target,
      port: port ?? null,
      interval,
      timeout,
      description,
      tags,
      region,
      checkRegions,
      thresholdResponseTime,
      thresholdCpu,
      thresholdRam,
      thresholdDisk,
      thresholdRetries,
      public: isPublic,
    },
  })
  return NextResponse.json({ monitor }, { status: 201 })
}
