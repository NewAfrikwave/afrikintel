'use client'

import { useAppStore } from '@/lib/store'
import { useFetch } from '@/lib/use-fetch'
import type { DashboardStats, Monitor } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  statusColor, severityColor, typeColor, typeIcon,
  formatUptime, formatMs, timeAgo, formatDuration,
} from '@/lib/monitor-utils'
import {
  Activity, ArrowUpRight, ArrowDownRight, Clock, Cpu, Globe, Network,
  AlertTriangle, CheckCircle2, Server, Zap, TrendingUp, Gauge, MapPin,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid, Line, LineChart, BarChart, Bar, Cell,
} from 'recharts'
import * as Icons from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouterView } from './router'
import { ErrorState, KpiSkeleton } from '@/components/shared/states'

export function DashboardView() {
  const { data, loading, error, refetch } = useFetch<DashboardStats>('/api/stats', { refreshMs: 5000 })
  const setView = useRouterView()
  const setSelectedMonitorId = useAppStore((s) => s.setSelectedMonitorId)

  if (loading && !data) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        <KpiSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-72 rounded-lg bg-card border border-border shimmer" />
          <div className="h-72 rounded-lg bg-card border border-border shimmer" />
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        message={error}
        onRetry={refetch}
        className="min-h-[400px]"
      />
    )
  }

  if (!data) return null

  const s = data.summary
  const uptimePct = s.avgUptime
  const upPct = s.total ? (s.up / s.total) * 100 : 0

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1600px] mx-auto">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Monitors"
          value={s.total}
          sublabel={`${s.up} up · ${s.down} down · ${s.degraded} degraded`}
          icon={Activity}
          tone="emerald"
          trend={+1}
          onClick={() => setView('monitors')}
        />
        <KpiCard
          label="Avg Uptime (24h)"
          value={`${uptimePct.toFixed(2)}%`}
          sublabel={`Across ${s.total} active monitors`}
          icon={TrendingUp}
          tone="emerald"
          trend={+0.04}
          progress={uptimePct}
        />
        <KpiCard
          label="Avg Response Time"
          value={formatMs(s.avgResponseTime)}
          sublabel="Across all checks"
          icon={Gauge}
          tone={s.avgResponseTime > 1000 ? 'amber' : 'emerald'}
          trend={-12}
        />
        <KpiCard
          label="Open Incidents"
          value={s.openIncidents}
          sublabel={`${s.resolvedToday} resolved today`}
          icon={AlertTriangle}
          tone={s.openIncidents > 0 ? 'red' : 'emerald'}
          onClick={() => setView('incidents')}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Uptime timeline */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Uptime Overview · 24h</h3>
              <p className="text-xs text-muted-foreground">
                Hourly uptime percentage across all monitors
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Up</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Degraded</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Down</span>
              </div>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.uptimeTimeline} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="uptimeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: 'oklch(0.65 0.01 240)' }}
                  tickFormatter={(h) => `${24 - h}h`}
                  tickLine={false}
                  axisLine={false}
                  interval={3}
                />
                <YAxis
                  domain={[95, 100]}
                  tick={{ fontSize: 10, fill: 'oklch(0.65 0.01 240)' }}
                  tickFormatter={(v) => `${v}%`}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(0.17 0.006 240)',
                    border: '1px solid oklch(1 0 0 / 0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelFormatter={(h) => `${24 - (h as number)}h ago`}
                  formatter={(v: number) => [`${v.toFixed(2)}%`, 'Uptime']}
                />
                <Area
                  type="monotone"
                  dataKey="uptime"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#uptimeGrad)"
                  animationDuration={600}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribution by type */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Monitor Distribution</h3>
            <p className="text-xs text-muted-foreground">By type and region</p>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">By Type</div>
              <div className="space-y-1.5">
                {Object.entries(data.byType).map(([type, count]) => {
                  const c = typeColor(type as Monitor['type'])
                  const Icon = (Icons as any)[typeIcon(type as Monitor['type'])] || Activity
                  return (
                    <div key={type} className="flex items-center gap-2 text-xs">
                      <Icon className={cn('w-3.5 h-3.5', c.text)} />
                      <span className="flex-1 capitalize text-foreground">{type}</span>
                      <span className="tabular-nums font-medium text-foreground">{count}</span>
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', c.bg.replace('/10', '/60'))}
                          style={{ width: `${(count / s.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">By Region</div>
              <div className="space-y-1.5">
                {Object.entries(data.byRegion).map(([region, count]) => (
                  <div key={region} className="flex items-center gap-2 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="flex-1 text-foreground">{region}</span>
                    <span className="tabular-nums font-medium text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Monitors grid */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Active Monitors</h3>
            <p className="text-xs text-muted-foreground">Live status of all your checks</p>
          </div>
          <button
            onClick={() => setView('monitors')}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            View all
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {data.monitors.slice(0, 6).map((m, i) => (
            <MonitorMiniCard
              key={m.id}
              monitor={m}
              delay={i * 0.04}
              onClick={() => {
                setSelectedMonitorId(m.id)
                setView('monitors')
              }}
            />
          ))}
        </div>
      </Card>

      {/* Recent incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recent Incidents</h3>
              <p className="text-xs text-muted-foreground">Last 8 incidents across all monitors</p>
            </div>
            <button
              onClick={() => setView('incidents')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              View all
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {data.recentIncidents.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
                No incidents recorded yet
              </div>
            )}
            {data.recentIncidents.map((inc) => {
              const sc = severityColor(inc.severity)
              return (
                <div
                  key={inc.id}
                  className="flex items-center gap-3 p-3 rounded-md border border-border hover:bg-accent/30 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedMonitorId(inc.monitorId)
                    setView('incidents')
                  }}
                >
                  <div className={cn('w-1 h-10 rounded-full', sc.bg.replace('/10', '/60'))} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{inc.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {inc.monitor?.name} · {timeAgo(inc.startedAt)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium uppercase', sc.bg, sc.text, 'border', sc.border)}>
                      {inc.severity}
                    </span>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {inc.status === 'resolved' ? formatDuration(inc.duration || 0) : inc.status}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Quick stats panel */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">System Health</h3>
            <p className="text-xs text-muted-foreground">Real-time aggregate metrics</p>
          </div>
          <div className="space-y-4">
            <HealthBar
              label="Services Operational"
              value={s.up}
              total={s.total}
              tone="emerald"
            />
            <HealthBar
              label="Uptime (24h avg)"
              value={uptimePct}
              total={100}
              tone="emerald"
              format={(v) => `${v.toFixed(2)}%`}
            />
            <HealthBar
              label="Incidents Resolved"
              value={s.resolvedToday}
              total={Math.max(s.resolvedToday, s.openIncidents + s.resolvedToday)}
              tone="amber"
            />
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
              <MiniStat label="Total Checks" value={s.totalIncidents} icon={Activity} />
              <MiniStat label="Avg Response" value={formatMs(s.avgResponseTime)} icon={Gauge} />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <TypeCount label="Web" value={data.byType.website || 0} icon={Globe} />
              <TypeCount label="Service" value={data.byType.service || 0} icon={Network} />
              <TypeCount label="Server" value={data.byType.server || 0} icon={Server} />
            </div>
          </div>
        </Card>
      </div>

      {/* Multi-region check status */}
      {data.byCheckRegion && Object.keys(data.byCheckRegion).length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Multi-Region Check Status
              </h3>
              <p className="text-xs text-muted-foreground">
                Checks performed per region in the last 5 minutes
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(data.byCheckRegion).map(([region, r]: [string, any]) => {
              const allUp = r.down === 0 && r.degraded === 0
              const hasDown = r.down > 0
              const hasDegraded = r.degraded > 0
              const tone = allUp ? 'emerald' : hasDown ? 'red' : 'amber'
              const toneColor = allUp ? 'text-emerald-400' : hasDown ? 'text-red-400' : 'text-amber-400'
              const toneBg = allUp ? 'bg-emerald-500/10' : hasDown ? 'bg-red-500/10' : 'bg-amber-500/10'
              const toneBorder = allUp ? 'border-emerald-500/30' : hasDown ? 'border-red-500/30' : 'border-amber-500/30'
              return (
                <motion.div
                  key={region}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('p-3 rounded-md border', toneBg, toneBorder)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('w-1.5 h-1.5 rounded-full', allUp ? 'bg-emerald-500' : hasDown ? 'bg-red-500' : 'bg-amber-500')}>
                        {allUp && (
                          <span className="absolute inline-flex w-1.5 h-1.5 rounded-full animate-ping opacity-75 bg-emerald-500" />
                        )}
                      </span>
                      <span className="text-xs font-medium text-foreground">{region}</span>
                    </div>
                    <span className={cn('text-[10px] uppercase font-medium', toneColor)}>
                      {allUp ? 'Healthy' : hasDown ? 'Issues' : 'Degraded'}
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-foreground tabular-nums">
                    {r.total}
                    <span className="text-xs text-muted-foreground font-normal ml-1">checks</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[10px]">
                    <span className="flex items-center gap-0.5 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {r.up}
                    </span>
                    {r.degraded > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {r.degraded}
                      </span>
                    )}
                    {r.down > 0 && (
                      <span className="flex items-center gap-0.5 text-red-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {r.down}
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

// Sub-components

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('bg-card border border-border rounded-lg', className)}>
      {children}
    </div>
  )
}

function KpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
  tone,
  trend,
  progress,
  onClick,
}: {
  label: string
  value: string | number
  sublabel?: string
  icon: typeof Activity
  tone: 'emerald' | 'red' | 'amber' | 'sky'
  trend?: number
  progress?: number
  onClick?: () => void
}) {
  const tones = {
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'glow-emerald' },
    red: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', glow: 'glow-red' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'glow-amber' },
    sky: { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', glow: '' },
  }
  const t = tones[tone]
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={cn(
        'bg-card border border-border rounded-lg p-5 relative overflow-hidden',
        onClick && 'cursor-pointer',
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none">
        <div className={cn('absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl', t.bg)} />
      </div>
      <div className="relative flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-md flex items-center justify-center', t.bg)}>
          <Icon className={cn('w-4 h-4', t.text)} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-0.5 text-[10px] font-medium',
            trend > 0 ? 'text-emerald-400' : 'text-red-400',
          )}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}
          </div>
        )}
      </div>
      <div className="relative">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </div>
        <div className="text-2xl font-semibold text-foreground tabular-nums mt-1">
          {value}
        </div>
        {sublabel && (
          <div className="text-[11px] text-muted-foreground mt-1">{sublabel}</div>
        )}
        {progress !== undefined && (
          <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full', t.text.replace('text-', 'bg-'))}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}

function MonitorMiniCard({
  monitor,
  delay,
  onClick,
}: {
  monitor: Monitor
  delay: number
  onClick?: () => void
}) {
  const c = statusColor(monitor.status)
  const tc = typeColor(monitor.type)
  const Icon = (Icons as any)[typeIcon(monitor.type)] || Activity

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        'bg-card border border-border rounded-md p-4 cursor-pointer transition-all hover:border-foreground/20',
        monitor.status === 'down' && 'glow-red',
        monitor.status === 'degraded' && 'glow-amber',
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-8 h-8 rounded-md flex items-center justify-center shrink-0', tc.bg)}>
          <Icon className={cn('w-4 h-4', tc.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-foreground truncate">{monitor.name}</div>
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', c.dot)}>
              {monitor.status !== 'pending' && (
                <span className={cn('absolute inline-flex w-1.5 h-1.5 rounded-full animate-ping opacity-75', c.dot)} />
              )}
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground truncate">{monitor.target}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Status</div>
          <div className={cn('text-xs font-semibold capitalize', c.text)}>{monitor.status}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Uptime</div>
          <div className="text-xs font-semibold text-foreground tabular-nums">
            {formatUptime(monitor.uptime)}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Latency</div>
          <div className="text-xs font-semibold text-foreground tabular-nums">
            {formatMs(monitor.responseTime)}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function HealthBar({
  label,
  value,
  total,
  tone,
  format,
}: {
  label: string
  value: number
  total: number
  tone: 'emerald' | 'amber' | 'red'
  format?: (v: number) => string
}) {
  const pct = total ? (value / total) * 100 : 0
  const tones = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-foreground">{label}</span>
        <span className="text-xs font-medium text-foreground tabular-nums">
          {format ? format(value) : value}
          {!format && total > 1 && <span className="text-muted-foreground">/{total}</span>}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn('h-full rounded-full', tones[tone])}
        />
      </div>
    </div>
  )
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Activity }) {
  return (
    <div className="p-3 rounded-md border border-border bg-muted/30">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm font-semibold text-foreground tabular-nums">{value}</div>
    </div>
  )
}

function TypeCount({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Activity }) {
  return (
    <div className="p-2 rounded-md border border-border text-center">
      <Icon className="w-3.5 h-3.5 mx-auto text-muted-foreground" />
      <div className="text-xs font-semibold text-foreground tabular-nums mt-1">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-lg bg-card border border-border shimmer" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-72 rounded-lg bg-card border border-border shimmer" />
        <div className="h-72 rounded-lg bg-card border border-border shimmer" />
      </div>
      <div className="h-96 rounded-lg bg-card border border-border shimmer" />
    </div>
  )
}
