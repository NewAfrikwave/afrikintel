'use client'

import { useFetch } from '@/lib/use-fetch'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/monitor-utils'
import { Zap, TrendingUp, AlertCircle, Activity, CheckCircle2, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts'
import { useEffect, useState } from 'react'

interface AnomalyAlert {
  id: string
  monitorId: string
  metric: string
  value: number
  baseline: number
  zScore: number
  severity: string
  status: string
  message: string
  detectedAt: string
  resolvedAt: string | null
  monitor?: { id: string; name: string; type: string; target: string }
}

export function AnomaliesView() {
  const { data, loading } = useFetch<{ anomalies: AnomalyAlert[] }>('/api/anomalies?status=all', { refreshMs: 5000 })
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open')
  const setSelectedMonitorId = useAppStore((s) => s.setSelectedMonitorId)
  const setView = useAppStore((s) => s.setActiveView)

  if (loading && !data) {
    return (
      <div className="p-4 md:p-6 space-y-3 max-w-[1200px] mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-card border border-border shimmer" />
        ))}
      </div>
    )
  }

  const anomalies = data?.anomalies || []
  const filtered = filter === 'all' ? anomalies : anomalies.filter((a) => a.status === filter)
  const openCount = anomalies.filter((a) => a.status === 'open').length
  const criticalCount = anomalies.filter((a) => a.status === 'open' && a.severity === 'critical').length

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1200px] mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Open Anomalies" value={openCount} icon={AlertCircle} tone="amber" />
        <StatCard label="Critical" value={criticalCount} icon={Zap} tone="red" />
        <StatCard label="Total (24h)" value={anomalies.length} icon={Activity} tone="sky" />
        <StatCard label="Avg Z-Score" value={anomalies.length ? (anomalies.reduce((a, b) => a + Math.abs(b.zScore), 0) / anomalies.length).toFixed(1) : '—'} icon={TrendingUp} tone="emerald" />
      </div>

      {/* How it works */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">How Anomaly Detection Works</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Each monitor's metrics (response time, CPU, RAM, disk) are tracked with an{' '}
              <strong className="text-foreground">EWMA baseline</strong> (exponentially weighted moving average).
              When a new check arrives, its <strong className="text-foreground">z-score</strong> (standard deviations
              from baseline) is computed. <span className="text-amber-400">|z| ≥ 2.5σ</span> triggers a warning,
              <span className="text-red-400"> |z| ≥ 4σ</span> triggers critical — all <strong className="text-foreground">before</strong>{' '}
              the hard threshold trips, giving you early warning.
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(['open', 'resolved', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'h-9 px-3 rounded-md border text-xs font-medium capitalize transition-all',
              filter === f
                ? 'bg-card border-foreground/20 text-foreground'
                : 'bg-transparent border-border text-muted-foreground hover:bg-card/50',
            )}
          >
            {f} {f === 'open' && openCount > 0 && `(${openCount})`}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-lg">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-500/50" />
          <div className="text-sm font-medium text-foreground">No anomalies detected</div>
          <div className="text-xs text-muted-foreground mt-1">
            {filter === 'open' ? 'All metrics are within normal range' : 'No anomalies match your filter'}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a, i) => (
            <AnomalyRow key={a.id} anomaly={a} delay={i * 0.04} onClick={() => {
              setSelectedMonitorId(a.monitorId)
              setView('monitors')
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof Zap; tone: 'amber' | 'red' | 'sky' | 'emerald' }) {
  const tones = {
    amber: 'text-amber-400 bg-amber-500/10',
    red: 'text-red-400 bg-red-500/10',
    sky: 'text-sky-400 bg-sky-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('w-7 h-7 rounded-md flex items-center justify-center', tones[tone])}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-foreground tabular-nums">{value}</div>
    </motion.div>
  )
}

function AnomalyRow({ anomaly, delay, onClick }: { anomaly: AnomalyAlert; delay: number; onClick: () => void }) {
  const isCritical = anomaly.severity === 'critical'
  const isOpen = anomaly.status === 'open'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className={cn(
        'bg-card border border-border rounded-md p-4 cursor-pointer hover:border-foreground/20 transition-all',
        isCritical && isOpen && 'glow-red',
        !isCritical && isOpen && 'glow-amber',
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-9 h-9 rounded-md flex items-center justify-center shrink-0',
          isCritical ? 'bg-red-500/10' : 'bg-amber-500/10',
        )}>
          <Zap className={cn('w-4 h-4', isCritical ? 'text-red-400' : 'text-amber-400')} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-sm font-medium text-foreground">{anomaly.monitor?.name || 'Unknown monitor'}</div>
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded font-medium uppercase',
              isCritical ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400',
            )}>
              {anomaly.severity}
            </span>
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded font-medium uppercase',
              isOpen ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400',
            )}>
              {anomaly.status}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">{anomaly.message}</div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Activity className="w-2.5 h-2.5" />
              Metric: <code className="text-foreground">{anomaly.metric}</code>
            </span>
            <span>Detected: {timeAgo(anomaly.detectedAt)}</span>
            {anomaly.resolvedAt && <span>Resolved: {timeAgo(anomaly.resolvedAt)}</span>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Z-Score</div>
          <div className={cn(
            'text-xl font-bold tabular-nums',
            Math.abs(anomaly.zScore) >= 4 ? 'text-red-400' : 'text-amber-400',
          )}>
            {anomaly.zScore > 0 ? '+' : ''}{anomaly.zScore.toFixed(1)}σ
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {anomaly.value.toFixed(1)} vs {anomaly.baseline.toFixed(1)}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
