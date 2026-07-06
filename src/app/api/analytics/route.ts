import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/analytics - aggregate stats for Tier 3 features
export async function GET() {
  const [
    openAnomalies,
    recentAnomalies,
    openGroups,
    recentGroups,
    activeJourneys,
    journeyRuns24h,
    dedupRecords,
    postmortems,
  ] = await Promise.all([
    db.anomalyAlert.count({ where: { status: 'open' } }),
    db.anomalyAlert.findMany({
      where: { detectedAt: { gte: new Date(Date.now() - 24 * 3600_000) } },
      orderBy: { detectedAt: 'desc' },
      take: 10,
      include: { monitor: { select: { id: true, name: true, type: true } } },
    }),
    db.incidentGroup.count({ where: { status: 'open' } }),
    db.incidentGroup.findMany({
      where: { startedAt: { gte: new Date(Date.now() - 7 * 86400_000) } },
      orderBy: { startedAt: 'desc' },
      take: 5,
    }),
    db.journey.count({ where: { enabled: true } }),
    db.journeyRun.count({ where: { checkedAt: { gte: new Date(Date.now() - 86400_000) } } }),
    db.alertDedup.findMany({
      where: { status: 'active' },
      orderBy: { lastSeenAt: 'desc' },
      take: 10,
    }),
    db.postmortem.count(),
  ])

  const totalSuppressed = await db.alertDedup.aggregate({ _sum: { suppressed: true } })
  const totalAlerts = await db.alertDedup.aggregate({ _sum: { count: true } })
  const suppressionRate = (totalAlerts._sum.count || 0) > 0
    ? (((totalSuppressed._sum.suppressed || 0) / (totalAlerts._sum.count || 1)) * 100).toFixed(1)
    : '0.0'

  return NextResponse.json({
    anomalies: {
      open: openAnomalies,
      recent: recentAnomalies,
    },
    incidentGroups: {
      open: openGroups,
      recent: recentGroups,
    },
    journeys: {
      active: activeJourneys,
      runs24h: journeyRuns24h,
    },
    dedup: {
      activeRecords: dedupRecords.length,
      totalSuppressed: totalSuppressed._sum.suppressed || 0,
      totalAlerts: totalAlerts._sum.count || 0,
      suppressionRate: `${suppressionRate}%`,
      records: dedupRecords,
    },
    postmortems: {
      total: postmortems,
    },
  })
}
