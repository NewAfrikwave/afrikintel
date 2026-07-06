import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'

// Agent reporting endpoint - accepts metric pushes from Afrikintel server agents
// POST /api/agent/report
// Body: { monitorId, token?, metrics: {...} }
export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'agent-report')
  if (limited) return limited

  try {
    const body = await req.json()
    const { monitorId, token, metrics } = body

    if (!monitorId || !metrics) {
      return NextResponse.json({ error: 'monitorId and metrics required' }, { status: 400 })
    }

    const monitor = await db.monitor.findUnique({ where: { id: monitorId } })
    if (!monitor || monitor.type !== 'server') {
      return NextResponse.json({ error: 'monitor not found or not a server monitor' }, { status: 404 })
    }

    // Token validation (if monitor has token in description like "[auth:abc123]")
    const tokenMatch = monitor.description?.match(/\[auth:(\w+)\]/)
    if (tokenMatch && token !== tokenMatch[1]) {
      return NextResponse.json({ error: 'invalid agent token' }, { status: 401 })
    }

    // Persist metric
    await db.serverMetric.create({
      data: {
        monitorId,
        cpuUsage: metrics.cpuUsage || 0,
        cpuCores: metrics.cpuCores || 1,
        ramTotal: metrics.ramTotal || 0,
        ramUsed: metrics.ramUsed || 0,
        ramUsage: metrics.ramUsage || 0,
        diskTotal: metrics.diskTotal || 0,
        diskUsed: metrics.diskUsed || 0,
        diskUsage: metrics.diskUsage || 0,
        networkIn: metrics.networkIn || 0,
        networkOut: metrics.networkOut || 0,
        loadAvg1: metrics.loadAvg1 ?? null,
        loadAvg5: metrics.loadAvg5 ?? null,
        loadAvg15: metrics.loadAvg15 ?? null,
        uptime: metrics.uptime ?? null,
        processes: metrics.processes ?? null,
        temperature: metrics.temperature ?? null,
        metadata: JSON.stringify({ agent: true, hostname: metrics.hostname, os: metrics.os }),
      },
    })

    // Trim old metrics (>200)
    await db.$executeRawUnsafe(
      `DELETE FROM "ServerMetric" WHERE "monitorId" = $1 AND id NOT IN (SELECT id FROM "ServerMetric" WHERE "monitorId" = $2 ORDER BY "recordedAt" DESC LIMIT 200)`,
      monitorId, monitorId,
    )

    // Update monitor status
    const cpuOver = (metrics.cpuUsage || 0) > monitor.thresholdCpu
    const ramOver = (metrics.ramUsage || 0) > monitor.thresholdRam
    const diskOver = (metrics.diskUsage || 0) > monitor.thresholdDisk
    const status = cpuOver || ramOver || diskOver ? 'degraded' : 'up'

    const wasUp = monitor.status === 'up'
    await db.monitor.update({
      where: { id: monitorId },
      data: {
        status,
        lastChecked: new Date(),
        uptime: status === 'up'
          ? Math.min(100, (monitor.uptime || 99) * 0.999 + 0.1)
          : Math.max(0, (monitor.uptime || 99) - 0.05),
      },
    })

    // Create incident on threshold breach
    if (wasUp && status === 'degraded') {
      const reasons = [
        cpuOver && `CPU ${metrics.cpuUsage?.toFixed(1)}% > ${monitor.thresholdCpu}%`,
        ramOver && `RAM ${metrics.ramUsage?.toFixed(1)}% > ${monitor.thresholdRam}%`,
        diskOver && `Disk ${metrics.diskUsage?.toFixed(1)}% > ${monitor.thresholdDisk}%`,
      ].filter(Boolean)
      const incident = await db.incident.create({
        data: {
          monitorId,
          status: 'open',
          severity: 'warning',
          title: `${monitor.name} threshold exceeded`,
          description: reasons.join('; '),
        },
      })
      await db.incidentUpdate.create({
        data: {
          incidentId: incident.id,
          status: 'open',
          message: reasons.join('; '),
          author: 'agent',
        },
      })
    }

    return NextResponse.json({
      ok: true,
      status,
      monitor: { id: monitorId, name: monitor.name },
      received: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
