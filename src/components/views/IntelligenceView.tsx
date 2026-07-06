'use client'

import { useFetch } from '@/lib/use-fetch'
import { cn } from '@/lib/utils'
import { timeAgo, formatDuration } from '@/lib/monitor-utils'
import {
  ShieldCheck, AlertTriangle, GitBranch, Sparkles, Loader2, FileText,
  CheckCircle2, Activity, Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { toast } from 'sonner'

interface AnalyticsData {
  anomalies: { open: number; recent: any[] }
  incidentGroups: { open: number; recent: any[] }
  journeys: { active: number; runs24h: number }
  dedup: {
    activeRecords: number
    totalSuppressed: number
    totalAlerts: number
    suppressionRate: string
    records: any[]
  }
  postmortems: { total: number }
}

interface IncidentGroup {
  id: string
  status: string
  severity: string
  title: string
  rootCauseHypothesis: string | null
  startedAt: string
  resolvedAt: string | null
  count: number
  correlationScore: number
  incidents: any[]
  monitors: any[]
}

export function IntelligenceView() {
  const { data, loading, refetch } = useFetch<AnalyticsData>('/api/analytics', { refreshMs: 8000 })
  const { data: groupsData } = useFetch<{ groups: IncidentGroup[] }>('/api/incident-groups', { refreshMs: 8000 })
  const [postmortemLoading, setPostmortemLoading] = useState<string | null>(null)

  if (loading && !data) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-lg bg-card border border-border shimmer" />
        ))}
      </div>
    )
  }

  const handleGeneratePostmortem = async (incidentId: string) => {
    setPostmortemLoading(incidentId)
    try {
      const r = await fetch(`/api/postmortems/${incidentId}/generate`, { method: 'POST' })
      const result = await r.json()
      if (r.ok) {
        toast.success('AI postmortem generated')
        refetch()
      } else {
        toast.error(`Generation failed: ${result.error}`)
      }
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`)
    } finally {
      setPostmortemLoading(null)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1200px] mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Open Groups" value={data?.incidentGroups.open || 0} icon={GitBranch} tone="amber" />
        <StatCard label="Alerts Suppressed" value={data?.dedup.totalSuppressed || 0} icon={ShieldCheck} tone="emerald" sub={`Suppression rate: ${data?.dedup.suppressionRate || '0%'}`} />
        <StatCard label="Active Dedups" value={data?.dedup.activeRecords || 0} icon={Zap} tone="sky" />
        <StatCard label="Postmortems" value={data?.postmortems.total || 0} icon={FileText} tone="purple" />
      </div>

      {/* Alert Dedup panel */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Smart Alert Dedup</h3>
            <p className="text-xs text-muted-foreground">
              Suppresses repeat alerts within 30-min window, re-alerts every 2h for ongoing issues. The #1 differentiator for ops tools.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-400 tabular-nums">{data?.dedup.suppressionRate || '0%'}</div>
            <div className="text-[10px] uppercase text-muted-foreground">Suppression rate</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <MiniStat label="Total Alerts" value={data?.dedup.totalAlerts || 0} />
          <MiniStat label="Suppressed" value={data?.dedup.totalSuppressed || 0} tone="emerald" />
          <MiniStat label="Delivered" value={(data?.dedup.totalAlerts || 0) - (data?.dedup.totalSuppressed || 0)} tone="sky" />
        </div>
        {data?.dedup.records && data.dedup.records.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Active Dedup Records</div>
            <div className="space-y-1">
              {data.dedup.records.slice(0, 5).map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded border border-border bg-muted/20 text-xs">
                  <code className="text-[10px] text-muted-foreground">{r.fingerprint}</code>
                  <span className="flex-1 capitalize text-foreground">{r.issueType}</span>
                  <span className="text-muted-foreground">count: {r.count}</span>
                  <span className="text-emerald-400">suppressed: {r.suppressed}</span>
                  <span className="text-muted-foreground">{timeAgo(r.lastSeenAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Incident Correlation panel */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
            <GitBranch className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Incident Correlation</h3>
            <p className="text-xs text-muted-foreground">
              When multiple monitors fail within 5 minutes, they're grouped as a correlated incident with a root-cause hypothesis.
            </p>
          </div>
        </div>
        {groupsData?.groups && groupsData.groups.length > 0 ? (
          <div className="space-y-3">
            {groupsData.groups.slice(0, 5).map((group) => (
              <IncidentGroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
            No correlated incidents — all failures are independent
          </div>
        )}
      </div>

      {/* AI Postmortem panel */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-md bg-purple-500/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">AI-Assisted Postmortems</h3>
            <p className="text-xs text-muted-foreground">
              Generate a structured RCA from the incident timeline, check history, and metrics using GLM-4.
            </p>
          </div>
        </div>
        <PostmortemGenerator onGenerate={handleGeneratePostmortem} loading={postmortemLoading} />
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, tone, sub }: { label: string; value: string | number; icon: typeof Zap; tone: 'amber' | 'emerald' | 'sky' | 'purple'; sub?: string }) {
  const tones = {
    amber: 'text-amber-400 bg-amber-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    sky: 'text-sky-400 bg-sky-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
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
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </motion.div>
  )
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: 'emerald' | 'sky' }) {
  return (
    <div className="p-2.5 rounded-md border border-border bg-muted/20">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn('text-lg font-semibold tabular-nums', tone === 'emerald' ? 'text-emerald-400' : tone === 'sky' ? 'text-sky-400' : 'text-foreground')}>
        {value}
      </div>
    </div>
  )
}

function IncidentGroupCard({ group }: { group: IncidentGroup }) {
  const isOpen = group.status === 'open'
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'border rounded-md p-3',
        isOpen ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-muted/20',
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className={cn('w-3.5 h-3.5', isOpen ? 'text-amber-400' : 'text-muted-foreground')} />
        <span className="text-sm font-medium text-foreground flex-1">{group.title}</span>
        <span className={cn(
          'text-[10px] px-1.5 py-0.5 rounded uppercase font-medium',
          group.severity === 'critical' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400',
        )}>
          {group.severity}
        </span>
        <span className={cn(
          'text-[10px] px-1.5 py-0.5 rounded uppercase font-medium',
          isOpen ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400',
        )}>
          {group.status}
        </span>
      </div>
      <div className="text-xs text-foreground mb-2">
        <strong>Root cause hypothesis:</strong> {group.rootCauseHypothesis || 'Not yet determined'}
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span>{group.count} incidents</span>
        <span>·</span>
        <span>{group.monitors.length} monitors</span>
        <span>·</span>
        <span>correlation: {(group.correlationScore * 100).toFixed(0)}%</span>
        <span>·</span>
        <span>{timeAgo(group.startedAt)}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {group.monitors.slice(0, 5).map((m) => (
          <span key={m.id} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground">
            {m.name}
          </span>
        ))}
        {group.monitors.length > 5 && (
          <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground">+{group.monitors.length - 5}</span>
        )}
      </div>
    </motion.div>
  )
}

function PostmortemGenerator({ onGenerate, loading }: { onGenerate: (id: string) => void; loading: string | null }) {
  const [incidentId, setIncidentId] = useState('')
  const [recentIncidents, setRecentIncidents] = useState<any[]>([])
  const [generated, setGenerated] = useState<any>(null)

  // Fetch recent incidents for the dropdown
  useState(() => {
    fetch('/api/incidents?limit=10')
      .then((r) => r.json())
      .then((d) => setRecentIncidents(d.incidents || []))
      .catch(() => {})
  })

  const handleGenerate = async () => {
    if (!incidentId) {
      toast.error('Select an incident first')
      return
    }
    onGenerate(incidentId)
    // Fetch the generated postmortem
    setTimeout(async () => {
      const r = await fetch(`/api/postmortems/${incidentId}`)
      const d = await r.json()
      setGenerated(d.postmortem)
    }, 1000)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select
          value={incidentId}
          onChange={(e) => setIncidentId(e.target.value)}
          className="flex-1 h-9 px-3 bg-background border border-border rounded-md text-xs outline-none focus:border-purple-500/40"
        >
          <option value="">Select an incident...</option>
          {recentIncidents.map((inc: any) => (
            <option key={inc.id} value={inc.id}>
              {inc.title} ({inc.severity}, {timeAgo(inc.startedAt)})
            </option>
          ))}
        </select>
        <button
          onClick={handleGenerate}
          disabled={!incidentId || loading === incidentId}
          className="h-9 px-4 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 disabled:opacity-50 text-xs font-medium flex items-center gap-1.5"
        >
          {loading === incidentId ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Generate RCA
        </button>
      </div>
      {generated && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-purple-500/30 bg-purple-500/5 rounded-md p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-purple-400">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Generated Postmortem
            <span className="text-[10px] text-muted-foreground ml-auto">Model: {generated.model}</span>
          </div>
          <Section title="Summary" content={generated.summary} />
          <Section title="Root Cause" content={generated.rootCause} />
          <Section title="Contributing Factors" content={generated.contributingFactors} />
          <Section title="Impact" content={generated.impact} />
          <Section title="Action Items" content={generated.actionItems} />
        </motion.div>
      )}
    </div>
  )
}

function Section({ title, content }: { title: string; content: string }) {
  if (!content) return null
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-purple-400 font-medium mb-1">{title}</div>
      <div className="text-xs text-foreground whitespace-pre-wrap">{content}</div>
    </div>
  )
}
