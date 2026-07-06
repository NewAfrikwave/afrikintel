import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const monitors = await db.monitor.findMany({
    select: {
      id: true, name: true, type: true, target: true, status: true,
      uptime: true, responseTime: true, lastChecked: true, region: true,
      description: true, public: true, order: true,
    },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })

  const total = monitors.length
  const up = monitors.filter((m) => m.status === 'up').length
  const down = monitors.filter((m) => m.status === 'down').length
  const degraded = monitors.filter((m) => m.status === 'degraded').length
  const paused = monitors.filter((m) => m.status === 'pending').length
  const openIncidents = await db.incident.count({ where: { status: { in: ['open', 'acknowledged'] } } })
  const resolvedToday = await db.incident.count({
    where: { status: 'resolved', resolvedAt: { gte: new Date(Date.now() - 86400_000) } },
  })
  const totalIncidents = await db.incident.count()
  const avgUptime = total ? monitors.reduce((a, m) => a + (m.uptime || 0), 0) / total : 0
  const avgResp = monitors.filter((m) => m.responseTime).reduce((a, m) => a + (m.responseTime || 0), 0) /
    Math.max(1, monitors.filter((m) => m.responseTime).length)

  // 24h uptime timeline buckets (24 buckets, 1 per hour)
  const since = new Date(Date.now() - 24 * 3600_000)
  const checks = await db.check.findMany({
    where: { checkedAt: { gte: since } },
    select: { monitorId: true, status: true, checkedAt: true },
  })
  const buckets: { hour: number; up: number; total: number }[] = []
  for (let i = 0; i < 24; i++) {
    buckets.push({ hour: i, up: 0, total: 0 })
  }
  for (const c of checks) {
    const hoursAgo = Math.floor((Date.now() - c.checkedAt.getTime()) / 3600_000)
    if (hoursAgo >= 0 && hoursAgo < 24) {
      const bucket = buckets[23 - hoursAgo]
      bucket.total++
      if (c.status === 'up') bucket.up++
    }
  }
  const uptimeTimeline = buckets.map((b) => ({
    hour: b.hour,
    uptime: b.total ? (b.up / b.total) * 100 : 100,
    total: b.total,
  }))

  // Recent incidents
  const recentIncidents = await db.incident.findMany({
    orderBy: { startedAt: 'desc' },
    take: 8,
    include: { monitor: { select: { id: true, name: true, type: true } } },
  })

  // Top monitors by recent activity
  const monitorSummary = monitors.slice(0, 50)

  // Distribution by type
  const byType: Record<string, number> = {}
  for (const m of monitors) byType[m.type] = (byType[m.type] || 0) + 1

  // Distribution by region
  const byRegion: Record<string, number> = {}
  for (const m of monitors) byRegion[m.region || 'unknown'] = (byRegion[m.region || 'unknown'] || 0) + 1

  return NextResponse.json({
    summary: {
      total,
      up,
      down,
      degraded,
      paused,
      openIncidents,
      resolvedToday,
      totalIncidents,
      avgUptime: +avgUptime.toFixed(2),
      avgResponseTime: Math.round(avgResp || 0),
    },
    uptimeTimeline,
    recentIncidents,
    monitors: monitorSummary,
    byType,
    byRegion,
    // Per-region check status (from recent checks)
    byCheckRegion: await getRegionStats(),
  })
}

// Get per-region check counts and status breakdown from recent checks
async function getRegionStats() {
  const since = new Date(Date.now() - 5 * 60_000) // last 5 min
  const checks = await db.check.findMany({
    where: { checkedAt: { gte: since }, region: { not: null } },
    select: { region: true, status: true },
  })
  const regions: Record<string, { total: number; up: number; down: number; degraded: number }> = {}
  for (const c of checks) {
    const r = c.region || 'unknown'
    if (!regions[r]) regions[r] = { total: 0, up: 0, down: 0, degraded: 0 }
    regions[r].total++
    if (c.status === 'up') regions[r].up++
    else if (c.status === 'down') regions[r].down++
    else if (c.status === 'degraded') regions[r].degraded++
  }
  return regions
}
