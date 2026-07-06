import { NextRequest, NextResponse } from 'next/server'
import { dispatchAlert, type AlertPayload } from '@/lib/notifications'

// POST /api/alerts/dispatch
// Called by the monitor-service when an incident opens or resolves
export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as AlertPayload
    const results = await dispatchAlert(payload)
    return NextResponse.json({ ok: true, results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
