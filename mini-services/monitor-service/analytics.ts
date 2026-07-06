// Analytics engine: anomaly detection, incident correlation, alert dedup
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ============================================================
// 1. ANOMALY DETECTION (EWMA + z-score)
// ============================================================
// For each monitor, maintain a rolling baseline of recent metric values.
// When a new check arrives, compute z-score against the baseline.
// If |z| > 2.5 → warning anomaly, |z| > 4 → critical anomaly.
// This fires BEFORE the hard threshold trips, giving early warning.

const EWMA_ALPHA = 0.3 // smoothing factor (0.3 = 30% weight to new value)
const ANOMALY_WARNING_Z = 2.5
const ANOMALY_CRITICAL_Z = 4.0
const MIN_BASELINE_POINTS = 5

// In-memory baselines per monitor per metric
const baselines = new Map<string, { ewma: number; variance: number; count: number }>()

function baselineKey(monitorId: string, metric: string) {
  return `${monitorId}:${metric}`
}

export function updateBaseline(monitorId: string, metric: string, value: number) {
  const key = baselineKey(monitorId, metric)
  const prev = baselines.get(key)
  if (!prev) {
    baselines.set(key, { ewma: value, variance: 0, count: 1 })
    return
  }
  const delta = value - prev.ewma
  const newEwma = prev.ewma + EWMA_ALPHA * delta
  const newVariance = (1 - EWMA_ALPHA) * (prev.variance + EWMA_ALPHA * delta * delta)
  baselines.set(key, { ewma: newEwma, variance: newVariance, count: prev.count + 1 })
}

export function getBaseline(monitorId: string, metric: string) {
  return baselines.get(baselineKey(monitorId, metric))
}

export function computeZScore(monitorId: string, metric: string, value: number): { z: number; baseline: number; sufficient: boolean } {
  const b = getBaseline(monitorId, metric)
  if (!b || b.count < MIN_BASELINE_POINTS) {
    return { z: 0, baseline: b?.ewma || value, sufficient: false }
  }
  const stdDev = Math.sqrt(b.variance)
  if (stdDev < 0.001) return { z: 0, baseline: b.ewma, sufficient: true }
  return { z: (value - b.ewma) / stdDev, baseline: b.ewma, sufficient: true }
}

export async function detectAnomalies(monitor: any, check: any, metricValue: number | null, metricName: string) {
  if (metricValue == null) return
  updateBaseline(monitor.id, metricName, metricValue)
  const { z, baseline, sufficient } = computeZScore(monitor.id, metricName, metricValue)
  if (!sufficient) return

  const absZ = Math.abs(z)
  // Only flag upward anomalies (response time spikes, CPU spikes) — not downward
  if (z < 0) return

  if (absZ >= ANOMALY_CRITICAL_Z) {
    await createAnomalyAlert(monitor, metricName, metricValue, baseline, z, 'critical')
  } else if (absZ >= ANOMALY_WARNING_Z) {
    await createAnomalyAlert(monitor, metricName, metricValue, baseline, z, 'warning')
  }
}

async function createAnomalyAlert(
  monitor: any,
  metric: string,
  value: number,
  baseline: number,
  zScore: number,
  severity: string,
) {
  // Check if there's an open anomaly for this monitor+metric in the last hour
  const oneHourAgo = new Date(Date.now() - 3600_000)
  const existing = await db.anomalyAlert.findFirst({
    where: {
      monitorId: monitor.id,
      metric,
      status: 'open',
      detectedAt: { gte: oneHourAgo },
    },
  })
  if (existing) {
    // Update the last-seen value but don't create a duplicate
    return
  }

  const message = `${metric} anomaly: ${value.toFixed(1)} is ${zScore.toFixed(1)}σ above baseline ${baseline.toFixed(1)}`
  const alert = await db.anomalyAlert.create({
    data: {
      monitorId: monitor.id,
      metric,
      value,
      baseline,
      zScore: +zScore.toFixed(2),
      severity,
      status: 'open',
      message,
    },
  })
  console.log(`[anomaly] ${severity} ${monitor.name} ${metric}: ${value.toFixed(1)} vs baseline ${baseline.toFixed(1)} (z=${zScore.toFixed(2)})`)
  return alert
}

// ============================================================
// 2. INCIDENT CORRELATION (time-window clustering)
// ============================================================
// When a new incident opens, check if other monitors also failed within
// the last 5 minutes. If yes, group them as a correlated incident group.
// Correlation signals: time window, shared tags, shared region, shared infrastructure.

const CORRELATION_WINDOW_MS = 5 * 60_000 // 5 minutes
const MIN_GROUP_SIZE = 2

export async function correlateIncident(incident: any, monitor: any) {
  try {
    const since = new Date(incident.startedAt.getTime() - CORRELATION_WINDOW_MS)
    // Find other open incidents in the time window (excluding this one)
    const nearby = await db.incident.findMany({
      where: {
        id: { not: incident.id },
        startedAt: { gte: since },
        status: { in: ['open', 'acknowledged'] },
      },
      include: { monitor: { select: { id: true, name: true, type: true, region: true, tags: true } } },
    })

    if (nearby.length === 0) return null

    // Compute correlation signals
    const thisTags = (monitor.tags || '').split(',').map((s: string) => s.trim()).filter(Boolean)
    const thisRegion = monitor.region
    const thisType = monitor.type

    let bestGroup: any = null
    let bestScore = 0

    // Check if there's already an open incident group that this should join
    const openGroups = await db.incidentGroup.findMany({
      where: { status: 'open' },
    })
    for (const group of openGroups) {
      const groupMonitorIds = group.monitorIds.split(',').filter(Boolean)
      // Check time proximity
      const groupStart = new Date(group.startedAt).getTime()
      if (Math.abs(incident.startedAt.getTime() - groupStart) > CORRELATION_WINDOW_MS) continue

      // Compute correlation score
      let score = 0
      // Same monitors' tags
      const groupMonitors = await db.monitor.findMany({
        where: { id: { in: groupMonitorIds } },
        select: { tags: true, region: true, type: true },
      })
      for (const gm of groupMonitors) {
        const gmTags = (gm.tags || '').split(',').map((s: string) => s.trim()).filter(Boolean)
        const sharedTags = gmTags.filter((t: string) => thisTags.includes(t))
        if (sharedTags.length > 0) score += 0.3
        if (gm.region === thisRegion) score += 0.2
        if (gm.type === thisType) score += 0.15
      }
      // Time closeness
      const timeDelta = Math.abs(incident.startedAt.getTime() - groupStart) / CORRELATION_WINDOW_MS
      score += (1 - timeDelta) * 0.35

      if (score > bestScore) {
        bestScore = score
        bestGroup = group
      }
    }

    if (bestGroup && bestScore > 0.3) {
      // Join existing group
      const newIncidentIds = bestGroup.incidentIds + ',' + incident.id
      const newMonitorIds = bestGroup.monitorIds + ',' + monitor.id
      const updated = await db.incidentGroup.update({
        where: { id: bestGroup.id },
        data: {
          incidentIds: newIncidentIds,
          monitorIds: newMonitorIds,
          count: bestGroup.count + 1,
          correlationScore: Math.max(bestGroup.correlationScore, bestScore),
          severity: bestGroup.severity === 'warning' && incident.severity === 'critical' ? 'critical' : bestGroup.severity,
        },
      })
      console.log(`[correlation] incident ${incident.id} joined group ${bestGroup.id} (score=${bestScore.toFixed(2)}, count=${updated.count})`)
      return updated
    }

    // Try to start a new group with nearby incidents
    if (nearby.length + 1 >= MIN_GROUP_SIZE) {
      const allIncidents = [incident, ...nearby]
      const allMonitorIds = Array.from(new Set(allIncidents.map((i) => i.monitorId)))
      const allIncidentIds = allIncidents.map((i) => i.id).join(',')

      // Generate root cause hypothesis
      const monitorsInvolved = await db.monitor.findMany({
        where: { id: { in: allMonitorIds } },
        select: { name: true, type: true, region: true, tags: true, target: true },
      })
      const hypothesis = generateRootCauseHypothesis(monitorsInvolved, allIncidents)

      const group = await db.incidentGroup.create({
        data: {
          status: 'open',
          severity: allIncidents.some((i) => i.severity === 'critical') ? 'critical' : 'warning',
          title: `${allIncidents.length} correlated incidents: ${monitorsInvolved.slice(0, 3).map((m) => m.name).join(', ')}${monitorsInvolved.length > 3 ? ` +${monitorsInvolved.length - 3}` : ''}`,
          rootCauseHypothesis: hypothesis,
          incidentIds: allIncidentIds,
          monitorIds: allMonitorIds.join(','),
          count: allIncidents.length,
          correlationScore: 0.7, // initial score for time-correlated group
        },
      })
      console.log(`[correlation] created new group ${group.id} with ${allIncidents.length} incidents`)
      return group
    }
    return null
  } catch (e) {
    console.error('[correlation] error:', e)
    return null
  }
}

function generateRootCauseHypothesis(monitors: any[], incidents: any[]): string {
  // Heuristic root cause analysis
  const hypotheses: string[] = []

  // Same region → regional outage
  const regions = Array.from(new Set(monitors.map((m) => m.region).filter(Boolean)))
  if (regions.length === 1 && monitors.length > 1) {
    hypotheses.push(`Likely regional outage affecting ${regions[0]} — all affected monitors are in this region.`)
  }

  // Same type → service-class issue
  const types = Array.from(new Set(monitors.map((m) => m.type)))
  if (types.length === 1 && monitors.length > 1) {
    hypotheses.push(`All affected monitors are of type "${types[0]}" — possible ${types[0]} service-class issue.`)
  }

  // Shared tags
  const allTags = monitors.flatMap((m) => (m.tags || '').split(',').map((s: string) => s.trim()).filter(Boolean))
  const tagCounts: Record<string, number> = {}
  for (const t of allTags) tagCounts[t] = (tagCounts[t] || 0) + 1
  const sharedTags = Object.entries(tagCounts).filter(([_, c]) => c > 1).map(([t]) => t)
  if (sharedTags.length > 0) {
    hypotheses.push(`Shared tags: ${sharedTags.join(', ')} — possible shared infrastructure dependency.`)
  }

  // Common target domain
  const domains = monitors.map((m) => {
    try {
      const u = new URL(m.target.startsWith('http') ? m.target : `https://${m.target}`)
      return u.hostname
    } catch {
      return null
    }
  }).filter(Boolean)
  const domainCounts: Record<string, number> = {}
  for (const d of domains) if (d) domainCounts[d] = (domainCounts[d] || 0) + 1
  const sharedDomains = Object.entries(domainCounts).filter(([_, c]) => c > 1).map(([d]) => d)
  if (sharedDomains.length > 0) {
    hypotheses.push(`Shared domain: ${sharedDomains.join(', ')} — possible upstream issue.`)
  }

  if (hypotheses.length === 0) {
    hypotheses.push(`Time-correlated failure of ${monitors.length} monitors. No obvious shared dependency — investigate independently.`)
  }

  return hypotheses.join(' ')
}

// ============================================================
// 3. ALERT DEDUP (fingerprint + rate limiting)
// ============================================================
// Each alert has a fingerprint = monitorId + issueType.
// If the same fingerprint fires within the rate-limit window (default 30 min),
// suppress the alert and increment the suppressed counter.
// This prevents alert storms when 8 monitors fail at once for the same root cause.

const DEDUP_WINDOW_MS = 30 * 60_000 // 30 minutes
const REPEAT_ALERT_INTERVAL_MS = 2 * 3600_000 // re-alert every 2 hours for ongoing incidents

export async function shouldSuppressAlert(monitorId: string, issueType: string): Promise<{ suppress: boolean; dedupId?: string }> {
  const fingerprint = `${monitorId}:${issueType}`
  const existing = await db.alertDedup.findUnique({ where: { fingerprint } })

  if (!existing || existing.status === 'resolved') {
    return { suppress: false }
  }

  // Active dedup record exists — check rate limiting
  const now = Date.now()
  const sinceLastAlert = now - existing.lastSeenAt.getTime()

  if (sinceLastAlert < DEDUP_WINDOW_MS) {
    // Suppress — within dedup window
    await db.alertDedup.update({
      where: { id: existing.id },
      data: {
        lastSeenAt: new Date(),
        count: { increment: 1 },
        suppressed: { increment: 1 },
      },
    })
    return { suppress: true, dedupId: existing.id }
  }

  // Past dedup window but still active — check if it's time for a repeat alert
  if (existing.nextAlertAt && now < existing.nextAlertAt.getTime()) {
    // Not yet time to re-alert
    await db.alertDedup.update({
      where: { id: existing.id },
      data: {
        lastSeenAt: new Date(),
        count: { increment: 1 },
        suppressed: { increment: 1 },
      },
    })
    return { suppress: true, dedupId: existing.id }
  }

  // Time for a repeat alert — update and don't suppress
  await db.alertDedup.update({
    where: { id: existing.id },
    data: {
      lastSeenAt: new Date(),
      count: { increment: 1 },
      nextAlertAt: new Date(now + REPEAT_ALERT_INTERVAL_MS),
    },
  })
  return { suppress: false, dedupId: existing.id }
}

export async function recordAlertSent(monitorId: string, issueType: string, incidentId?: string) {
  const fingerprint = `${monitorId}:${issueType}`
  const existing = await db.alertDedup.findUnique({ where: { fingerprint } })
  const now = new Date()
  if (existing) {
    await db.alertDedup.update({
      where: { id: existing.id },
      data: {
        lastSeenAt: now,
        incidentId: incidentId || existing.incidentId,
        nextAlertAt: new Date(now.getTime() + REPEAT_ALERT_INTERVAL_MS),
      },
    })
    return existing.id
  }
  const created = await db.alertDedup.create({
    data: {
      fingerprint,
      monitorId,
      incidentId,
      issueType,
      firstSeenAt: now,
      lastSeenAt: now,
      nextAlertAt: new Date(now.getTime() + REPEAT_ALERT_INTERVAL_MS),
    },
  })
  return created.id
}

export async function resolveAlertDedup(monitorId: string, issueType: string) {
  const fingerprint = `${monitorId}:${issueType}`
  await db.alertDedup.updateMany({
    where: { fingerprint, status: 'active' },
    data: { status: 'resolved' },
  })
}

// Get dedup stats for the dashboard
export async function getDedupStats() {
  const active = await db.alertDedup.count({ where: { status: 'active' } })
  const suppressed = await db.alertDedup.aggregate({ _sum: { suppressed: true } })
  const totalAlerts = await db.alertDedup.aggregate({ _sum: { count: true } })
  return {
    activeDedups: active,
    suppressedAlerts: suppressed._sum.suppressed || 0,
    totalAlerts: totalAlerts._sum.count || 0,
    suppressionRate: totalAlerts._sum.count > 0
      ? ((suppressed._sum.suppressed || 0) / totalAlerts._sum.count * 100).toFixed(1)
      : '0',
  }
}

// ============================================================
// 4. SYNTHETIC MONITORING (journey runner)
// ============================================================
// Runs multi-step journeys. Each step is: navigate, click, type, wait, assert.
// In the sandbox (no browser), we run a lightweight HTTP-only simulation:
// - "navigate" → HTTP GET, check status
// - "click" / "type" → no-op (would need a real browser)
// - "wait" → sleep
// - "assert" → check if previous response contains text
// In production with Playwright installed, this would be replaced with real browser automation.

export async function runJourney(journey: any) {
  const steps = await db.journeyStep.findMany({
    where: { journeyId: journey.id },
    orderBy: { order: 'asc' },
  })
  if (steps.length === 0) {
    return { status: 'degraded' as const, responseTime: 0, errorMessage: 'No steps configured', stepResults: [] }
  }

  const start = Date.now()
  const stepResults: any[] = []
  let lastResponse: string | null = null
  let lastStatusCode: number | null = null
  let journeyStatus: 'up' | 'down' | 'degraded' = 'up'
  let errorMessage: string | null = null

  for (const step of steps) {
    const stepStart = Date.now()
    let stepStatus: 'up' | 'down' | 'degraded' = 'up'
    let stepError: string | null = null

    try {
      switch (step.action) {
        case 'navigate': {
          const controller = new AbortController()
          const timer = setTimeout(() => controller.abort(), (journey.timeout || 60) * 1000)
          const res = await fetch(step.target, {
            signal: controller.signal,
            redirect: 'follow',
            headers: { 'User-Agent': 'Afrikintel-Journey/2.0' },
          })
          clearTimeout(timer)
          lastResponse = await res.text()
          lastStatusCode = res.status
          if (res.status >= 500) {
            stepStatus = 'down'
            stepError = `HTTP ${res.status}`
          } else if (res.status >= 400) {
            stepStatus = 'degraded'
            stepError = `HTTP ${res.status}`
          }
          break
        }
        case 'wait': {
          const ms = parseInt(step.value || '1000')
          await new Promise((r) => setTimeout(r, ms))
          break
        }
        case 'assert': {
          if (!lastResponse) {
            stepStatus = 'down'
            stepError = 'No response to assert against'
          } else if (!lastResponse.includes(step.value || '')) {
            stepStatus = 'down'
            stepError = `Assertion failed: response does not contain "${step.value}"`
          }
          break
        }
        case 'click':
        case 'type':
        case 'screenshot':
          // Simulated in HTTP mode — would need real browser in production
          stepStatus = 'up'
          break
        default:
          stepStatus = 'degraded'
          stepError = `Unknown action: ${step.action}`
      }
    } catch (e: any) {
      stepStatus = 'down'
      stepError = e.message
    }

    const stepDuration = Date.now() - stepStart
    stepResults.push({
      stepId: step.id,
      action: step.action,
      description: step.description,
      status: stepStatus,
      duration: stepDuration,
      error: stepError,
    })

    // Escalate journey status
    if (stepStatus === 'down') {
      journeyStatus = 'down'
      errorMessage = stepError
      break // stop on failure
    } else if (stepStatus === 'degraded' && journeyStatus !== 'down') {
      journeyStatus = 'degraded'
      if (!errorMessage) errorMessage = stepError
    }
  }

  const responseTime = Date.now() - start
  return { status: journeyStatus, responseTime, errorMessage, stepResults }
}

// Journey scheduler (called from tick)
const lastJourneyRun = new Map<string, number>()
export async function tickJourneys() {
  try {
    const journeys = await db.journey.findMany({ where: { enabled: true } })
    const now = Date.now()
    for (const journey of journeys) {
      const last = lastJourneyRun.get(journey.id) || 0
      if (now - last >= journey.interval * 1000) {
        lastJourneyRun.set(journey.id, now)
        const result = await runJourney(journey)
        await db.journeyRun.create({
          data: {
            journeyId: journey.id,
            status: result.status,
            responseTime: result.responseTime,
            errorMessage: result.errorMessage,
            stepResults: JSON.stringify(result.stepResults),
          },
        })
        await db.journey.update({
          where: { id: journey.id },
          data: {
            status: result.status,
            lastChecked: new Date(),
            lastResponseTime: result.responseTime,
            uptime: result.status === 'up'
              ? Math.min(100, (journey.uptime || 99) * 0.999 + 0.1)
              : Math.max(0, (journey.uptime || 99) - 0.1),
          },
        })
        console.log(`[journey] ${journey.name} → ${result.status} in ${result.responseTime}ms`)
      }
    }
  } catch (e) {
    console.error('[journey] tick error:', e)
  }
}

// Get all analytics stats for the dashboard
export async function getAnalyticsStats() {
  const [openAnomalies, openGroups, activeJourneys, dedupStats, recentPostmortems] = await Promise.all([
    db.anomalyAlert.count({ where: { status: 'open' } }),
    db.incidentGroup.count({ where: { status: 'open' } }),
    db.journey.count({ where: { enabled: true } }),
    getDedupStats(),
    db.postmortem.count(),
  ])
  return {
    openAnomalies,
    openGroups,
    activeJourneys,
    dedupStats,
    recentPostmortems,
  }
}

export { db }
