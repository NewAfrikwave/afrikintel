'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { useFetch, apiPost, apiPut, apiDelete } from '@/lib/use-fetch'
import type { Monitor, MonitorType, MonitorStatus, Check, ServerMetric } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  statusColor, typeColor, typeIcon, formatUptime, formatMs, timeAgo, formatDateTime,
} from '@/lib/monitor-utils'
import * as Icons from 'lucide-react'
import {
  Plus, Search, Filter, Pause, Play, Trash2, Edit, X, Globe, Network, Server,
  Radio, Tags, ShieldBan, Activity, ArrowLeft, Clock, Cpu, HardDrive, Wifi,
  ChevronDown, MoreVertical, AlertCircle, CheckCircle2, Bell,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { toast } from 'sonner'
import { StatusBars, ResponseSparkline, StatusDot } from '@/components/shared/Sparkline'
import { MonitorFormDialog } from '@/components/monitors/MonitorFormDialog'

const typeOptions: { value: MonitorType; label: string; icon: string; description: string }[] = [
  { value: 'website', label: 'Website', icon: 'Globe', description: 'HTTP/HTTPS URL check' },
  { value: 'service', label: 'Service', icon: 'Network', description: 'TCP/UDP port check' },
  { value: 'server', label: 'Server', icon: 'Server', description: 'Agent-based metrics (CPU, RAM, disk)' },
  { value: 'ping', label: 'Ping', icon: 'Radio', description: 'ICMP ping check' },
  { value: 'dns', label: 'DNS', icon: 'Tags', description: 'DNS resolution check' },
  { value: 'blacklist', label: 'Blacklist', icon: 'ShieldBan', description: 'IP blacklist check' },
]

export function MonitorsView() {
  const { data, loading, refetch } = useFetch<{ monitors: Monitor[] }>('/api/monitors', { refreshMs: 5000 })
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<MonitorType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<MonitorStatus | 'all'>('all')
  const [selected, setSelected] = useState<Monitor | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Monitor | null>(null)

  const selectedId = useAppStore((s) => s.selectedMonitorId)
  const setSelectedMonitorId = useAppStore((s) => s.setSelectedMonitorId)

  // Auto-open if requested from another view (event-based, not effect-based)
  useEffect(() => {
    if (!selectedId || !data?.monitors) return
    const m = data.monitors.find((x) => x.id === selectedId)
    if (m && (!selected || selected.id !== selectedId)) {
      // Defer to avoid cascading render in effect
      const t = setTimeout(() => setSelected(m), 0)
      return () => clearTimeout(t)
    }
  }, [selectedId, data, selected])

  const filtered = useMemo(() => {
    if (!data?.monitors) return []
    return data.monitors.filter((m) => {
      if (filterType !== 'all' && m.type !== filterType) return false
      if (filterStatus !== 'all' && m.status !== filterStatus) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          m.name.toLowerCase().includes(q) ||
          m.target.toLowerCase().includes(q) ||
          (m.tags || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [data, search, filterType, filterStatus])

  const handleCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const handleEdit = (m: Monitor) => {
    setEditing(m)
    setFormOpen(true)
  }
  const handleDelete = async (m: Monitor) => {
    if (!confirm(`Delete monitor "${m.name}"? This cannot be undone.`)) return
    try {
      await apiDelete(`/api/monitors/${m.id}`)
      toast.success(`Monitor "${m.name}" deleted`)
      refetch()
      if (selected?.id === m.id) setSelected(null)
    } catch (e) {
      toast.error(`Failed to delete: ${(e as Error).message}`)
    }
  }
  const handlePauseToggle = async (m: Monitor) => {
    try {
      if (m.paused) {
        await apiDelete(`/api/monitors/${m.id}/pause`)
        toast.success(`Resumed "${m.name}"`)
      } else {
        await apiPost(`/api/monitors/${m.id}/pause`)
        toast.success(`Paused "${m.name}"`)
      }
      refetch()
    } catch (e) {
      toast.error(`Failed: ${(e as Error).message}`)
    }
  }

  if (loading && !data) {
    return (
      <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-40 rounded-lg bg-card border border-border shimmer" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 h-9 px-3 rounded-md bg-card border border-border flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search monitors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent flex-1 text-xs outline-none text-foreground placeholder:text-muted-foreground"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <FilterSelect
          value={filterType}
          onChange={(v) => setFilterType(v as MonitorType | 'all')}
          options={[
            { value: 'all', label: 'All types' },
            ...typeOptions.map((t) => ({ value: t.value, label: t.label })),
          ]}
        />
        <FilterSelect
          value={filterStatus}
          onChange={(v) => setFilterStatus(v as MonitorStatus | 'all')}
          options={[
            { value: 'all', label: 'All status' },
            { value: 'up', label: 'Up' },
            { value: 'down', label: 'Down' },
            { value: 'degraded', label: 'Degraded' },
            { value: 'pending', label: 'Pending' },
          ]}
        />
        <button
          onClick={handleCreate}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Monitor
        </button>
      </div>

      {/* Summary line */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing <span className="text-foreground font-medium tabular-nums">{filtered.length}</span> of{' '}
          <span className="text-foreground font-medium tabular-nums">{data?.monitors.length || 0}</span> monitors
        </span>
        {filtered.some((m) => m.status === 'down') && (
          <span className="flex items-center gap-1 text-red-400">
            <AlertCircle className="w-3 h-3" />
            {filtered.filter((m) => m.status === 'down').length} monitors currently down
          </span>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-lg">
          <Activity className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <div className="text-sm font-medium text-foreground">No monitors found</div>
          <div className="text-xs text-muted-foreground mt-1">
            {search || filterType !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding your first monitor'}
          </div>
          {!search && filterType === 'all' && filterStatus === 'all' && (
            <button
              onClick={handleCreate}
              className="mt-4 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Monitor
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((m, i) => (
            <MonitorCard
              key={m.id}
              monitor={m}
              delay={i * 0.03}
              onClick={() => {
                setSelected(m)
                setSelectedMonitorId(m.id)
              }}
              onEdit={() => handleEdit(m)}
              onDelete={() => handleDelete(m)}
              onTogglePause={() => handlePauseToggle(m)}
            />
          ))}
        </div>
      )}

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <MonitorDetailPanel
            monitor={selected}
            onClose={() => {
              setSelected(null)
              setSelectedMonitorId(null)
            }}
            onEdit={() => handleEdit(selected)}
          />
        )}
      </AnimatePresence>

      {/* Form dialog */}
      <MonitorFormDialog
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          refetch()
        }}
      />
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-9 pl-3 pr-8 rounded-md bg-card border border-border text-xs text-foreground cursor-pointer hover:bg-accent/30 transition-colors outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  )
}

function MonitorCard({
  monitor,
  delay,
  onClick,
  onEdit,
  onDelete,
  onTogglePause,
}: {
  monitor: Monitor
  delay: number
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
  onTogglePause: () => void
}) {
  const c = statusColor(monitor.status)
  const tc = typeColor(monitor.type)
  const Icon = (Icons as any)[typeIcon(monitor.type)] || Activity
  const [menuOpen, setMenuOpen] = useState(false)
  const [history, setHistory] = useState<{ status: string }[]>([])

  // Fetch recent check history for mini bars
  useEffect(() => {
    let cancelled = false
    fetch(`/api/monitors/${monitor.id}/checks`)
      .then((r) => r.json())
      .then((d: { checks: Check[] }) => {
        if (!cancelled) setHistory(d.checks.slice(-30))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [monitor.id, monitor.lastChecked])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        'bg-card border border-border rounded-lg p-4 cursor-pointer transition-all relative group',
        monitor.status === 'down' && 'glow-red',
        monitor.status === 'degraded' && 'glow-amber',
        monitor.paused && 'opacity-60',
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn('w-9 h-9 rounded-md flex items-center justify-center shrink-0', tc.bg)}>
          <Icon className={cn('w-4 h-4', tc.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-foreground truncate">{monitor.name}</div>
            {monitor.paused && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                Paused
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">{monitor.target}</div>
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
            className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                }}
              />
              <div className="absolute right-0 top-8 z-50 w-36 bg-popover border border-border rounded-md shadow-lg py-1 text-xs">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); setMenuOpen(false) }}
                  className="w-full px-3 py-1.5 text-left hover:bg-accent flex items-center gap-2"
                >
                  <Edit className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onTogglePause(); setMenuOpen(false) }}
                  className="w-full px-3 py-1.5 text-left hover:bg-accent flex items-center gap-2"
                >
                  {monitor.paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  {monitor.paused ? 'Resume' : 'Pause'}
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); setMenuOpen(false) }}
                  className="w-full px-3 py-1.5 text-left hover:bg-accent text-red-400 flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status strip */}
      <div className="flex items-center gap-2 mb-3">
        <StatusDot status={monitor.status} pulse={monitor.status !== 'pending'} size="sm" />
        <span className={cn('text-xs font-medium capitalize', c.text)}>{monitor.status}</span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {monitor.lastChecked ? `checked ${timeAgo(monitor.lastChecked)}` : 'never checked'}
        </span>
      </div>

      {/* Mini status bars */}
      <div className="flex items-center gap-2 mb-3">
        <StatusBars history={history} width={140} height={18} />
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
          last 30 checks
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
        <Stat label="Uptime" value={formatUptime(monitor.uptime)} tone={monitor.uptime > 99 ? 'good' : monitor.uptime > 95 ? 'warn' : 'bad'} />
        <Stat label="Latency" value={formatMs(monitor.responseTime)} tone={monitor.responseTime && monitor.responseTime < 500 ? 'good' : 'warn'} />
        <Stat label="Interval" value={`${monitor.interval}s`} />
      </div>
    </motion.div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'warn' | 'bad' }) {
  const colors = {
    good: 'text-emerald-400',
    warn: 'text-amber-400',
    bad: 'text-red-400',
  }
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn('text-xs font-semibold tabular-nums', tone && colors[tone], !tone && 'text-foreground')}>
        {value}
      </div>
    </div>
  )
}

function MonitorDetailPanel({
  monitor,
  onClose,
  onEdit,
}: {
  monitor: Monitor
  onClose: () => void
  onEdit: () => void
}) {
  const { data: checksData } = useFetch<{ checks: Check[] }>(`/api/monitors/${monitor.id}/checks`, { refreshMs: 5000 })
  const { data: metricsData } = useFetch<{ metrics: ServerMetric[] }>(
    monitor.type === 'server' ? `/api/monitors/${monitor.id}/metrics` : null,
    { refreshMs: 5000 },
  )

  const c = statusColor(monitor.status)
  const tc = typeColor(monitor.type)
  const Icon = (Icons as any)[typeIcon(monitor.type)] || Activity

  const checks = checksData?.checks || []
  const metrics = metricsData?.metrics || []

  const chartData = monitor.type === 'server'
    ? metrics.map((m, i) => ({
        t: i,
        cpu: m.cpuUsage,
        ram: m.ramUsage,
        disk: m.diskUsage,
        netIn: m.networkIn,
        netOut: m.networkOut,
      }))
    : checks.map((c, i) => ({
        t: i,
        responseTime: c.responseTime || 0,
        status: c.status,
      }))

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      className="fixed top-0 right-0 bottom-0 z-40 w-full max-w-[640px] bg-background border-l border-border shadow-2xl overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border p-5">
        <div className="flex items-start gap-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className={cn('w-10 h-10 rounded-md flex items-center justify-center shrink-0', tc.bg)}>
            <Icon className={cn('w-5 h-5', tc.text)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">{monitor.name}</h2>
              <StatusDot status={monitor.status} pulse={monitor.status !== 'pending'} />
            </div>
            <div className="text-xs text-muted-foreground">{monitor.target}</div>
          </div>
          <button
            onClick={onEdit}
            className="h-8 px-3 rounded-md border border-border hover:bg-muted text-xs flex items-center gap-1.5"
          >
            <Edit className="w-3 h-3" /> Edit
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <DetailStat label="Status" value={monitor.status} tone={c.text} />
          <DetailStat label="Uptime" value={formatUptime(monitor.uptime)} />
          <DetailStat label="Response" value={formatMs(monitor.responseTime)} />
          <DetailStat label="Last Check" value={timeAgo(monitor.lastChecked)} />
        </div>

        {/* Configuration */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Configuration</div>
          <div className="bg-card border border-border rounded-md p-3 grid grid-cols-2 gap-3 text-xs">
            <ConfigItem label="Type" value={monitor.type} />
            <ConfigItem label="Interval" value={`${monitor.interval}s`} />
            <ConfigItem label="Timeout" value={`${monitor.timeout}s`} />
            <ConfigItem label="Region" value={monitor.region || '—'} />
            <ConfigItem label="Public" value={monitor.public ? 'Yes' : 'No'} />
            <ConfigItem label="Threshold" value={`${monitor.thresholdResponseTime}ms`} />
            {monitor.port && <ConfigItem label="Port" value={String(monitor.port)} />}
            <ConfigItem label="Tags" value={monitor.tags || '—'} />
          </div>
        </div>

        {monitor.description && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Description</div>
            <div className="text-xs text-foreground">{monitor.description}</div>
          </div>
        )}

        {/* Charts */}
        {monitor.type === 'server' ? (
          <ServerCharts metrics={metrics} thresholds={monitor} />
        ) : (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Response Time · last {checks.length} checks
            </div>
            <div className="bg-card border border-border rounded-md p-3 h-48">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                    <XAxis dataKey="t" hide />
                    <YAxis tick={{ fontSize: 10, fill: 'oklch(0.65 0.01 240)' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(0.17 0.006 240)',
                        border: '1px solid oklch(1 0 0 / 0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(v: number) => [`${v}ms`, 'Response']}
                      labelFormatter={() => 'Check'}
                    />
                    <Area type="monotone" dataKey="responseTime" stroke="#10b981" strokeWidth={2} fill="url(#rtGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  No check history yet
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent checks table */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Recent Checks</div>
          <div className="bg-card border border-border rounded-md overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              {checks.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">No checks recorded yet</div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Time</th>
                      <th className="px-3 py-2 font-medium text-right">Response</th>
                      <th className="px-3 py-2 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...checks].reverse().slice(0, 20).map((c) => {
                      const sc = statusColor(c.status)
                      return (
                        <tr key={c.id} className="border-b border-border/50 hover:bg-accent/20">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <StatusDot status={c.status} size="sm" />
                              <span className={cn('capitalize', sc.text)}>{c.status}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{formatDateTime(c.checkedAt)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-foreground">
                            {formatMs(c.responseTime)}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">
                            {c.errorMessage || '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function DetailStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-card border border-border rounded-md p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn('text-sm font-semibold mt-0.5 capitalize', tone, !tone && 'text-foreground')}>
        {value}
      </div>
    </div>
  )
}

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xs text-foreground capitalize mt-0.5">{value}</div>
    </div>
  )
}

function ServerCharts({
  metrics,
  thresholds,
}: {
  metrics: ServerMetric[]
  thresholds: { thresholdCpu: number; thresholdRam: number; thresholdDisk: number }
}) {
  if (metrics.length === 0) {
    return (
      <div className="bg-card border border-border rounded-md p-4 text-center text-xs text-muted-foreground">
        No metrics collected yet
      </div>
    )
  }
  const latest = metrics[metrics.length - 1]
  const data = metrics.map((m, i) => ({
    t: i,
    cpu: m.cpuUsage,
    ram: m.ramUsage,
    disk: m.diskUsage,
  }))
  return (
    <div className="space-y-3">
      {/* Current values */}
      <div className="grid grid-cols-4 gap-3">
        <MetricBox
          label="CPU"
          value={latest.cpuUsage}
          threshold={thresholds.thresholdCpu}
          icon={Cpu}
          color="#10b981"
        />
        <MetricBox
          label="RAM"
          value={latest.ramUsage}
          threshold={thresholds.thresholdRam}
          icon={Activity}
          color="#0ea5e9"
          subtitle={`${latest.ramUsed.toFixed(1)} / ${latest.ramTotal.toFixed(0)} GB`}
        />
        <MetricBox
          label="Disk"
          value={latest.diskUsage}
          threshold={thresholds.thresholdDisk}
          icon={HardDrive}
          color="#f59e0b"
          subtitle={`${latest.diskUsed.toFixed(0)} / ${latest.diskTotal.toFixed(0)} GB`}
        />
        <MetricBox
          label="Net I/O"
          value={0}
          icon={Wifi}
          color="#a855f7"
          subtitle={`↓ ${latest.networkIn.toFixed(0)} ↑ ${latest.networkOut.toFixed(0)} KB/s`}
          skipProgress
        />
      </div>

      {/* Combined chart */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          Server Metrics · last {metrics.length} samples
        </div>
        <div className="bg-card border border-border rounded-md p-3 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="diskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
              <XAxis dataKey="t" hide />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'oklch(0.65 0.01 240)' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.17 0.006 240)',
                  border: '1px solid oklch(1 0 0 / 0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(v: number, name) => [`${v.toFixed(1)}%`, name.toUpperCase()]}
              />
              <Area type="monotone" dataKey="cpu" stroke="#10b981" strokeWidth={1.5} fill="url(#cpuGrad)" />
              <Area type="monotone" dataKey="ram" stroke="#0ea5e9" strokeWidth={1.5} fill="url(#ramGrad)" />
              <Area type="monotone" dataKey="disk" stroke="#f59e0b" strokeWidth={1.5} fill="url(#diskGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function MetricBox({
  label,
  value,
  threshold,
  icon: Icon,
  color,
  subtitle,
  skipProgress,
}: {
  label: string
  value: number
  threshold?: number
  icon: typeof Cpu
  color: string
  subtitle?: string
  skipProgress?: boolean
}) {
  const overThreshold = threshold && value > threshold
  return (
    <div className="bg-card border border-border rounded-md p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className={cn('text-lg font-semibold tabular-nums', overThreshold ? 'text-red-400' : 'text-foreground')}>
        {skipProgress ? '—' : `${value.toFixed(1)}%`}
      </div>
      {subtitle && <div className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</div>}
      {!skipProgress && (
        <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, value)}%`, backgroundColor: overThreshold ? '#ef4444' : color }}
          />
        </div>
      )}
    </div>
  )
}
