import type { MonitorStatus, MonitorType, Severity, IncidentStatus } from './types'

export function statusColor(status: MonitorStatus): {
  bg: string
  text: string
  border: string
  dot: string
  pulse: string
} {
  switch (status) {
    case 'up':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-500',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-500',
        pulse: 'shadow-[0_0_12px_rgba(16,185,129,0.6)]',
      }
    case 'down':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-500',
        border: 'border-red-500/30',
        dot: 'bg-red-500',
        pulse: 'shadow-[0_0_12px_rgba(239,68,68,0.6)]',
      }
    case 'degraded':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-500',
        border: 'border-amber-500/30',
        dot: 'bg-amber-500',
        pulse: 'shadow-[0_0_12px_rgba(245,158,11,0.6)]',
      }
    default:
      return {
        bg: 'bg-zinc-500/10',
        text: 'text-zinc-400',
        border: 'border-zinc-500/30',
        dot: 'bg-zinc-500',
        pulse: '',
      }
  }
}

export function severityColor(severity: Severity): { bg: string; text: string; border: string } {
  switch (severity) {
    case 'critical':
      return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' }
    case 'warning':
      return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30' }
    default:
      return { bg: 'bg-sky-500/10', text: 'text-sky-500', border: 'border-sky-500/30' }
  }
}

export function incidentStatusColor(status: IncidentStatus): { bg: string; text: string; border: string } {
  switch (status) {
    case 'open':
      return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' }
    case 'acknowledged':
      return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30' }
    case 'resolved':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30' }
  }
}

export function typeColor(type: MonitorType): { bg: string; text: string } {
  switch (type) {
    case 'website':
      return { bg: 'bg-teal-500/10', text: 'text-teal-400' }
    case 'service':
      return { bg: 'bg-sky-500/10', text: 'text-sky-400' }
    case 'server':
      return { bg: 'bg-purple-500/10', text: 'text-purple-400' }
    case 'ping':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400' }
    case 'dns':
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-400' }
    case 'blacklist':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400' }
    default:
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-400' }
  }
}

export function typeIcon(type: MonitorType): string {
  switch (type) {
    case 'website': return 'Globe'
    case 'service': return 'Network'
    case 'server': return 'Server'
    case 'ping': return 'Radio'
    case 'dns': return 'Tags'
    case 'blacklist': return 'ShieldBan'
    default: return 'Activity'
  }
}

export function formatUptime(value: number): string {
  return `${value.toFixed(2)}%`
}

export function formatMs(ms?: number | null): string {
  if (ms == null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function formatDuration(seconds?: number | null): string {
  if (!seconds) return '—'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

export function timeAgo(date?: string | Date | null): string {
  if (!date) return 'never'
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  if (diff < 0) return 'just now'
  if (diff < 5_000) return 'just now'
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

export function formatDateTime(date?: string | Date | null): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
