import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  for (const k of ['email', 'name', 'role', 'avatar', 'active', 'password']) {
    if (k in body) data[k] = body[k]
  }
  const user = await db.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, avatar: true, active: true, lastLogin: true, createdAt: true },
  })
  return NextResponse.json({ user })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  await db.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
