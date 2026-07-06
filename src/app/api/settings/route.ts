import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const settings = await db.setting.findMany()
  const obj: Record<string, string> = {}
  for (const s of settings) obj[s.key] = s.value
  return NextResponse.json({ settings: obj })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const updated: Record<string, string> = {}
  for (const [k, v] of Object.entries(body)) {
    const value = String(v)
    const existing = await db.setting.findUnique({ where: { key: k } })
    if (existing) {
      await db.setting.update({ where: { key: k }, data: { value } })
    } else {
      await db.setting.create({ data: { id: `s_${k}_${Date.now()}`, key: k, value } })
    }
    updated[k] = value
  }
  return NextResponse.json({ settings: updated })
}
