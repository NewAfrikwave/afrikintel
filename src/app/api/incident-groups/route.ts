import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/incident-groups - list correlated incident groups
export async function GET() {
  const groups = await db.incidentGroup.findMany({
    orderBy: { startedAt: 'desc' },
    take: 50,
  })

  // Enrich with incident details
  const enriched = await Promise.all(
    groups.map(async (g) => {
      const incidentIds = g.incidentIds.split(',').filter(Boolean)
      const monitorIds = g.monitorIds.split(',').filter(Boolean)
      const incidents = await db.incident.findMany({
        where: { id: { in: incidentIds } },
        select: {
          id: true, title: true, status: true, severity: true,
          startedAt: true, resolvedAt: true, duration: true,
          monitor: { select: { id: true, name: true, type: true } },
        },
      })
      const monitors = await db.monitor.findMany({
        where: { id: { in: monitorIds } },
        select: { id: true, name: true, type: true, region: true, target: true },
      })
      return { ...g, incidents, monitors }
    }),
  )

  return NextResponse.json({ groups: enriched })
}
