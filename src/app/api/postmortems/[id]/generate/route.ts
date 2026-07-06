import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/postmortems/[id]/generate
// Generates an AI-assisted postmortem for an incident
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try {
    const incident = await db.incident.findUnique({
      where: { id },
      include: {
        monitor: { select: { id: true, name: true, type: true, target: true, region: true, tags: true } },
        updates: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    const since = new Date(incident.startedAt.getTime() - 30 * 60_000)
    const until = incident.resolvedAt || new Date(incident.startedAt.getTime() + 30 * 60_000)
    const checks = await db.check.findMany({
      where: { monitorId: incident.monitorId, checkedAt: { gte: since, lte: until } },
      orderBy: { checkedAt: 'asc' },
      select: { status: true, responseTime: true, statusCode: true, errorMessage: true, checkedAt: true, region: true },
    })

    const timeline = incident.updates.map((u) => `[${u.createdAt.toISOString()}] ${u.status}: ${u.message}`).join('\n')
    const checksSummary = checks.slice(0, 30).map((c) => `[${c.checkedAt.toISOString()}] ${c.status} rt=${c.responseTime || 'null'}ms ${c.errorMessage || ''}`).join('\n')

    const durationStr = incident.duration ? `${incident.duration}s` : 'ongoing'
    const userPrompt = `Analyze this production incident and write a structured postmortem.

INCIDENT DETAILS:
- Title: ${incident.title}
- Severity: ${incident.severity}
- Status: ${incident.status}
- Started: ${incident.startedAt.toISOString()}
- Resolved: ${incident.resolvedAt?.toISOString() || 'still ongoing'}
- Duration: ${durationStr}
- Description: ${incident.description || 'N/A'}

AFFECTED MONITOR:
- Name: ${incident.monitor?.name}
- Type: ${incident.monitor?.type}
- Target: ${incident.monitor?.target}

TIMELINE:
${timeline || 'No updates recorded'}

CHECK HISTORY:
${checksSummary || 'No check data'}

Respond in EXACTLY this JSON format (no other text, no markdown fences):
{
  "summary": "One-paragraph executive summary",
  "timeline": "Markdown timeline of key events",
  "rootCause": "Most likely root cause",
  "contributingFactors": "Factors that contributed",
  "impact": "Business/user impact",
  "actionItems": "Markdown list of 3-5 action items"
}`

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'You are a senior site reliability engineer writing incident postmortems. Be concise, factual, and action-oriented.',
        },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const content = completion.choices[0]?.message?.content || ''
    let parsed: any
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = {
        summary: content.substring(0, 500),
        timeline: '',
        rootCause: 'Unable to parse structured response',
        contributingFactors: '',
        impact: '',
        actionItems: '',
      }
    }

    const existing = await db.postmortem.findUnique({ where: { incidentId: id } })
    let postmortem
    if (existing) {
      postmortem = await db.postmortem.update({
        where: { incidentId: id },
        data: {
          summary: parsed.summary || '',
          timeline: parsed.timeline || '',
          rootCause: parsed.rootCause || '',
          contributingFactors: parsed.contributingFactors || '',
          impact: parsed.impact || '',
          actionItems: parsed.actionItems || '',
          regeneratedAt: new Date(),
          model: 'glm-4',
        },
      })
    } else {
      postmortem = await db.postmortem.create({
        data: {
          incidentId: id,
          summary: parsed.summary || '',
          timeline: parsed.timeline || '',
          rootCause: parsed.rootCause || '',
          contributingFactors: parsed.contributingFactors || '',
          impact: parsed.impact || '',
          actionItems: parsed.actionItems || '',
          model: 'glm-4',
        },
      })
    }

    return NextResponse.json({ ok: true, postmortem })
  } catch (e: any) {
    console.error('[postmortem] generation error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
