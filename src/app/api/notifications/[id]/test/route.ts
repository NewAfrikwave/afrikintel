import { NextRequest, NextResponse } from 'next/server'
import { sendTestAlert } from '@/lib/notifications'

// POST /api/notifications/[id]/test - send a test alert to a specific channel
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try {
    const result = await sendTestAlert(id)
    if (result.status === 'sent') {
      return NextResponse.json({ ok: true, result })
    } else {
      return NextResponse.json({ ok: false, error: result.error, result }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
