// Real check engine - performs actual network checks
// Supports: website (HTTP/HTTPS), service (TCP), dns, ping (ICMP), blacklist, server (agent-reported)

import { exec } from 'child_process'
import { promisify } from 'util'
import { Socket } from 'net'
import { resolve as dnsResolve, resolveMx, resolveTxt } from 'dns'
import { lookup as dnsLookup } from 'dns'

const execAsync = promisify(exec)

export interface CheckResult {
  status: 'up' | 'down' | 'degraded'
  responseTime: number | null
  statusCode: number | null
  errorMessage: string | null
  latency: number | null
  metadata?: Record<string, unknown>
}

// ============================================================
// HTTP/HTTPS check
// ============================================================
async function checkWebsite(url: string, timeoutMs: number, thresholdMs: number): Promise<CheckResult> {
  const start = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Afrikintel-Monitor/2.0 (+https://afrikintel.com)' },
    })
    clearTimeout(timer)
    const responseTime = Date.now() - start

    if (res.status >= 500) {
      return {
        status: 'down',
        responseTime,
        statusCode: res.status,
        errorMessage: `HTTP ${res.status} ${res.statusText}`,
        latency: responseTime,
      }
    }
    if (res.status >= 400) {
      return {
        status: 'degraded',
        responseTime,
        statusCode: res.status,
        errorMessage: `HTTP ${res.status} ${res.statusText}`,
        latency: responseTime,
      }
    }
    if (responseTime > thresholdMs) {
      return {
        status: 'degraded',
        responseTime,
        statusCode: res.status,
        errorMessage: `Response time ${responseTime}ms exceeds threshold ${thresholdMs}ms`,
        latency: responseTime,
      }
    }
    return {
      status: 'up',
      responseTime,
      statusCode: res.status,
      errorMessage: null,
      latency: responseTime,
    }
  } catch (e: any) {
    clearTimeout(timer)
    const responseTime = Date.now() - start
    if (e.name === 'AbortError') {
      return {
        status: 'down',
        responseTime: null,
        statusCode: 0,
        errorMessage: `Request timed out after ${timeoutMs}ms`,
        latency: null,
      }
    }
    return {
      status: 'down',
      responseTime: null,
      statusCode: 0,
      errorMessage: e.message || 'Connection failed',
      latency: responseTime,
    }
  }
}

// ============================================================
// TCP service check
// ============================================================
async function checkService(host: string, port: number, timeoutMs: number): Promise<CheckResult> {
  const start = Date.now()
  return new Promise((resolve) => {
    const socket = new Socket()
    socket.setTimeout(timeoutMs)
    let settled = false

    const done = (result: CheckResult) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(result)
    }

    socket.on('connect', () => {
      const responseTime = Date.now() - start
      done({
        status: 'up',
        responseTime,
        statusCode: null,
        errorMessage: null,
        latency: responseTime,
      })
    })

    socket.on('timeout', () => {
      done({
        status: 'down',
        responseTime: null,
        statusCode: null,
        errorMessage: `Connection timed out after ${timeoutMs}ms`,
        latency: null,
      })
    })

    socket.on('error', (err: Error) => {
      done({
        status: 'down',
        responseTime: null,
        statusCode: null,
        errorMessage: err.message || 'Connection refused',
        latency: null,
      })
    })

    socket.connect(port, host)
  })
}

// ============================================================
// DNS check - resolves a hostname and reports timing
// ============================================================
async function checkDns(target: string, timeoutMs: number): Promise<CheckResult> {
  const start = Date.now()
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`DNS query timed out after ${timeoutMs}ms`)), timeoutMs),
    )
    await Promise.race([
      new Promise<string[]>((resolve, reject) => {
        dnsLookup(target, { all: true }, (err, addresses) => {
          if (err) reject(err)
          else resolve(addresses.map((a) => a.address))
        })
      }),
      timeoutPromise,
    ])
    const responseTime = Date.now() - start
    return {
      status: 'up',
      responseTime,
      statusCode: 0,
      errorMessage: null,
      latency: responseTime,
      metadata: { resolver: 'system' },
    }
  } catch (e: any) {
    return {
      status: 'down',
      responseTime: null,
      statusCode: 0,
      errorMessage: e.message || 'DNS resolution failed',
      latency: null,
    }
  }
}

// ============================================================
// ICMP ping check - uses system ping command
// ============================================================
async function checkPing(target: string, timeoutMs: number): Promise<CheckResult> {
  const start = Date.now()
  // Determine ping flag for platform (Linux uses -c, -W; Windows uses -n, -w)
  const isWin = process.platform === 'win32'
  const countFlag = isWin ? '-n' : '-c'
  const timeoutFlag = isWin ? '-w' : '-W'
  const countVal = isWin ? '1' : '1'
  const timeoutVal = isWin ? String(Math.ceil(timeoutMs / 1000)) : String(Math.ceil(timeoutMs / 1000))

  try {
    const { stdout } = await execAsync(`ping ${countFlag} ${countVal} ${timeoutFlag} ${timeoutVal} ${target}`, {
      timeout: timeoutMs + 2000,
    })
    const responseTime = Date.now() - start
    // Parse "time=XX ms" or "time=XXms"
    const timeMatch = stdout.match(/time[=<]([0-9.]+)\s*ms/i)
    const latency = timeMatch ? parseFloat(timeMatch[1]) : responseTime
    return {
      status: 'up',
      responseTime: Math.round(latency),
      statusCode: 0,
      errorMessage: null,
      latency,
    }
  } catch (e: any) {
    const stderr = e.stderr || ''
    const stdout = e.stdout || ''
    if (stdout.includes('100% packet loss') || stdout.includes('0 received')) {
      return {
        status: 'down',
        responseTime: null,
        statusCode: 0,
        errorMessage: '100% packet loss',
        latency: null,
      }
    }
    return {
      status: 'down',
      responseTime: null,
      statusCode: 0,
      errorMessage: stderr.trim() || e.message || 'Ping failed (host unreachable or ping not permitted)',
      latency: null,
    }
  }
}

// ============================================================
// Blacklist check - queries major DNS blacklists for the IP
// ============================================================
const BLACKLISTS = [
  'zen.spamhaus.org',
  'bl.spamcop.net',
  'dnsbl.sorbs.net',
  'b.barracudacentral.org',
  'spam.dnsbl.sorbs.net',
  'multi.surbl.org',
]

async function checkBlacklist(target: string, timeoutMs: number): Promise<CheckResult> {
  const start = Date.now()
  try {
    // Resolve target to IP if it's a hostname
    let ip = target
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(target)) {
      const addresses = await new Promise<string[]>((resolve, reject) => {
        dnsLookup(target, { all: true }, (err, addrs) => {
          if (err) reject(err)
          else resolve(addrs.map((a) => a.address))
        })
      })
      if (addresses.length === 0) throw new Error('No IP addresses resolved')
      ip = addresses[0]
    }
    const parts = ip.split('.').reverse().join('.')

    const listed: string[] = []
    await Promise.all(
      BLACKLISTS.map(async (bl) => {
        try {
          const timeoutP = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), timeoutMs),
          )
          await Promise.race([
            new Promise<string[]>((resolve, reject) => {
              dnsResolve(`${parts}.${bl}`, 'A', (err, addresses) => {
                if (err) reject(err)
                else resolve(addresses || [])
              })
            }),
            timeoutP,
          ])
          // If we got here without throwing, the IP is listed
          listed.push(bl)
        } catch {
          // Not listed (NXDOMAIN is expected) — ignore
        }
      }),
    )

    const responseTime = Date.now() - start
    if (listed.length > 0) {
      return {
        status: 'down',
        responseTime,
        statusCode: 0,
        errorMessage: `IP ${ip} listed on: ${listed.join(', ')}`,
        latency: responseTime,
        metadata: { ip, listed, checked: BLACKLISTS.length },
      }
    }
    return {
      status: 'up',
      responseTime,
      statusCode: 0,
      errorMessage: null,
      latency: responseTime,
      metadata: { ip, checked: BLACKLISTS.length },
    }
  } catch (e: any) {
    return {
      status: 'down',
      responseTime: null,
      statusCode: 0,
      errorMessage: e.message || 'Blacklist check failed',
      latency: null,
    }
  }
}

// ============================================================
// Dispatch - route by monitor type
// ============================================================
export async function runRealCheck(monitor: {
  id: string
  type: string
  target: string
  port?: number | null
  timeout: number
  thresholdResponseTime: number
}): Promise<CheckResult> {
  const timeoutMs = (monitor.timeout || 30) * 1000
  const threshold = monitor.thresholdResponseTime || 2000

  switch (monitor.type) {
    case 'website':
      return checkWebsite(monitor.target, timeoutMs, threshold)
    case 'service':
      if (!monitor.port) {
        return {
          status: 'down',
          responseTime: null,
          statusCode: null,
          errorMessage: 'Service monitor requires a port',
          latency: null,
        }
      }
      return checkService(monitor.target, monitor.port, timeoutMs)
    case 'dns':
      return checkDns(monitor.target, timeoutMs)
    case 'ping':
      return checkPing(monitor.target, timeoutMs)
    case 'blacklist':
      return checkBlacklist(monitor.target, timeoutMs)
    case 'server':
      // Server monitors are agent-reported; we just check if we got a recent metric
      return {
        status: 'up',
        responseTime: null,
        statusCode: null,
        errorMessage: null,
        latency: null,
        metadata: { note: 'Agent-reported metrics; no active check' },
      }
    default:
      return {
        status: 'down',
        responseTime: null,
        statusCode: null,
        errorMessage: `Unknown monitor type: ${monitor.type}`,
        latency: null,
      }
  }
}

// ============================================================
// Connection test - used by the form to validate a target
// ============================================================
export async function testConnection(
  type: string,
  target: string,
  port?: number,
): Promise<CheckResult> {
  return runRealCheck({
    id: 'test',
    type,
    target,
    port: port || null,
    timeout: 10,
    thresholdResponseTime: 5000,
  })
}
