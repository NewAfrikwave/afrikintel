import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const incident = await db.incident.update({
    where: { id },
    data: { status: 'acknowledged' },
  })
  await db.incidentUpdate.create({
    data: {
      incidentId: id,
      status: 'acknowledged',
      message: body.message || 'Incident acknowledged',
      author: body.author || 'operator',
    },
  })
  return NextResponse.json({ incident })
}
