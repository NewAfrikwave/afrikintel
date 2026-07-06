import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const now = new Date()
  const existing = await db.incident.findUnique({ where: { id } })
  const duration = existing?.startedAt
    ? Math.floor((now.getTime() - existing.startedAt.getTime()) / 1000)
    : null
  const incident = await db.incident.update({
    where: { id },
    data: { status: 'resolved', resolvedAt: now, duration },
  })
  await db.incidentUpdate.create({
    data: {
      incidentId: id,
      status: 'resolved',
      message: body.message || 'Incident resolved manually',
      author: body.author || 'operator',
    },
  })
  return NextResponse.json({ incident })
}
