import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const users = await db.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, name: true, role: true, avatar: true, active: true, lastLogin: true, createdAt: true },
  })
  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, name, password, role = 'viewer', avatar } = body
  if (!email || !name || !password) {
    return NextResponse.json({ error: 'email, name, password required' }, { status: 400 })
  }
  const exists = await db.user.findUnique({ where: { email } })
  if (exists) return NextResponse.json({ error: 'email already in use' }, { status: 400 })
  const user = await db.user.create({
    data: { email, name, password, role, avatar },
    select: { id: true, email: true, name: true, role: true, avatar: true, active: true, lastLogin: true, createdAt: true },
  })
  return NextResponse.json({ user }, { status: 201 })
}
