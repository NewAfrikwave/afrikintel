import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const journey = await db.journey.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { order: 'asc' } },
      runs: { orderBy: { checkedAt: 'desc' }, take: 20 },
    },
  })
  if (!journey) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ journey })
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json()
  const journey = await db.journey.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      interval: body.interval,
      timeout: body.timeout,
      enabled: body.enabled,
    },
  })
  return NextResponse.json({ journey })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  await db.journey.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
