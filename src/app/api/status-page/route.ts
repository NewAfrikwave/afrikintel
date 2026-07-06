import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const page = await db.statusPage.findFirst() ||
    await db.statusPage.create({
      data: {
        slug: 'main',
        title: 'Afrikintel Status',
        description: 'Real-time status of all Afrikintel services',
        theme: 'dark',
        published: true,
      },
    })

  const monitors = await db.monitor.findMany({
    where: { public: true },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    select: {
      id: true, name: true, type: true, target: true, status: true,
      uptime: true, description: true, region: true,
    },
  })

  // 90-day uptime history per monitor (grouped by day)
  const since = new Date(Date.now() - 90 * 86400_000)
  const checks = await db.check.findMany({
    where: { checkedAt: { gte: since } },
    select: { monitorId: true, status: true, checkedAt: true },
  })

  const perMonitor: Record<string, { day: number; up: number; total: number }[]> = {}
  for (const m of monitors) {
    perMonitor[m.id] = Array.from({ length: 90 }, (_, i) => ({ day: i, up: 0, total: 0 }))
  }
  for (const c of checks) {
    if (!perMonitor[c.monitorId]) continue
    const daysAgo = Math.floor((Date.now() - c.checkedAt.getTime()) / 86400_000)
    if (daysAgo >= 0 && daysAgo < 90) {
      const bucket = perMonitor[c.monitorId][89 - daysAgo]
      bucket.total++
      if (c.status === 'up') bucket.up++
    }
  }

  const recentIncidents = await db.incident.findMany({
    where: { monitor: { public: true } },
    orderBy: { startedAt: 'desc' },
    take: 10,
    include: { monitor: { select: { name: true } }, updates: { orderBy: { createdAt: 'desc' }, take: 3 } },
  })

  return NextResponse.json({
    page,
    monitors: monitors.map((m) => ({
      ...m,
      uptime90: perMonitor[m.id] || [],
    })),
    recentIncidents,
  })
}
