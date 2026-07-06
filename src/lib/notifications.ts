// Real notification dispatcher
// Delivers alerts to configured channels: email, slack, discord, webhook, sms, pushover, pushbullet, twitter

import nodemailer from 'nodemailer'
import { db } from '@/lib/db'

export interface AlertPayload {
  type: 'incident_new' | 'incident_resolved' | 'incident_acknowledged' | 'threshold_breached'
  monitorName: string
  monitorType: string
  monitorTarget: string
  incidentTitle: string
  incidentSeverity: string
  incidentStatus: string
  message: string
  startedAt?: string
  duration?: number
  url?: string  // link back to the dashboard
}

export interface DispatchResult {
  channelId: string
  channelName: string
  channelType: string
  status: 'sent' | 'failed'
  error?: string
}

// ============================================================
// Format the alert message per channel type
// ============================================================
function formatMessage(payload: AlertPayload, channelType: string): { subject: string; body: string; richBody?: string } {
  const emoji =
    payload.type === 'incident_new'
      ? payload.incidentSeverity === 'critical' ? '🔴' : '🟡'
      : payload.type === 'incident_resolved'
        ? '🟢'
        : '🔵'

  const subject = `${emoji} [${payload.incidentSeverity.toUpperCase()}] ${payload.incidentTitle}`
  const body = [
    `Monitor: ${payload.monitorName} (${payload.monitorType})`,
    `Target: ${payload.monitorTarget}`,
    `Status: ${payload.incidentStatus}`,
    `Detail: ${payload.message}`,
    payload.duration != null ? `Duration: ${payload.duration}s` : '',
    payload.url ? `View: ${payload.url}` : '',
    `Time: ${payload.startedAt || new Date().toISOString()}`,
  ].filter(Boolean).join('\n')

  // Rich formatting for Slack/Discord
  const richBody = JSON.stringify({
    text: subject,
    attachments: [
      {
        color:
          payload.incidentSeverity === 'critical'
            ? 'danger'
            : payload.incidentSeverity === 'warning'
              ? 'warning'
              : 'good',
        fields: [
          { title: 'Monitor', value: payload.monitorName, short: true },
          { title: 'Type', value: payload.monitorType, short: true },
          { title: 'Target', value: payload.monitorTarget, short: false },
          { title: 'Status', value: payload.incidentStatus, short: true },
          { title: 'Severity', value: payload.incidentSeverity, short: true },
          { title: 'Detail', value: payload.message, short: false },
          ...(payload.duration != null ? [{ title: 'Duration', value: `${payload.duration}s`, short: true }] : []),
          ...(payload.url ? [{ title: 'View', value: payload.url, short: false }] : []),
        ],
        footer: 'Afrikintel',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  })

  return { subject, body, richBody }
}

// ============================================================
// Channel-specific senders
// ============================================================
async function sendEmail(to: string, subject: string, body: string) {
  const host = await db.setting.findUnique({ where: { key: 'smtp_host' } })
  const port = await db.setting.findUnique({ where: { key: 'smtp_port' } })
  const user = await db.setting.findUnique({ where: { key: 'smtp_user' } })
  const pass = await db.setting.findUnique({ where: { key: 'smtp_pass' } })
  const from = await db.setting.findUnique({ where: { key: 'smtp_from' } })

  if (!host?.value) {
    throw new Error('SMTP not configured (set smtp_host in settings)')
  }

  const transporter = nodemailer.createTransport({
    host: host.value,
    port: parseInt(port?.value || '587'),
    secure: parseInt(port?.value || '587') === 465,
    auth: user?.value ? { user: user.value, pass: pass?.value || '' } : undefined,
  })

  await transporter.sendMail({
    from: from?.value || 'alerts@afrikintel.com',
    to,
    subject,
    text: body,
  })
}

async function sendWebhook(url: string, richBody: string) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: richBody,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Webhook returned ${res.status}: ${text.substring(0, 200)}`)
  }
}

async function sendSlack(webhookUrl: string, richBody: string) {
  // Slack uses the same attachment format
  await sendWebhook(webhookUrl, richBody)
}

async function sendDiscord(webhookUrl: string, subject: string, body: string) {
  // Discord uses a simpler embed format
  const color =
    subject.includes('CRITICAL') ? 0xef4444
      : subject.includes('WARNING') ? 0xf59e0b
        : subject.includes('resolved') || subject.includes('🟢') ? 0x10b981
          : 0x3b82f6
  const payload = {
    content: subject,
    embeds: [
      {
        description: body,
        color,
        footer: { text: 'Afrikintel' },
        timestamp: new Date().toISOString(),
      },
    ],
  }
  await sendWebhook(webhookUrl, JSON.stringify(payload))
}

async function sendSms(phone: string, body: string) {
  // Twilio SMS - requires TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM env vars
  const sid = process.env.TWILIO_SID
  const token = process.env.TWILIO_TOKEN
  const from = process.env.TWILIO_FROM
  if (!sid || !token || !from) {
    throw new Error('Twilio not configured (set TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM env vars)')
  }
  const auth = Buffer.from(`${sid}:${token}`).toString('base64')
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: phone, From: from, Body: body }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Twilio returned ${res.status}: ${text.substring(0, 200)}`)
  }
}

async function sendPushover(token: string, user: string, subject: string, body: string) {
  const res = await fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      token,
      user,
      title: subject,
      message: body,
    }),
  })
  if (!res.ok) throw new Error(`Pushover returned ${res.status}`)
}

async function sendPushbullet(token: string, subject: string, body: string) {
  const res = await fetch('https://api.pushbullet.com/v2/pushes', {
    method: 'POST',
    headers: {
      'Access-Token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'note', title: subject, body }),
  })
  if (!res.ok) throw new Error(`Pushbullet returned ${res.status}`)
}

async function sendTwitter(handle: string, body: string) {
  // Twitter DM requires OAuth 1.0a with read/write DM permissions
  // This is a stub - real implementation requires significant OAuth setup
  throw new Error(`Twitter DM to @${handle} not implemented (requires Twitter API OAuth 1.0a config)`)
}

// ============================================================
// Main dispatcher - sends to all enabled channels
// ============================================================
export async function dispatchAlert(payload: AlertPayload): Promise<DispatchResult[]> {
  const channels = await db.notificationChannel.findMany({ where: { enabled: true } })
  if (channels.length === 0) return []

  const results: DispatchResult[] = []
  const { subject, body, richBody } = formatMessage(payload, 'default')

  for (const channel of channels) {
    let config: Record<string, string> = {}
    try { config = JSON.parse(channel.config) } catch {}

    try {
      switch (channel.type) {
        case 'email':
          await sendEmail(config.address || '', subject, body)
          break
        case 'slack':
          await sendSlack(config.webhook || '', richBody || '')
          break
        case 'discord':
          await sendDiscord(config.webhook || '', subject, body)
          break
        case 'webhook':
          await sendWebhook(config.url || '', richBody || '')
          break
        case 'sms':
          await sendSms(config.phone || '', body)
          break
        case 'pushover':
          await sendPushover(config.token || '', config.user || '', subject, body)
          break
        case 'pushbullet':
          await sendPushbullet(config.token || '', subject, body)
          break
        case 'twitter':
          await sendTwitter(config.handle || '', body)
          break
        default:
          throw new Error(`Unknown channel type: ${channel.type}`)
      }
      results.push({
        channelId: channel.id,
        channelName: channel.name,
        channelType: channel.type,
        status: 'sent',
      })
    } catch (e: any) {
      results.push({
        channelId: channel.id,
        channelName: channel.name,
        channelType: channel.type,
        status: 'failed',
        error: e.message,
      })
    }
  }

  // Persist logs
  for (const r of results) {
    await db.notificationLog.create({
      data: {
        channelId: r.channelId,
        channelName: r.channelName,
        message: subject,
        status: r.status,
        error: r.error,
      },
    })
  }

  return results
}

// ============================================================
// Test endpoint - send a test alert to a specific channel
// ============================================================
export async function sendTestAlert(channelId: string): Promise<DispatchResult> {
  const channel = await db.notificationChannel.findUnique({ where: { id: channelId } })
  if (!channel) throw new Error('Channel not found')

  const payload: AlertPayload = {
    type: 'incident_new',
    monitorName: 'Test Monitor',
    monitorType: 'website',
    monitorTarget: 'https://example.com',
    incidentTitle: 'Test alert from Afrikintel',
    incidentSeverity: 'info',
    incidentStatus: 'open',
    message: 'This is a test alert to verify your notification channel is configured correctly.',
    startedAt: new Date().toISOString(),
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  }

  let config: Record<string, string> = {}
  try { config = JSON.parse(channel.config) } catch {}
  const { subject, body, richBody } = formatMessage(payload, channel.type)

  try {
    switch (channel.type) {
      case 'email': await sendEmail(config.address || '', subject, body); break
      case 'slack': await sendSlack(config.webhook || '', richBody || ''); break
      case 'discord': await sendDiscord(config.webhook || '', subject, body); break
      case 'webhook': await sendWebhook(config.url || '', richBody || ''); break
      case 'sms': await sendSms(config.phone || '', body); break
      case 'pushover': await sendPushover(config.token || '', config.user || '', subject, body); break
      case 'pushbullet': await sendPushbullet(config.token || '', subject, body); break
      case 'twitter': await sendTwitter(config.handle || '', body); break
    }
    const result: DispatchResult = {
      channelId: channel.id,
      channelName: channel.name,
      channelType: channel.type,
      status: 'sent',
    }
    await db.notificationLog.create({
      data: {
        channelId: channel.id,
        channelName: channel.name,
        message: `[TEST] ${subject}`,
        status: 'sent',
      },
    })
    return result
  } catch (e: any) {
    const result: DispatchResult = {
      channelId: channel.id,
      channelName: channel.name,
      channelType: channel.type,
      status: 'failed',
      error: e.message,
    }
    await db.notificationLog.create({
      data: {
        channelId: channel.id,
        channelName: channel.name,
        message: `[TEST] ${subject}`,
        status: 'failed',
        error: e.message,
      },
    })
    return result
  }
}
