import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/journeys - list all synthetic monitoring journeys
export async function GET() {
  const journeys = await db.journey.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { steps: true, runs: true } },
    },
  })
  return NextResponse.json({ journeys })
}

// POST /api/journeys - create a new journey
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, description, interval = 300, timeout = 60, steps = [] } = body
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const journey = await db.journey.create({
    data: {
      name,
      description,
      interval,
      timeout,
    },
  })

  if (steps.length > 0) {
    await db.journeyStep.createMany({
      data: steps.map((s: any, i: number) => ({
        journeyId: journey.id,
        order: i,
        action: s.action,
        target: s.target || '',
        value: s.value || null,
        description: s.description || null,
      })),
    })
  }

  return NextResponse.json({ journey }, { status: 201 })
}
