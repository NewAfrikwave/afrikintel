import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const monitor = await db.monitor.update({
    where: { id },
    data: { paused: true },
  })
  return NextResponse.json({ monitor })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const monitor = await db.monitor.update({
    where: { id },
    data: { paused: false },
  })
  return NextResponse.json({ monitor })
}
