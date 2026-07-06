import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/engine - returns engine status
// We compute "running" by checking if any monitor has been checked in the last 60s
export async function GET() {
  // Get demo mode
  const demoSetting = await db.setting.findUnique({ where: { key: 'demoMode' } })
  const demoMode = demoSetting?.value === 'true'

  // Get engine start time
  const startedSetting = await db.setting.findUnique({ where: { key: 'engineStartedAt' } })
  const startedAt = startedSetting ? parseInt(startedSetting.value) : 0

  // Count total checks ever
  const totalChecks = await db.check.count()
  // Count real vs simulated (we tag in metadata)
  const allChecks = await db.check.findMany({
    select: { metadata: true },
    orderBy: { checkedAt: 'desc' },
    take: 1000, // sample last 1000 for performance
  })
  let realChecks = 0
  let simulatedChecks = 0
  for (const c of allChecks) {
    try {
      const meta = JSON.parse(c.metadata || '{}')
      if (meta.mode === 'simulated') simulatedChecks++
      else realChecks++
    } catch {
      realChecks++
    }
  }

  // Determine "running" by checking if any monitor was checked recently
  const recentMonitor = await db.monitor.findFirst({
    where: { lastChecked: { not: null } },
    orderBy: { lastChecked: 'desc' },
    select: { lastChecked: true },
  })
  const lastCheckAt = recentMonitor?.lastChecked?.getTime() || 0
  const running = lastCheckAt > 0 && (Date.now() - lastCheckAt) < 120_000 // checked within last 2 min

  const uptime = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0

  return NextResponse.json({
    running,
    demoMode,
    totalChecks,
    realChecks,
    simulatedChecks,
    uptime,
    lastCheckAt,
    startedAt,
  })
}

// PUT /api/engine - toggle demo mode
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { demoMode } = body
  const value = demoMode ? 'true' : 'false'
  const existing = await db.setting.findUnique({ where: { key: 'demoMode' } })
  if (existing) {
    await db.setting.update({ where: { key: 'demoMode' }, data: { value } })
  } else {
    await db.setting.create({ data: { id: `s_demoMode_${Date.now()}`, key: 'demoMode', value } })
  }
  return NextResponse.json({ ok: true, demoMode: demoMode === true || value === 'true' })
}
