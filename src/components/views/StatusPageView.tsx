'use client'

import { useFetch } from '@/lib/use-fetch'
import { cn } from '@/lib/utils'
import { timeAgo, formatDuration } from '@/lib/monitor-utils'
import type { Monitor, Incident } from '@/lib/types'
import {
  CheckCircle2, AlertTriangle, AlertCircle, Globe, Activity, Clock,
  ArrowUpRight, Calendar, Zap, Shield,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface StatusPageData {
  page: {
    id: string
    slug: string
    title: string
    description: string
    theme: string
    published: boolean
  }
  monitors: (Monitor & { uptime90: { day: number; up: number; total: number }[] })[]
  recentIncidents: (Incident & { monitor: { name: string }; updates: any[] })[]
}

export function StatusPageView() {
  const { data, loading } = useFetch<StatusPageData>('/api/status-page', { refreshMs: 10000 })

  if (loading || !data) {
    return (
      <div className="p-4 md:p-6 max-w-[1000px] mx-auto space-y-4">
        <div className="h-32 rounded-lg bg-card border border-border shimmer" />
        <div className="h-20 rounded-lg bg-card border border-border shimmer" />
        <div className="h-20 rounded-lg bg-card border border-border shimmer" />
      </div>
    )
  }

  const allUp = data.monitors.every((m) => m.status === 'up')
  const anyDown = data.monitors.some((m) => m.status === 'down')
  const anyDegraded = data.monitors.some((m) => m.status === 'degraded')

  const overallStatus = allUp
    ? { label: 'All Systems Operational', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2, dot: 'bg-emerald-500' }
    : anyDown
      ? { label: 'Partial Outage', color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertTriangle, dot: 'bg-red-500' }
      : { label: 'Degraded Service', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertCircle, dot: 'bg-amber-500' }

  const Icon = overallStatus.icon
  const overallUptime = data.monitors.length
    ? data.monitors.reduce((a, m) => a + m.uptime, 0) / data.monitors.length
    : 100

  // Build day labels for 90-day bars (showing every 10 days)
  const today = new Date()

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Globe className="w-3 h-3" />
            <span>Public status page ·</span>
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground text-[10px]">/status/{data.page.slug}</code>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-[10px] px-2 py-1 rounded uppercase font-medium',
            data.page.published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground',
          )}>
            {data.page.published ? 'Published' : 'Draft'}
          </span>
          <button className="h-8 px-3 rounded-md border border-border hover:bg-muted text-xs flex items-center gap-1.5">
            <ArrowUpRight className="w-3 h-3" />
            Open page
          </button>
        </div>
      </div>

      {/* Hero card - looks like the public page */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        {/* Hero header */}
        <div className="relative p-8 border-b border-border overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
          <div className={cn('absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none', overallStatus.bg)} />

          <div className="relative flex items-start gap-4">
            <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center', overallStatus.bg)}>
              <Icon className={cn('w-7 h-7', overallStatus.color)} strokeWidth={2.2} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{data.page.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{data.page.description}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', overallStatus.dot)}>
                  <span className={cn('absolute inline-flex w-2 h-2 rounded-full animate-ping opacity-75', overallStatus.dot)} />
                </span>
                <span className={cn('text-sm font-medium', overallStatus.color)}>{overallStatus.label}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Updated {timeAgo(new Date().toISOString())}
                </span>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">90-day uptime</div>
              <div className="text-2xl font-bold text-foreground tabular-nums">{overallUptime.toFixed(2)}%</div>
            </div>
          </div>
        </div>

        {/* Monitors list with 90-day bars */}
        <div className="divide-y divide-border">
          {data.monitors.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'w-2 h-2 rounded-full',
                    m.status === 'up' ? 'bg-emerald-500' : m.status === 'down' ? 'bg-red-500' : m.status === 'degraded' ? 'bg-amber-500' : 'bg-muted-foreground',
                  )}>
                    {m.status !== 'pending' && (
                      <span className={cn(
                        'absolute inline-flex w-2 h-2 rounded-full animate-ping opacity-75',
                        m.status === 'up' ? 'bg-emerald-500' : m.status === 'down' ? 'bg-red-500' : 'bg-amber-500',
                      )} />
                    )}
                  </span>
                  <span className="text-sm font-medium text-foreground">{m.name}</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {m.type}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    'text-xs font-medium capitalize',
                    m.status === 'up' ? 'text-emerald-400' : m.status === 'down' ? 'text-red-400' : 'text-amber-400',
                  )}>
                    {m.status === 'up' ? 'Operational' : m.status === 'down' ? 'Outage' : m.status === 'degraded' ? 'Degraded' : 'Pending'}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {m.uptime.toFixed(2)}% uptime
                  </span>
                </div>
              </div>

              {/* 90-day bar visualization */}
              <div className="flex items-center gap-[2px] h-8">
                {m.uptime90.map((d, idx) => {
                  const uptime = d.total ? (d.up / d.total) * 100 : 100
                  const color =
                    uptime === 100 ? 'bg-emerald-500/80' :
                    uptime > 95 ? 'bg-amber-500/80' :
                    d.total === 0 ? 'bg-muted' :
                    'bg-red-500/80'
                  const date = new Date(today)
                  date.setDate(date.getDate() - (89 - idx))
                  return (
                    <div
                      key={idx}
                      className={cn('flex-1 h-full rounded-sm hover:opacity-100 transition-opacity cursor-help', color, 'opacity-70')}
                      title={`${date.toLocaleDateString()} · ${uptime.toFixed(1)}% uptime · ${d.up}/${d.total} checks`}
                    />
                  )
                })}
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                <span>90 days ago</span>
                <span>Today</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent incidents */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Recent Incidents</h2>
            <p className="text-xs text-muted-foreground">Past 30 days of recorded incidents</p>
          </div>
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </div>
        {data.recentIncidents.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
            <div className="text-xs text-muted-foreground">No incidents in the past 30 days</div>
          </div>
        ) : (
          <div className="space-y-3">
            {data.recentIncidents.map((inc, i) => (
              <motion.div
                key={inc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="border border-border rounded-md p-3"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      inc.status === 'resolved' ? 'bg-emerald-500' : inc.status === 'acknowledged' ? 'bg-amber-500' : 'bg-red-500',
                    )} />
                    <span className="text-sm font-medium text-foreground">{inc.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(inc.startedAt)}</span>
                </div>
                <div className="text-xs text-muted-foreground ml-3.5">
                  {inc.monitor?.name} · {inc.status === 'resolved' ? `resolved in ${formatDuration(inc.duration)}` : inc.status}
                </div>
                {inc.updates && inc.updates.length > 0 && (
                  <div className="mt-2 ml-3.5 pl-3 border-l-2 border-border text-[11px] text-muted-foreground">
                    {inc.updates[0].message}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-muted-foreground py-4 flex items-center justify-center gap-2">
        <Zap className="w-3 h-3 text-emerald-500" />
        Powered by Afrikintel
        <span>·</span>
        <Shield className="w-3 h-3" />
        Status data refreshes automatically every 30 seconds
      </div>
    </div>
  )
}
