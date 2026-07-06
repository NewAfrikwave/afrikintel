'use client'

import { useState, useMemo, useEffect } from 'react'
import { useFetch, apiPost } from '@/lib/use-fetch'
import type { Incident, IncidentStatus, Severity } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  incidentStatusColor, severityColor, formatDuration, timeAgo, formatDateTime,
} from '@/lib/monitor-utils'
import {
  AlertTriangle, CheckCircle2, AlertCircle, Bell, Filter, ChevronDown,
  Search, X, Activity, Clock, Shield, Zap, MessageSquare, Sparkles, Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

export function IncidentsView() {
  const [filter, setFilter] = useState<IncidentStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Incident | null>(null)
  const { data, loading, refetch } = useFetch<{ incidents: Incident[] }>('/api/incidents', { refreshMs: 5000 })

  const filtered = useMemo(() => {
    if (!data?.incidents) return []
    return data.incidents.filter((i) => {
      if (filter !== 'all' && i.status !== filter) return false
      if (search) {
        const q = search.toLowerCase()
        return i.title.toLowerCase().includes(q) || i.monitor?.name?.toLowerCase().includes(q)
      }
      return true
    })
  }, [data, filter, search])

  const handleAcknowledge = async (id: string) => {
    try {
      await apiPost(`/api/incidents/${id}/acknowledge`, { message: 'Acknowledged by operator', author: 'operator' })
      toast.success('Incident acknowledged')
      refetch()
      if (selected?.id === id) {
        setSelected((s) => s ? { ...s, status: 'acknowledged' } : s)
      }
    } catch (e) {
      toast.error(`Failed: ${(e as Error).message}`)
    }
  }
  const handleResolve = async (id: string) => {
    try {
      await apiPost(`/api/incidents/${id}/resolve`, { message: 'Resolved by operator', author: 'operator' })
      toast.success('Incident resolved')
      refetch()
      if (selected?.id === id) {
        setSelected((s) => s ? { ...s, status: 'resolved' } : s)
      }
    } catch (e) {
      toast.error(`Failed: ${(e as Error).message}`)
    }
  }

  if (loading && !data) {
    return (
      <div className="p-4 md:p-6 space-y-3 max-w-[1200px] mx-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-card border border-border shimmer" />
        ))}
      </div>
    )
  }

  const counts = {
    all: data?.incidents.length || 0,
    open: data?.incidents.filter((i) => i.status === 'open').length || 0,
    acknowledged: data?.incidents.filter((i) => i.status === 'acknowledged').length || 0,
    resolved: data?.incidents.filter((i) => i.status === 'resolved').length || 0,
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterTab label="All" value="all" current={filter} onChange={setFilter} count={counts.all} />
        <FilterTab label="Open" value="open" current={filter} onChange={setFilter} count={counts.open} tone="red" />
        <FilterTab label="Acknowledged" value="acknowledged" current={filter} onChange={setFilter} count={counts.acknowledged} tone="amber" />
        <FilterTab label="Resolved" value="resolved" current={filter} onChange={setFilter} count={counts.resolved} tone="emerald" />
        <div className="flex items-center gap-2 h-9 px-3 rounded-md bg-card border border-border flex-1 min-w-[200px] ml-auto">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search incidents..."
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
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-lg">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-500/50" />
          <div className="text-sm font-medium text-foreground">No incidents found</div>
          <div className="text-xs text-muted-foreground mt-1">
            {filter === 'all' && !search ? 'All systems are operational' : 'Try adjusting your filters'}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((inc, i) => (
            <IncidentRow
              key={inc.id}
              incident={inc}
              delay={i * 0.04}
              onClick={() => setSelected(inc)}
              onAcknowledge={() => handleAcknowledge(inc.id)}
              onResolve={() => handleResolve(inc.id)}
            />
          ))}
        </div>
      )}

      {/* Detail */}
      <AnimatePresence>
        {selected && (
          <IncidentDetailPanel
            incident={selected}
            onClose={() => setSelected(null)}
            onAcknowledge={() => handleAcknowledge(selected.id)}
            onResolve={() => handleResolve(selected.id)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function FilterTab({
  label,
  value,
  current,
  onChange,
  count,
  tone,
}: {
  label: string
  value: IncidentStatus | 'all'
  current: IncidentStatus | 'all'
  onChange: (v: IncidentStatus | 'all') => void
  count: number
  tone?: 'red' | 'amber' | 'emerald'
}) {
  const active = current === value
  const tones = {
    red: 'text-red-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
  }
  return (
    <button
      onClick={() => onChange(value)}
      className={cn(
        'h-9 px-3 rounded-md border text-xs font-medium flex items-center gap-2 transition-all',
        active
          ? 'bg-card border-foreground/20 text-foreground'
          : 'bg-transparent border-border text-muted-foreground hover:bg-card/50 hover:text-foreground',
      )}
    >
      {label}
      <span className={cn(
        'px-1.5 py-0.5 rounded text-[10px] tabular-nums',
        tone && !active ? tones[tone] : 'text-muted-foreground',
        active && tone && tones[tone],
        active && !tone && 'bg-muted text-foreground',
      )}>
        {count}
      </span>
    </button>
  )
}

function IncidentRow({
  incident,
  delay,
  onClick,
  onAcknowledge,
  onResolve,
}: {
  incident: Incident
  delay: number
  onClick: () => void
  onAcknowledge: () => void
  onResolve: () => void
}) {
  const sc = severityColor(incident.severity)
  const ic = incidentStatusColor(incident.status)
  const icon =
    incident.severity === 'critical' ? (
      <AlertTriangle className="w-4 h-4 text-red-400" />
    ) : incident.severity === 'warning' ? (
      <AlertCircle className="w-4 h-4 text-amber-400" />
    ) : (
      <Bell className="w-4 h-4 text-sky-400" />
    )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      onClick={onClick}
      className="bg-card border border-border rounded-md p-4 cursor-pointer hover:border-foreground/20 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-sm font-medium text-foreground">{incident.title}</div>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium uppercase border', sc.bg, sc.text, sc.border)}>
              {incident.severity}
            </span>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium uppercase border', ic.bg, ic.text, ic.border)}>
              {incident.status}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
            <span>{incident.monitor?.name}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(incident.startedAt)}
            </span>
            {incident.duration && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  {formatDuration(incident.duration)}
                </span>
              </>
            )}
          </div>
        </div>
        {incident.status === 'open' && (
          <button
            onClick={(e) => { e.stopPropagation(); onAcknowledge() }}
            className="h-7 px-2.5 rounded border border-border text-[11px] hover:bg-muted text-amber-400 border-amber-500/30"
          >
            Acknowledge
          </button>
        )}
        {(incident.status === 'open' || incident.status === 'acknowledged') && (
          <button
            onClick={(e) => { e.stopPropagation(); onResolve() }}
            className="h-7 px-2.5 rounded border border-border text-[11px] hover:bg-muted text-emerald-400 border-emerald-500/30"
          >
            Resolve
          </button>
        )}
      </div>
    </motion.div>
  )
}

function IncidentDetailPanel({
  incident,
  onClose,
  onAcknowledge,
  onResolve,
}: {
  incident: Incident
  onClose: () => void
  onAcknowledge: () => void
  onResolve: () => void
}) {
  const sc = severityColor(incident.severity)
  const ic = incidentStatusColor(incident.status)
  const updates = incident.updates || []
  const [postmortem, setPostmortem] = useState<any>(null)
  const [generating, setGenerating] = useState(false)

  const generatePostmortem = async (incidentId: string) => {
    setGenerating(true)
    try {
      const r = await fetch(`/api/postmortems/${incidentId}/generate`, { method: 'POST' })
      const data = await r.json()
      if (r.ok) {
        setPostmortem(data.postmortem)
        toast.success('AI postmortem generated')
      } else {
        toast.error(`Generation failed: ${data.error}`)
      }
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`)
    } finally {
      setGenerating(false)
    }
  }

  // Load existing postmortem when incident changes
  useEffect(() => {
    setPostmortem(null)
    fetch(`/api/postmortems/${incident.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.postmortem) setPostmortem(d.postmortem) })
      .catch(() => {})
  }, [incident.id])

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      className="fixed top-0 right-0 bottom-0 z-40 w-full max-w-[520px] bg-background border-l border-border shadow-2xl overflow-y-auto"
    >
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border p-5">
        <div className="flex items-start gap-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-foreground">{incident.title}</h2>
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium uppercase border', sc.bg, sc.text, sc.border)}>
                {incident.severity}
              </span>
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium uppercase border', ic.bg, ic.text, ic.border)}>
                {incident.status}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {incident.monitor?.name} · started {timeAgo(incident.startedAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <DetailStat label="Started" value={formatDateTime(incident.startedAt)} />
          <DetailStat
            label="Duration"
            value={incident.duration ? formatDuration(incident.duration) : 'ongoing'}
          />
          <DetailStat
            label="Resolved"
            value={incident.resolvedAt ? formatDateTime(incident.resolvedAt) : '—'}
          />
        </div>

        {/* Description */}
        {incident.description && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Description</div>
            <div className="text-xs text-foreground bg-card border border-border rounded-md p-3">
              {incident.description}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Timeline</div>
          <div className="space-y-3">
            {[...updates].reverse().map((u, i) => {
              const isLast = i === updates.length - 1
              const c = incidentStatusColor(u.status as IncidentStatus)
              return (
                <div key={u.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn('w-2.5 h-2.5 rounded-full border-2 border-background', c.bg.replace('/10', '/80'))} />
                    {!isLast && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded uppercase font-medium border', c.bg, c.text, c.border)}>
                        {u.status}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{timeAgo(u.createdAt)}</span>
                    </div>
                    <div className="text-xs text-foreground mt-1">{u.message}</div>
                    {u.author && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />
                        {u.author}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-border">
          {incident.status === 'open' && (
            <button
              onClick={onAcknowledge}
              className="flex-1 h-9 rounded-md border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs font-medium"
            >
              Acknowledge
            </button>
          )}
          {(incident.status === 'open' || incident.status === 'acknowledged') && (
            <button
              onClick={onResolve}
              className="flex-1 h-9 rounded-md border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs font-medium"
            >
              Mark Resolved
            </button>
          )}
          <button
            onClick={() => generatePostmortem(incident.id)}
            className="flex-1 h-9 rounded-md border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            AI Postmortem
          </button>
        </div>
        {postmortem && (
          <div className="mt-3 border border-purple-500/30 bg-purple-500/5 rounded-md p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-purple-400">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Generated Postmortem
              <button
                onClick={() => generatePostmortem(incident.id)}
                className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
              >
                Regenerate
              </button>
            </div>
            <PostmortemSection title="Summary" content={postmortem.summary} />
            <PostmortemSection title="Root Cause" content={postmortem.rootCause} />
            <PostmortemSection title="Action Items" content={postmortem.actionItems} />
          </div>
        )}
      </div>
    </motion.div>
  )
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-md p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xs text-foreground mt-0.5">{value}</div>
    </div>
  )
}

function PostmortemSection({ title, content }: { title: string; content: string }) {
  if (!content) return null
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-purple-400 font-medium mb-0.5">{title}</div>
      <div className="text-xs text-foreground whitespace-pre-wrap">{content}</div>
    </div>
  )
}
