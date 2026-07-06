'use client'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Search, Bell, Plus, RefreshCw, Command, Activity } from 'lucide-react'
import { useEffect, useState } from 'react'
import { subscribeStats } from '@/lib/socket'

const viewTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Real-time overview of all monitored assets' },
  monitors: { title: 'Monitors', subtitle: 'Manage website, service, and server checks' },
  incidents: { title: 'Incidents', subtitle: 'Active and historical incident timeline' },
  notifications: { title: 'Notifications', subtitle: 'Alert channels and delivery logs' },
  team: { title: 'Team', subtitle: 'User accounts, roles, and access control' },
  status: { title: 'Status Page', subtitle: 'Public-facing service status' },
  settings: { title: 'Settings', subtitle: 'System configuration and preferences' },
  anomalies: { title: 'Anomaly Detection', subtitle: 'Predictive alerts using EWMA + z-score baselines' },
  intelligence: { title: 'Incident Intelligence', subtitle: 'Correlation, root-cause analysis, and AI postmortems' },
  journeys: { title: 'Synthetic Monitoring', subtitle: 'Multi-step user journey checks' },
}

export function TopBar({ onLoginClick }: { onLoginClick?: () => void }) {
  const activeView = useAppStore((s) => s.activeView)
  const setActiveView = useAppStore((s) => s.setActiveView)
  const liveStats = useAppStore((s) => s.liveStats)
  const [now, setNow] = useState<Date>(new Date())
  const [livePulse, setLivePulse] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const unsub = subscribeStats(() => {
      setLivePulse(true)
      setTimeout(() => setLivePulse(false), 300)
    })
    return unsub
  }, [])

  const info = viewTitles[activeView] || viewTitles.dashboard

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center px-4 md:px-6 gap-3 md:gap-4 pl-14 md:pl-6">
      {/* Title */}
      <div className="min-w-0 flex-1">
        <h1 className="text-sm md:text-base font-semibold tracking-tight text-foreground leading-tight truncate">
          {info.title}
        </h1>
        <p className="text-[10px] md:text-xs text-muted-foreground leading-tight truncate hidden sm:block">
          {info.subtitle}
        </p>
      </div>

      {/* Live status pills */}
      <div className="hidden md:flex items-center gap-2">
        {liveStats && (
          <>
            <StatusPill
              label="UP"
              value={liveStats.up}
              tone="emerald"
              pulse={livePulse}
            />
            <StatusPill
              label="DOWN"
              value={liveStats.down}
              tone="red"
              pulse={livePulse}
            />
            <StatusPill
              label="DEGRADED"
              value={liveStats.degraded}
              tone="amber"
              pulse={livePulse}
            />
          </>
        )}
      </div>

      {/* Search */}
      <button className="hidden lg:flex items-center gap-2 h-9 px-3 rounded-md bg-muted/50 hover:bg-muted border border-border text-xs text-muted-foreground transition-colors min-w-[200px]">
        <Search className="w-3.5 h-3.5" />
        <span>Search monitors...</span>
        <kbd className="ml-auto flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border text-[10px] font-mono">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      {/* Refresh / time */}
      <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
        <div className={cn('w-1.5 h-1.5 rounded-full', livePulse ? 'bg-emerald-500' : 'bg-muted-foreground/50')} />
        <span>{now.toLocaleTimeString('en-US', { hour12: false })}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setActiveView('notifications')}
          className="relative w-9 h-9 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {liveStats && liveStats.openIncidents > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-background" />
          )}
        </button>
        <button
          onClick={() => setActiveView('monitors')}
          className="h-9 px-2 sm:px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Monitor</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>
    </header>
  )
}

function StatusPill({
  label,
  value,
  tone,
  pulse,
}: {
  label: string
  value: number
  tone: 'emerald' | 'red' | 'amber'
  pulse?: boolean
}) {
  const tones = {
    emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
    red: 'border-red-500/30 bg-red-500/5 text-red-400',
    amber: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
  }
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[10px] font-medium uppercase tracking-wider transition-all',
        tones[tone],
        pulse && 'scale-105',
      )}
    >
      <Activity className="w-3 h-3" />
      <span className="tabular-nums text-sm font-semibold">{value}</span>
      <span className="opacity-70">{label}</span>
    </div>
  )
}
