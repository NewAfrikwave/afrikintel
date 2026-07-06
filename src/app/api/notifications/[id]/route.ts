import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  for (const k of ['type', 'name', 'enabled']) {
    if (k in body) data[k] = body[k]
  }
  if (body.config) data.config = typeof body.config === 'string' ? body.config : JSON.stringify(body.config)
  const channel = await db.notificationChannel.update({ where: { id }, data })
  return NextResponse.json({ channel })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  await db.notificationChannel.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
