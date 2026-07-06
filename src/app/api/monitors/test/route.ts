import { NextRequest, NextResponse } from 'next/server'

// POST /api/monitors/test
// Body: { type, target, port? }
// Tests connection to a target without creating a monitor
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, target, port } = body

  if (!type || !target) {
    return NextResponse.json({ error: 'type and target required' }, { status: 400 })
  }

  const timeoutMs = 10000
  const start = Date.now()

  try {
    if (type === 'website') {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const res = await fetch(target, {
          signal: controller.signal,
          redirect: 'follow',
          headers: { 'User-Agent': 'Afrikintel-Monitor/2.0' },
        })
        clearTimeout(timer)
        const rt = Date.now() - start
        return NextResponse.json({
          status: res.status < 400 ? 'up' : res.status >= 500 ? 'down' : 'degraded',
          responseTime: rt,
          statusCode: res.status,
          errorMessage: res.status >= 400 ? `HTTP ${res.status}` : null,
        })
      } catch (e: any) {
        clearTimeout(timer)
        return NextResponse.json({
          status: 'down',
          responseTime: Date.now() - start,
          statusCode: 0,
          errorMessage: e.name === 'AbortError' ? 'Timeout' : e.message,
        })
      }
    }

    if (type === 'service') {
      if (!port) return NextResponse.json({ error: 'port required for service check' }, { status: 400 })
      const { Socket } = await import('net')
      const socket = new (Socket as any)()
      socket.setTimeout(timeoutMs)
      const result = await new Promise<{ status: string; responseTime: number; errorMessage: string | null }>(
        (resolve) => {
          let settled = false
          const done = (r: any) => { if (!settled) { settled = true; socket.destroy(); resolve(r) } }
          socket.on('connect', () => done({ status: 'up', responseTime: Date.now() - start, errorMessage: null }))
          socket.on('timeout', () => done({ status: 'down', responseTime: Date.now() - start, errorMessage: 'Timeout' }))
          socket.on('error', (err: Error) => done({ status: 'down', responseTime: Date.now() - start, errorMessage: err.message }))
          socket.connect(parseInt(port), target)
        },
      )
      return NextResponse.json(result)
    }

    if (type === 'dns') {
      const { lookup } = await import('dns')
      const result = await new Promise<any>((resolve) => {
        lookup(target, { all: true }, (err, addresses) => {
          const rt = Date.now() - start
          if (err) resolve({ status: 'down', responseTime: rt, errorMessage: err.message })
          else resolve({ status: 'up', responseTime: rt, addresses: (addresses as any[]).map((a) => a.address) })
        })
      })
      return NextResponse.json(result)
    }

    if (type === 'ping') {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)
      try {
        const { stdout } = await execAsync(`ping -c 1 -W 10 ${target}`, { timeout: timeoutMs + 5000 })
        const timeMatch = stdout.match(/time[=<]([0-9.]+)\s*ms/i)
        return NextResponse.json({
          status: 'up',
          responseTime: timeMatch ? parseFloat(timeMatch[1]) : Date.now() - start,
          errorMessage: null,
        })
      } catch (e: any) {
        return NextResponse.json({
          status: 'down',
          responseTime: Date.now() - start,
          errorMessage: 'Ping failed (host unreachable or ping not permitted)',
        })
      }
    }

    if (type === 'blacklist') {
      // Quick check against one blacklist
      const { resolve: dnsResolve, lookup } = await import('dns')
      let ip = target
      if (!/^\d+\.\d+\.\d+\.\d+$/.test(target)) {
        const addrs = await new Promise<string[]>((resolve, reject) => {
          lookup(target, { all: true }, (err, a) => err ? reject(err) : resolve((a as any[]).map((x) => x.address)))
        })
        ip = addrs[0] || target
      }
      const parts = ip.split('.').reverse().join('.')
      const listed: string[] = []
      const blacklists = ['zen.spamhaus.org', 'bl.spamcop.net']
      await Promise.all(blacklists.map(async (bl) => {
        try {
          await new Promise<string[]>((resolve, reject) => {
            dnsResolve(`${parts}.${bl}`, 'A', (err, a) => err ? reject(err) : resolve(a || []))
          })
          listed.push(bl)
        } catch { /* not listed */ }
      }))
      return NextResponse.json({
        status: listed.length > 0 ? 'down' : 'up',
        responseTime: Date.now() - start,
        errorMessage: listed.length > 0 ? `Listed on: ${listed.join(', ')}` : null,
        metadata: { ip, listed },
      })
    }

    if (type === 'server') {
      return NextResponse.json({
        status: 'up',
        responseTime: 0,
        errorMessage: null,
        note: 'Server monitors receive data from the Afrikintel agent. Install the agent on the target server to start collecting metrics.',
      })
    }

    return NextResponse.json({ error: `Unknown monitor type: ${type}` }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({
      status: 'down',
      responseTime: Date.now() - start,
      errorMessage: e.message || 'Test failed',
    }, { status: 500 })
  }
}
