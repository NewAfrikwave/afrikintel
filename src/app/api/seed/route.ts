import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  // Just trigger - the monitor-service handles seeding
  const count = await db.monitor.count()
  return NextResponse.json({ ok: true, alreadySeeded: count > 0, count })
}
