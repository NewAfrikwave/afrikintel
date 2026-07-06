'use client'

import { useState } from 'react'
import { useFetch, apiPost, apiPut, apiDelete } from '@/lib/use-fetch'
import type { NotificationChannel, NotificationLog } from '@/lib/types'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/monitor-utils'
import {
  Mail, MessageSquare, Phone, Webhook, Bell, Send, Slack, Twitter,
  Plus, X, Trash2, Edit, CheckCircle2, XCircle, Clock, Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const channelTypes = [
  { value: 'email', label: 'Email', icon: Mail, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  { value: 'slack', label: 'Slack', icon: Slack, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { value: 'discord', label: 'Discord', icon: MessageSquare, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { value: 'webhook', label: 'Webhook', icon: Webhook, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { value: 'sms', label: 'SMS', icon: Phone, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { value: 'twitter', label: 'Twitter DM', icon: Twitter, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  { value: 'pushbullet', label: 'Pushbullet', icon: Bell, color: 'text-teal-400', bg: 'bg-teal-500/10' },
  { value: 'pushover', label: 'Pushover', icon: Send, color: 'text-orange-400', bg: 'bg-orange-500/10' },
]

export function NotificationsView() {
  const { data, loading, refetch } = useFetch<{ channels: NotificationChannel[]; logs: NotificationLog[] }>(
    '/api/notifications',
    { refreshMs: 8000 },
  )
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<NotificationChannel | null>(null)

  const handleToggle = async (ch: NotificationChannel) => {
    try {
      await apiPut(`/api/notifications/${ch.id}`, { enabled: !ch.enabled })
      toast.success(`${ch.name} ${ch.enabled ? 'disabled' : 'enabled'}`)
      refetch()
    } catch (e) {
      toast.error(`Failed: ${(e as Error).message}`)
    }
  }
  const handleDelete = async (ch: NotificationChannel) => {
    if (!confirm(`Delete channel "${ch.name}"?`)) return
    try {
      await apiDelete(`/api/notifications/${ch.id}`)
      toast.success(`Channel deleted`)
      refetch()
    } catch (e) {
      toast.error(`Failed: ${(e as Error).message}`)
    }
  }

  const handleTest = async (ch: NotificationChannel) => {
    toast.info(`Sending test alert to ${ch.name}...`)
    try {
      const r = await fetch(`/api/notifications/${ch.id}/test`, { method: 'POST' })
      const data = await r.json()
      if (r.ok && data.ok) {
        toast.success(`Test alert sent to ${ch.name}`)
      } else {
        toast.error(`Test failed: ${data.error || data.result?.error || 'Unknown error'}`)
      }
      refetch()
    } catch (e) {
      toast.error(`Test failed: ${(e as Error).message}`)
    }
  }

  if (loading && !data) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-card border border-border shimmer" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Notification Channels</h2>
          <p className="text-xs text-muted-foreground">
            Configure how and where you receive alerts when monitors fail
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="h-9 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Channel
        </button>
      </div>

      {/* Channels grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data?.channels.map((ch, i) => {
          const type = channelTypes.find((t) => t.value === ch.type) || channelTypes[0]
          const Icon = type.icon
          let config: Record<string, string> = {}
          try { config = JSON.parse(ch.config) } catch {}
          return (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className={cn(
                'bg-card border border-border rounded-lg p-4 transition-all',
                !ch.enabled && 'opacity-60',
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('w-9 h-9 rounded-md flex items-center justify-center shrink-0', type.bg)}>
                  <Icon className={cn('w-4 h-4', type.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-foreground truncate">{ch.name}</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-medium bg-muted text-muted-foreground">
                      {ch.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {config.address || config.webhook || config.url || config.phone || '—'}
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(ch)}
                  className={cn(
                    'relative w-9 h-5 rounded-full transition-colors shrink-0',
                    ch.enabled ? 'bg-emerald-500' : 'bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                      ch.enabled ? 'translate-x-4' : 'translate-x-0.5',
                    )}
                  />
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">
                  Added {timeAgo(ch.createdAt)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTest(ch)}
                    className="h-7 px-2 rounded hover:bg-emerald-500/10 text-emerald-400 text-[10px] font-medium flex items-center gap-1 border border-emerald-500/30"
                    title="Send test alert"
                  >
                    <Zap className="w-3 h-3" />
                    Test
                  </button>
                  <button
                    onClick={() => { setEditing(ch); setShowForm(true) }}
                    className="w-7 h-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(ch)}
                    className="w-7 h-7 rounded hover:bg-muted text-muted-foreground hover:text-red-400 flex items-center justify-center"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Delivery log */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Delivery Log</h3>
        <p className="text-xs text-muted-foreground mb-3">Recent notifications sent by the system</p>
        <div className="bg-card border border-border rounded-md overflow-hidden">
          {data?.logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              <Bell className="w-6 h-6 mx-auto mb-2 opacity-50" />
              No notifications sent yet
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card">
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Channel</th>
                    <th className="px-3 py-2 font-medium">Message</th>
                    <th className="px-3 py-2 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.logs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-accent/20">
                      <td className="px-3 py-2">
                        {log.status === 'sent' ? (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> Sent
                          </span>
                        ) : log.status === 'failed' ? (
                          <span className="flex items-center gap-1 text-red-400">
                            <XCircle className="w-3 h-3" /> Failed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-foreground">{log.channelName}</td>
                      <td className="px-3 py-2 text-muted-foreground truncate max-w-[300px]">{log.message}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{timeAgo(log.sentAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <ChannelForm
            editing={editing}
            onClose={() => setShowForm(false)}
            onSaved={() => { setShowForm(false); refetch() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ChannelForm({
  editing,
  onClose,
  onSaved,
}: {
  editing: NotificationChannel | null
  onClose: () => void
  onSaved: () => void
}) {
  const [type, setType] = useState(editing?.type || 'email')
  const [name, setName] = useState(editing?.name || '')
  const [config, setConfig] = useState(() => {
    if (!editing) return { address: '', webhook: '', url: '', phone: '' }
    try { return JSON.parse(editing.config) } catch { return {} }
  })
  const [enabled, setEnabled] = useState(editing?.enabled ?? true)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const body = { type, name, config, enabled }
      if (editing) {
        await apiPut(`/api/notifications/${editing.id}`, body)
        toast.success('Channel updated')
      } else {
        await apiPost('/api/notifications', body)
        toast.success('Channel created')
      }
      onSaved()
    } catch (e) {
      toast.error(`Failed: ${(e as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-card border border-border rounded-lg shadow-2xl"
      >
        <div className="border-b border-border p-5 flex items-center justify-between">
          <h2 className="text-base font-semibold">
            {editing ? 'Edit Channel' : 'New Channel'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="text-xs text-foreground mb-1.5">Type</div>
            <div className="grid grid-cols-4 gap-2">
              {channelTypes.map((t) => {
                const Icon = t.icon
                const active = type === t.value
                return (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={cn(
                      'p-2 rounded-md border text-center transition-all',
                      active ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border hover:border-foreground/20',
                    )}
                  >
                    <Icon className={cn('w-4 h-4 mx-auto mb-1', active ? t.color : 'text-muted-foreground')} />
                    <div className="text-[10px] text-foreground">{t.label}</div>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <div className="text-xs text-foreground mb-1.5">Name</div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ops Team Email"
              className="w-full h-9 px-3 bg-background border border-border rounded-md text-xs outline-none focus:border-emerald-500/40"
            />
          </div>
          <div>
            <div className="text-xs text-foreground mb-1.5">
              {type === 'email' && 'Email Address'}
              {type === 'sms' && 'Phone Number'}
              {(type === 'slack' || type === 'discord') && 'Webhook URL'}
              {type === 'webhook' && 'Webhook URL'}
              {type === 'twitter' && 'Twitter Handle'}
              {(type === 'pushbullet' || type === 'pushover') && 'API Token'}
            </div>
            <input
              type="text"
              value={
                type === 'email' ? config.address || '' :
                type === 'sms' ? config.phone || '' :
                config.webhook || config.url || ''
              }
              onChange={(e) => {
                const key = type === 'email' ? 'address' : type === 'sms' ? 'phone' : (type === 'slack' || type === 'discord') ? 'webhook' : 'url'
                setConfig({ ...config, [key]: e.target.value })
              }}
              placeholder={
                type === 'email' ? 'ops@example.com' :
                type === 'sms' ? '+15551234567' :
                'https://...'
              }
              className="w-full h-9 px-3 bg-background border border-border rounded-md text-xs outline-none focus:border-emerald-500/40"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500"
            />
            Enable this channel
          </label>
        </div>
        <div className="border-t border-border p-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-md border border-border hover:bg-muted text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-xs font-medium flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </>
  )
}
