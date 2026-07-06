import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const monitor = await db.monitor.findUnique({
    where: { id },
    include: {
      incidents: {
        orderBy: { startedAt: 'desc' },
        take: 10,
        include: { updates: true },
      },
    },
  })
  if (!monitor) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ monitor })
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json()
  const allowed = [
    'name', 'target', 'port', 'interval', 'timeout', 'description', 'tags',
    'region', 'checkRegions', 'thresholdResponseTime', 'thresholdCpu', 'thresholdRam',
    'thresholdDisk', 'thresholdRetries', 'public', 'enabled', 'paused', 'order',
  ]
  const data: Record<string, unknown> = {}
  for (const k of allowed) {
    if (k in body) data[k] = body[k]
  }
  const monitor = await db.monitor.update({ where: { id }, data })
  return NextResponse.json({ monitor })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  await db.monitor.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
