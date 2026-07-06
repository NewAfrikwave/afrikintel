import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const channels = await db.notificationChannel.findMany({
    orderBy: { createdAt: 'asc' },
  })
  const logs = await db.notificationLog.findMany({
    orderBy: { sentAt: 'desc' },
    take: 20,
  })
  return NextResponse.json({ channels, logs })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, name, config, enabled = true } = body
  if (!type || !name) {
    return NextResponse.json({ error: 'type and name required' }, { status: 400 })
  }
  const channel = await db.notificationChannel.create({
    data: {
      type,
      name,
      config: typeof config === 'string' ? config : JSON.stringify(config || {}),
      enabled,
    },
  })
  return NextResponse.json({ channel }, { status: 201 })
}
