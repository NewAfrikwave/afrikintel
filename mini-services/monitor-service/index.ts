import { createServer } from 'http'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { runRealCheck, type CheckResult } from './checks'
import { detectAnomalies, correlateIncident, tickJourneys, getAnalyticsStats, resolveAlertDedup, shouldSuppressAlert, recordAlertSent } from './analytics'

// Crash loudly on unhandled errors so we can see them in logs
process.on('unhandledRejection', (e) => {
  console.error('[FATAL] unhandledRejection:', e)
})
process.on('uncaughtException', (e) => {
  console.error('[FATAL] uncaughtException:', e)
})

const db = new PrismaClient()

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// ============================================================
// Alert dispatch helper - calls the Next.js API to send notifications
// With smart dedup: suppresses repeat alerts within the dedup window
// ============================================================
async function dispatchAlertSafe(payload: Record<string, unknown>) {
  try {
    // Smart dedup: check if this alert should be suppressed
    const monitorId = (payload as any).monitorId || (payload as any).url?.match(/monitor=([^&]+)/)?.[1]
    const issueType = (payload as any).incidentSeverity === 'critical' ? 'down' : 'degraded'
    if (monitorId) {
      const { suppress } = await shouldSuppressAlert(monitorId, issueType)
      if (suppress) {
        console.log(`[alert] suppressed duplicate alert for ${monitorId}:${issueType}`)
        return
      }
      await recordAlertSent(monitorId, issueType, (payload as any).incidentId)
    }
    await fetch('http://localhost:3000/api/alerts/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    // Don't let alert failures break the check engine
    console.error('[alert] dispatch failed:', e)
  }
}

// ============================================================
// In-memory state
// ============================================================
const HISTORY_POINTS = 60
const metricHistory = new Map<string, any[]>()
const stats = {
  totalChecks: 0,
  realChecks: 0,
  simulatedChecks: 0,
  startedAt: Date.now(),
  lastCheckAt: 0 as number,
}

function pushHistory(monitorId: string, point: any) {
  const arr = metricHistory.get(monitorId) || []
  arr.push({ ...point, t: Date.now() })
  if (arr.length > HISTORY_POINTS) arr.shift()
  metricHistory.set(monitorId, arr)
}

function getHistory(monitorId: string) {
  return metricHistory.get(monitorId) || []
}

// ============================================================
// Demo mode helpers - simulator fallback for demo monitors
// ============================================================
const baseLoad = new Map<string, number>()
const incidentStates = new Map<string, { until: number; type: string } | null>()

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function clampPct(v: number) {
  return Math.max(0, Math.min(100, +(v * 100).toFixed(1)))
}

function pickError(type: string) {
  const map: Record<string, string[]> = {
    website: ['Connection timed out', 'DNS resolution failed', 'HTTP 503 Service Unavailable', 'SSL certificate error', 'Connection refused'],
    service: ['Connection refused', 'Port closed', 'Connection timeout', 'Protocol mismatch'],
    server: ['Agent offline', 'Host unreachable', 'SSH authentication failed'],
    ping: ['100% packet loss', 'Host unreachable', 'TTL expired'],
    dns: ['DNS query failed', 'No response from server', 'SERVFAIL'],
    blacklist: ['IP listed on spamhaus', 'IP listed on barracuda'],
  }
  return pick(map[type] || ['Unknown error'])
}

function simulateCheck(monitor: any): CheckResult {
  const id = monitor.id
  if (!baseLoad.has(id)) baseLoad.set(id, 0.3 + Math.random() * 0.4)
  const base = baseLoad.get(id)!
  const jitter = (Math.random() - 0.5) * 0.4

  let state = incidentStates.get(id) || null
  if (!state && Math.random() < 0.03) {
    const type = Math.random() < 0.4 ? 'down' : 'degraded'
    state = { until: Date.now() + (type === 'down' ? 90_000 : 60_000), type }
    incidentStates.set(id, state)
  }
  if (state && Date.now() > state.until) {
    incidentStates.set(id, null)
    state = null
  }

  if (state?.type === 'down') {
    return {
      status: 'down',
      responseTime: null,
      statusCode: monitor.type === 'website' ? 0 : null,
      errorMessage: pickError(monitor.type),
      latency: null,
    }
  }
  if (state?.type === 'degraded') {
    const rt = Math.floor(monitor.thresholdResponseTime * (1 + Math.random()))
    return {
      status: 'degraded',
      responseTime: rt,
      statusCode: monitor.type === 'website' ? 200 : null,
      errorMessage: `Response time ${rt}ms exceeds threshold`,
      latency: rt,
    }
  }

  if (monitor.type === 'website' || monitor.type === 'service') {
    const spike = Math.random() < 0.05 ? Math.random() * 400 : 0
    const rt = Math.max(20, Math.floor(80 + base * 200 + jitter * 100 + spike))
    return {
      status: 'up',
      responseTime: rt,
      statusCode: monitor.type === 'website' ? 200 : null,
      errorMessage: null,
      latency: rt,
    }
  }
  if (monitor.type === 'ping') {
    const latency = Math.max(5, 10 + base * 30 + jitter * 10)
    return { status: 'up', responseTime: Math.floor(latency), statusCode: 0, errorMessage: null, latency }
  }
  if (monitor.type === 'dns') {
    const rt = Math.max(10, Math.floor(20 + base * 50 + jitter * 20))
    return { status: 'up', responseTime: rt, statusCode: 0, errorMessage: null, latency: rt }
  }
  if (monitor.type === 'blacklist') {
    const rt = Math.floor(200 + base * 300)
    return { status: 'up', responseTime: rt, statusCode: 0, errorMessage: null, latency: rt }
  }
  if (monitor.type === 'server') {
    return { status: 'up', responseTime: 1, statusCode: null, errorMessage: null, latency: 1 }
  }
  return { status: 'up', responseTime: 100, statusCode: null, errorMessage: null, latency: 100 }
}

// ============================================================
// Seeding
// ============================================================
async function seed() {
  const count = await db.monitor.count()
  if (count > 0) return

  const monitors = [
    // Real-world targets that will actually be checked
    { name: 'Google', type: 'website', target: 'https://google.com', interval: 60, description: 'Google homepage', region: 'global', tags: 'demo,real' },
    { name: 'Cloudflare', type: 'website', target: 'https://cloudflare.com', interval: 60, description: 'Cloudflare homepage', region: 'global', tags: 'demo,real' },
    { name: 'GitHub', type: 'website', target: 'https://github.com', interval: 60, description: 'GitHub homepage', region: 'global', tags: 'demo,real' },
    { name: 'GitHub API', type: 'service', target: 'api.github.com', port: 443, interval: 60, description: 'GitHub REST API on 443', region: 'global', tags: 'demo,real' },
    { name: 'Google DNS', type: 'service', target: '8.8.8.8', port: 53, interval: 60, description: 'Google public DNS TCP', region: 'global', tags: 'demo,real' },
    { name: 'Cloudflare DNS', type: 'service', target: '1.1.1.1', port: 53, interval: 60, description: 'Cloudflare public DNS TCP', region: 'global', tags: 'demo,real' },
    { name: 'Google DNS Resolve', type: 'dns', target: 'google.com', interval: 60, description: 'DNS resolution check', region: 'global', tags: 'demo,real' },
    { name: 'Cloudflare Ping', type: 'ping', target: '1.1.1.1', interval: 60, description: 'ICMP ping to Cloudflare', region: 'global', tags: 'demo,real' },
    { name: 'Google Ping', type: 'ping', target: '8.8.8.8', interval: 60, description: 'ICMP ping to Google DNS', region: 'global', tags: 'demo,real' },
    { name: 'GitHub Blacklist', type: 'blacklist', target: '140.82.121.4', interval: 300, description: 'Check GitHub IP against major blacklists', region: 'global', tags: 'demo,real' },
  ]

  for (const m of monitors) {
    await db.monitor.create({
      data: {
        ...m,
        status: 'pending',
        uptime: 100,
        responseTime: null,
      },
    })
  }

  await db.user.createMany({
    data: [
      { email: 'admin@afrikintel.com', name: 'Alex Chen', password: 'admin', role: 'admin' },
      { email: 'ops@afrikintel.com', name: 'Sam Rivera', password: 'ops', role: 'editor' },
      { email: 'viewer@afrikintel.com', name: 'Jordan Lee', password: 'view', role: 'viewer' },
    ],
  })

  await db.notificationChannel.createMany({
    data: [
      { type: 'email', name: 'Ops Team Email', config: JSON.stringify({ address: 'ops@afrikintel.com' }), enabled: true },
      { type: 'slack', name: '#alerts Slack', config: JSON.stringify({ webhook: 'https://hooks.slack.com/services/...' }), enabled: true },
      { type: 'webhook', name: 'PagerDuty Webhook', config: JSON.stringify({ url: 'https://events.pagerduty.com/v2/enqueue' }), enabled: true },
      { type: 'sms', name: 'On-call SMS (Twilio)', config: JSON.stringify({ phone: '+15551234567' }), enabled: false },
    ],
  })

  await db.setting.createMany({
    data: [
      { id: 's1', key: 'siteName', value: 'Afrikintel' },
      { id: 's2', key: 'theme', value: 'dark' },
      { id: 's3', key: 'accent', value: 'emerald' },
      { id: 's4', key: 'language', value: 'en' },
      { id: 's5', key: 'timezone', value: 'America/Chicago' },
      { id: 's6', key: 'retentionDays', value: '30' },
      { id: 's7', key: 'demoMode', value: 'false' },
      { id: 's8', key: 'engineStartedAt', value: String(Date.now()) },
    ],
  })

  await db.statusPage.create({
    data: {
      slug: 'main',
      title: 'Afrikintel Status',
      description: 'Real-time status of all monitored services',
      theme: 'dark',
      published: true,
    },
  })

  console.log(`Seeded ${monitors.length} real-target monitors, 3 users, 4 channels`)
}

// ============================================================
// Check runner - decides real vs simulated
// ============================================================
async function getDemoMode(): Promise<boolean> {
  const setting = await db.setting.findUnique({ where: { key: 'demoMode' } })
  return setting?.value === 'true'
}

async function runCheck(monitor: any, region: string = 'default') {
  const id = monitor.id
  if (monitor.paused || !monitor.enabled) return

  const demoMode = await getDemoMode()
  let result: CheckResult

  if (demoMode || monitor.tags?.includes('demo:simulated')) {
    // Simulated check
    result = simulateCheck(monitor)
    stats.simulatedChecks++
  } else {
    // Real check
    try {
      result = await runRealCheck({
        id: monitor.id,
        type: monitor.type,
        target: monitor.target,
        port: monitor.port,
        timeout: monitor.timeout,
        thresholdResponseTime: monitor.thresholdResponseTime,
      })
      stats.realChecks++
    } catch (e: any) {
      result = {
        status: 'down',
        responseTime: null,
        statusCode: null,
        errorMessage: e.message || 'Check execution failed',
        latency: null,
      }
      stats.realChecks++
    }
  }

  stats.totalChecks++
  stats.lastCheckAt = Date.now()

  // Persist check record (trim old)
  await db.check.create({
    data: {
      monitorId: id,
      status: result.status,
      responseTime: result.responseTime,
      statusCode: result.statusCode,
      errorMessage: result.errorMessage,
      latency: result.latency,
      region,
      metadata: JSON.stringify({ ...(result.metadata || {}), region, mode: demoMode ? 'simulated' : 'real' }),
    },
  })
  await db.$executeRawUnsafe(
    `DELETE FROM "Check" WHERE "monitorId" = $1 AND id NOT IN (SELECT id FROM "Check" WHERE "monitorId" = $2 ORDER BY "checkedAt" DESC LIMIT 200)`,
    id, id,
  )

  // For simulated server monitors, also push fake metrics
  if (monitor.type === 'server' && demoMode) {
    const cpuCores = pick([2, 4, 8, 16])
    const ramTotal = pick([8, 16, 32, 64])
    const diskTotal = pick([128, 256, 512, 1024])
    const base = baseLoad.get(id) || 0.4
    const cpuUsage = clampPct(base + (Math.random() - 0.5) * 0.3)
    const ramUsage = clampPct(base * 0.9 + 0.1)
    const diskUsage = clampPct(base * 0.6 + 0.3)
    const metric = {
      cpuUsage, cpuCores, ramTotal, ramUsed: +(ramTotal * ramUsage / 100).toFixed(2), ramUsage,
      diskTotal, diskUsed: +(diskTotal * diskUsage / 100).toFixed(2), diskUsage,
      networkIn: base * 5000, networkOut: base * 3000,
      loadAvg1: +(cpuUsage / 100 * cpuCores).toFixed(2),
      loadAvg5: +(cpuUsage / 100 * cpuCores * 0.9).toFixed(2),
      loadAvg15: +(cpuUsage / 100 * cpuCores * 0.85).toFixed(2),
      uptime: 86400 * (5 + Math.random() * 90),
      processes: Math.floor(80 + Math.random() * 120),
      temperature: 40 + Math.random() * 30,
    }
    await db.serverMetric.create({
      data: { monitorId: id, ...metric, metadata: JSON.stringify({ mode: 'simulated' }) },
    })
    await db.$executeRawUnsafe(
      `DELETE FROM "ServerMetric" WHERE "monitorId" = $1 AND id NOT IN (SELECT id FROM "ServerMetric" WHERE "monitorId" = $2 ORDER BY "recordedAt" DESC LIMIT 200)`,
      id, id,
    )
    pushHistory(id, metric)
  }

  pushHistory(id, {
    status: result.status,
    responseTime: result.responseTime,
    statusCode: result.statusCode,
  })

  // Anomaly detection on response time
  if (result.responseTime != null && result.status === 'up') {
    detectAnomalies(monitor, result, result.responseTime, 'responseTime').catch((e) =>
      console.error('[anomaly] detection error:', e),
    )
  }

  // Update monitor
  const now = new Date()
  const wasUp = monitor.status === 'up'
  const isDown = result.status === 'down'
  const isDegraded = result.status === 'degraded'
  const consecutiveFailures = result.status === 'down' ? (monitor.consecutiveFailures || 0) + 1 : 0
  const uptime = wasUp && result.status === 'up'
    ? Math.min(100, (monitor.uptime || 99.9) * 0.999 + 0.1 * 0.001)
    : result.status === 'up'
      ? Math.min(100, (monitor.uptime || 99) * 0.999 + 0.1)
      : Math.max(0, (monitor.uptime || 99) - 0.05)

  await db.monitor.update({
    where: { id },
    data: {
      status: result.status,
      responseTime: result.responseTime,
      lastChecked: now,
      lastDownAt: isDown ? now : monitor.lastDownAt,
      consecutiveFailures,
      uptime: +uptime.toFixed(3),
    },
  })

  // Incident management
  if (wasUp && (isDown || isDegraded)) {
    const title = isDown ? `${monitor.name} is down` : `${monitor.name} is degraded`
    const severity = isDown ? 'critical' : 'warning'
    const incident = await db.incident.create({
      data: {
        monitorId: id,
        status: 'open',
        severity,
        title,
        description: result.errorMessage || `Monitor reported ${result.status}`,
      },
    })
    await db.incidentUpdate.create({
      data: {
        incidentId: incident.id,
        status: 'open',
        message: result.errorMessage || `Monitor reported ${result.status}`,
        author: demoMode ? 'monitor-engine:simulated' : 'monitor-engine:real',
      },
    })
    io.emit('incident:new', { incident, monitor: { id, name: monitor.name } })
    io.emit('monitor:update', { monitorId: id, status: result.status, responseTime: result.responseTime, incident })

    // Incident correlation — group related incidents
    correlateIncident(incident, monitor).catch((e) =>
      console.error('[correlation] error:', e),
    )

    // Dispatch alert notifications via the Next.js API
    dispatchAlertSafe({
      type: 'incident_new',
      monitorId: id,
      monitorName: monitor.name,
      monitorType: monitor.type,
      monitorTarget: monitor.target,
      incidentId: incident.id,
      incidentTitle: incident.title,
      incidentSeverity: incident.severity,
      incidentStatus: incident.status,
      message: result.errorMessage || `Monitor reported ${result.status}`,
      startedAt: incident.startedAt.toISOString(),
      url: `http://localhost:3000/?monitor=${id}`,
    })
  } else if (!wasUp && result.status === 'up') {
    const open = await db.incident.findFirst({
      where: { monitorId: id, status: { in: ['open', 'acknowledged'] } },
      orderBy: { startedAt: 'desc' },
    })
    if (open) {
      const duration = Math.floor((now.getTime() - open.startedAt.getTime()) / 1000)
      await db.incident.update({
        where: { id: open.id },
        data: { status: 'resolved', resolvedAt: now, duration },
      })
      await db.incidentUpdate.create({
        data: {
          incidentId: open.id,
          status: 'resolved',
          message: 'Service has recovered',
          author: demoMode ? 'monitor-engine:simulated' : 'monitor-engine:real',
        },
      })
      io.emit('incident:resolved', { incident: open, monitor: { id, name: monitor.name } })
      // Resolve the alert dedup record so future failures send a new alert
      resolveAlertDedup(id, open.severity === 'critical' ? 'down' : 'degraded').catch(() => {})
      // Dispatch resolution alert
      dispatchAlertSafe({
        type: 'incident_resolved',
        monitorName: monitor.name,
        monitorType: monitor.type,
        monitorTarget: monitor.target,
        incidentTitle: open.title,
        incidentSeverity: open.severity,
        incidentStatus: 'resolved',
        message: 'Service has recovered automatically',
        startedAt: open.startedAt.toISOString(),
        duration,
        url: `http://localhost:3000/?monitor=${id}`,
      })
    }
    io.emit('monitor:update', { monitorId: id, status: result.status, responseTime: result.responseTime })
  } else {
    io.emit('monitor:update', { monitorId: id, status: result.status, responseTime: result.responseTime })
  }
}

// ============================================================
// Scheduler
// ============================================================
const lastRunAt = new Map<string, number>()

async function tick() {
  try {
    const monitors = await db.monitor.findMany()
    const now = Date.now()
    let checksRun = 0
    await Promise.all(
      monitors.map(async (m) => {
        const last = lastRunAt.get(m.id) || 0
        if (now - last >= m.interval * 1000) {
          lastRunAt.set(m.id, now)
          // Determine check regions: use monitor.checkRegions if set, else fall back to monitor.region, else "default"
          const regions = m.checkRegions
            ? m.checkRegions.split(',').map((r) => r.trim()).filter(Boolean)
            : m.region
              ? [m.region]
              : ['default']
          for (const region of regions) {
            checksRun++
            const fresh = await db.monitor.findUnique({ where: { id: m.id } })
            if (fresh) {
              console.log(`[tick] checking ${fresh.name} (${fresh.type}, ${fresh.target}) from ${region}`)
              await runCheck(fresh, region)
              console.log(`[tick] done ${fresh.name} from ${region} → ${fresh.status}`)
            }
          }
        }
      }),
    )
    if (checksRun > 0) console.log(`[tick] ran ${checksRun} checks at ${new Date().toISOString()}`)
  } catch (e) {
    console.error('Tick error:', e)
  }
}

// ============================================================
// Stats broadcast
// ============================================================
async function broadcastStats() {
  try {
    const monitors = await db.monitor.findMany({
      select: { id: true, name: true, type: true, status: true, responseTime: true, uptime: true, lastChecked: true, region: true },
    })
    const up = monitors.filter((m) => m.status === 'up').length
    const down = monitors.filter((m) => m.status === 'down').length
    const degraded = monitors.filter((m) => m.status === 'degraded').length
    const openIncidents = await db.incident.count({ where: { status: { in: ['open', 'acknowledged'] } } })
    const avgResp = monitors.filter((m) => m.responseTime).reduce((a, m) => a + (m.responseTime || 0), 0) /
      Math.max(1, monitors.filter((m) => m.responseTime).length)
    const avgUptime = monitors.reduce((a, m) => a + (m.uptime || 0), 0) / Math.max(1, monitors.length)
    const demoMode = await getDemoMode()

    io.emit('stats:update', {
      total: monitors.length,
      up, down, degraded,
      openIncidents,
      avgResponseTime: Math.round(avgResp || 0),
      avgUptime: +avgUptime.toFixed(2),
      timestamp: Date.now(),
      engine: {
        demoMode,
        totalChecks: stats.totalChecks,
        realChecks: stats.realChecks,
        simulatedChecks: stats.simulatedChecks,
        uptime: Math.floor((Date.now() - stats.startedAt) / 1000),
        lastCheckAt: stats.lastCheckAt,
      },
      monitors: monitors.map((m) => ({
        id: m.id, name: m.name, type: m.type, status: m.status,
        responseTime: m.responseTime, uptime: m.uptime, region: m.region, lastChecked: m.lastChecked,
      })),
    })
  } catch (e) {
    console.error('Broadcast stats error:', e)
  }
}

// ============================================================
// Socket handlers
// ============================================================
io.on('connection', (socket) => {
  socket.on('subscribe:monitor', async (monitorId: string) => {
    socket.join(`monitor:${monitorId}`)
    socket.emit('monitor:history', { monitorId, history: getHistory(monitorId) })
  })
  socket.on('unsubscribe:monitor', (monitorId: string) => {
    socket.leave(`monitor:${monitorId}`)
  })
  socket.on('request:stats', async () => {
    await broadcastStats()
  })
  socket.on('request:history', async (monitorId: string) => {
    socket.emit('monitor:history', { monitorId, history: getHistory(monitorId) })
  })
  socket.on('request:engine', async () => {
    const demoMode = await getDemoMode()
    socket.emit('engine:status', {
      demoMode,
      totalChecks: stats.totalChecks,
      realChecks: stats.realChecks,
      simulatedChecks: stats.simulatedChecks,
      uptime: Math.floor((Date.now() - stats.startedAt) / 1000),
      lastCheckAt: stats.lastCheckAt,
      startedAt: stats.startedAt,
    })
  })
  socket.on('test:connection', async (data: { type: string; target: string; port?: number }, ack?: (r: CheckResult) => void) => {
    const { runRealCheck } = await import('./checks')
    const result = await runRealCheck({
      id: 'test',
      type: data.type,
      target: data.target,
      port: data.port || null,
      timeout: 10,
      thresholdResponseTime: 5000,
    })
    if (ack) ack(result)
    else socket.emit('test:connection:result', result)
  })
})

// ============================================================
// HTTP endpoint for server agent pushes (POST /agent-report)
// ============================================================
httpServer.on('request', async (req, res) => {
  if (req.method === 'POST' && req.url === '/agent-report') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', async () => {
      try {
        const data = JSON.parse(body)
        const { monitorId, token, metrics } = data
        if (!monitorId || !metrics) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'monitorId and metrics required' }))
          return
        }
        // Find the monitor
        const monitor = await db.monitor.findUnique({ where: { id: monitorId } })
        if (!monitor || monitor.type !== 'server') {
          res.writeHead(404, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'monitor not found or not a server monitor' }))
          return
        }
        // Validate token if set (for now, accept any non-empty)
        if (!token && monitor.description?.includes('[auth]')) {
          res.writeHead(401, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'agent token required' }))
          return
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
            loadAvg1: metrics.loadAvg1 || null,
            loadAvg5: metrics.loadAvg5 || null,
            loadAvg15: metrics.loadAvg15 || null,
            uptime: metrics.uptime || null,
            processes: metrics.processes || null,
            temperature: metrics.temperature || null,
            metadata: JSON.stringify({ agent: true, hostname: metrics.hostname, os: metrics.os }),
          },
        })
        await db.$executeRawUnsafe(
          `DELETE FROM "ServerMetric" WHERE "monitorId" = $1 AND id NOT IN (SELECT id FROM "ServerMetric" WHERE "monitorId" = $2 ORDER BY "recordedAt" DESC LIMIT 200)`,
          monitorId, monitorId,
        )

        // Update monitor status based on thresholds
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
              author: 'monitor-engine:agent',
            },
          })
          io.emit('incident:new', { incident, monitor: { id: monitorId, name: monitor.name } })
        }

        pushHistory(monitorId, metrics)
        io.emit('monitor:update', { monitorId, status, responseTime: null })

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, status }))
      } catch (e: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: e.message }))
      }
    })
    return
  }
  if (req.method === 'GET' && req.url === '/engine-status') {
    const demoMode = await getDemoMode()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      demoMode,
      totalChecks: stats.totalChecks,
      realChecks: stats.realChecks,
      simulatedChecks: stats.simulatedChecks,
      uptime: Math.floor((Date.now() - stats.startedAt) / 1000),
      lastCheckAt: stats.lastCheckAt,
      startedAt: stats.startedAt,
    }))
    return
  }
})

// ============================================================
// Boot
// ============================================================
const PORT = 3003
;(async () => {
  await seed()
  // Run first check immediately
  setTimeout(() => tick(), 1500)
  // Then every 5s check if any monitor is due
  setInterval(tick, 5000)
  // Run journey checks every 10s
  setInterval(() => tickJourneys().catch((e) => console.error('[journey] tick error:', e)), 10000)
  // Broadcast stats every 3s
  setInterval(broadcastStats, 3000)

  httpServer.listen(PORT, () => {
    console.log(`Afrikintel monitor-service running on port ${PORT}`)
    console.log(`  Real checks enabled · agent endpoint: POST /agent-report`)
    console.log(`  Engine status: GET /engine-status`)
  })
})()

process.on('SIGTERM', () => { httpServer.close(() => process.exit(0)) })
process.on('SIGINT', () => { httpServer.close(() => process.exit(0)) })
