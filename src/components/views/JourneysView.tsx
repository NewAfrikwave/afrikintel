'use client'

import { useFetch, apiPost, apiDelete } from '@/lib/use-fetch'
import { cn } from '@/lib/utils'
import { timeAgo, formatMs } from '@/lib/monitor-utils'
import {
  Globe, Plus, X, Play, Pause, Trash2, Edit, Zap, Activity, CheckCircle2,
  AlertCircle, Loader2, Navigation, MousePointerClick, Type, Clock, Eye,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { toast } from 'sonner'
import { statusColor } from '@/lib/monitor-utils'

interface Journey {
  id: string
  name: string
  description: string | null
  enabled: boolean
  interval: number
  timeout: number
  status: string
  lastChecked: string | null
  lastResponseTime: number | null
  uptime: number
  _count?: { steps: number; runs: number }
  steps?: any[]
  runs?: any[]
}

const stepActions = [
  { value: 'navigate', label: 'Navigate', icon: Navigation, color: 'text-sky-400' },
  { value: 'click', label: 'Click', icon: MousePointerClick, color: 'text-emerald-400' },
  { value: 'type', label: 'Type', icon: Type, color: 'text-amber-400' },
  { value: 'wait', label: 'Wait', icon: Clock, color: 'text-muted-foreground' },
  { value: 'assert', label: 'Assert', icon: Eye, color: 'text-purple-400' },
]

export function JourneysView() {
  const { data, loading, refetch } = useFetch<{ journeys: Journey[] }>('/api/journeys', { refreshMs: 8000 })
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Journey | null>(null)

  if (loading && !data) {
    return (
      <div className="p-4 md:p-6 space-y-3 max-w-[1200px] mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-card border border-border shimmer" />
        ))}
      </div>
    )
  }

  const journeys = data?.journeys || []

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Synthetic Monitoring Journeys</h2>
          <p className="text-xs text-muted-foreground">
            Multi-step user journeys (navigate, click, type, assert) — like Playwright tests for production monitoring
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="h-9 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New Journey
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-sky-500/10 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">How Synthetic Monitoring Works</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Define multi-step user journeys (e.g., "navigate to homepage → assert login button visible → click → assert dashboard loads").
              The engine runs each journey at the configured interval and tracks step-by-step timing + pass/fail.
              In sandbox mode, "navigate" performs real HTTP fetches; "click" and "type" are simulated (production mode uses Playwright).
            </p>
          </div>
        </div>
      </div>

      {/* Journeys list */}
      {journeys.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-lg">
          <Globe className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <div className="text-sm font-medium text-foreground">No journeys yet</div>
          <div className="text-xs text-muted-foreground mt-1">
            Create your first synthetic monitoring journey to track multi-step user flows
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Journey
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {journeys.map((j, i) => (
            <JourneyCard key={j.id} journey={j} delay={i * 0.04} onClick={() => setSelected(j)} />
          ))}
        </div>
      )}

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <JourneyForm
            onClose={() => setShowForm(false)}
            onSaved={() => { setShowForm(false); refetch() }}
          />
        )}
      </AnimatePresence>

      {/* Detail */}
      <AnimatePresence>
        {selected && (
          <JourneyDetailPanel
            journey={selected}
            onClose={() => setSelected(null)}
            onRefresh={refetch}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function JourneyCard({ journey, delay, onClick }: { journey: Journey; delay: number; onClick: () => void }) {
  const c = statusColor(journey.status as any)
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        'bg-card border border-border rounded-lg p-4 cursor-pointer transition-all',
        journey.status === 'down' && 'glow-red',
        journey.status === 'degraded' && 'glow-amber',
        !journey.enabled && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={cn('w-9 h-9 rounded-md flex items-center justify-center shrink-0', c.bg)}>
          <Globe className={cn('w-4 h-4', c.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{journey.name}</div>
          <div className="text-[11px] text-muted-foreground truncate">{journey.description || 'No description'}</div>
        </div>
        <div className={cn('w-2 h-2 rounded-full shrink-0 mt-1.5', c.dot)} />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Steps</div>
          <div className="text-xs font-semibold text-foreground tabular-nums">{journey._count?.steps || 0}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Uptime</div>
          <div className="text-xs font-semibold text-foreground tabular-nums">{journey.uptime.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Interval</div>
          <div className="text-xs font-semibold text-foreground">{journey.interval}s</div>
        </div>
      </div>
    </motion.div>
  )
}

function JourneyForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [interval, setInterval] = useState(300)
  const [timeout, setTimeout] = useState(60)
  const [steps, setSteps] = useState<any[]>([{ action: 'navigate', target: '', value: '', description: '' }])
  const [saving, setSaving] = useState(false)

  const addStep = () => setSteps([...steps, { action: 'wait', target: '', value: '1000', description: '' }])
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i))
  const updateStep = (i: number, field: string, value: string) => {
    const next = [...steps]
    next[i] = { ...next[i], [field]: value }
    setSteps(next)
  }

  const handleSave = async () => {
    if (!name) {
      toast.error('Name is required')
      return
    }
    if (steps.length === 0) {
      toast.error('At least one step is required')
      return
    }
    setSaving(true)
    try {
      await apiPost('/api/journeys', { name, description, interval, timeout, steps })
      toast.success('Journey created')
      onSaved()
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`)
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
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-lg shadow-2xl"
      >
        <div className="border-b border-border p-5 flex items-center justify-between sticky top-0 bg-card z-10">
          <h2 className="text-base font-semibold">New Synthetic Journey</h2>
          <button onClick={onClose} className="w-8 h-8 rounded hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-foreground mb-1.5">Name</div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Login flow"
                className="w-full h-9 px-3 bg-background border border-border rounded-md text-xs outline-none focus:border-emerald-500/40"
              />
            </div>
            <div>
              <div className="text-xs text-foreground mb-1.5">Description</div>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
                className="w-full h-9 px-3 bg-background border border-border rounded-md text-xs outline-none focus:border-emerald-500/40"
              />
            </div>
            <div>
              <div className="text-xs text-foreground mb-1.5">Interval (s)</div>
              <input
                type="number"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 300)}
                className="w-full h-9 px-3 bg-background border border-border rounded-md text-xs outline-none focus:border-emerald-500/40"
              />
            </div>
            <div>
              <div className="text-xs text-foreground mb-1.5">Timeout (s)</div>
              <input
                type="number"
                value={timeout}
                onChange={(e) => setTimeout(parseInt(e.target.value) || 60)}
                className="w-full h-9 px-3 bg-background border border-border rounded-md text-xs outline-none focus:border-emerald-500/40"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-foreground">Steps</div>
              <button
                onClick={addStep}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add step
              </button>
            </div>
            <div className="space-y-2">
              {steps.map((step, i) => {
                const action = stepActions.find((a) => a.value === step.action) || stepActions[0]
                const Icon = action.icon
                return (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-md border border-border bg-background/50">
                    <div className="text-[10px] text-muted-foreground tabular-nums w-6 pt-1.5">{i + 1}.</div>
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <select
                        value={step.action}
                        onChange={(e) => updateStep(i, 'action', e.target.value)}
                        className="h-8 px-2 bg-background border border-border rounded text-xs outline-none"
                      >
                        {stepActions.map((a) => (
                          <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={step.description || ''}
                        onChange={(e) => updateStep(i, 'description', e.target.value)}
                        placeholder="Description (optional)"
                        className="h-8 px-2 bg-background border border-border rounded text-xs outline-none col-span-1"
                      />
                      <input
                        type="text"
                        value={step.target}
                        onChange={(e) => updateStep(i, 'target', e.target.value)}
                        placeholder={step.action === 'navigate' ? 'https://example.com' : step.action === 'wait' ? '(unused)' : 'CSS selector'}
                        className="h-8 px-2 bg-background border border-border rounded text-xs outline-none col-span-1"
                      />
                      <input
                        type="text"
                        value={step.value || ''}
                        onChange={(e) => updateStep(i, 'value', e.target.value)}
                        placeholder={step.action === 'wait' ? '1000 (ms)' : step.action === 'type' ? 'text to type' : step.action === 'assert' ? 'text to find' : '(unused)'}
                        className="h-8 px-2 bg-background border border-border rounded text-xs outline-none col-span-1"
                      />
                    </div>
                    <button
                      onClick={() => removeStep(i)}
                      className="w-7 h-7 rounded hover:bg-muted text-muted-foreground hover:text-red-400 flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="border-t border-border p-4 flex items-center justify-end gap-2 sticky bottom-0 bg-card">
          <button onClick={onClose} className="h-9 px-4 rounded-md border border-border hover:bg-muted text-xs font-medium">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-xs font-medium flex items-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {saving ? 'Creating...' : 'Create journey'}
          </button>
        </div>
      </motion.div>
    </>
  )
}

function JourneyDetailPanel({ journey, onClose, onRefresh }: { journey: Journey; onClose: () => void; onRefresh: () => void }) {
  const { data } = useFetch<{ journey: Journey }>(`/api/journeys/${journey.id}`, { refreshMs: 5000 })
  const j = data?.journey || journey

  const handleDelete = async () => {
    if (!confirm(`Delete journey "${j.name}"?`)) return
    try {
      await apiDelete(`/api/journeys/${j.id}`)
      toast.success('Journey deleted')
      onRefresh()
      onClose()
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`)
    }
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      className="fixed top-0 right-0 bottom-0 z-40 w-full max-w-[640px] bg-background border-l border-border shadow-2xl overflow-y-auto"
    >
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-semibold text-foreground">{j.name}</h2>
            <div className="text-xs text-muted-foreground">{j.description || 'No description'}</div>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="h-8 px-3 rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs flex items-center gap-1.5"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <DetailStat label="Status" value={j.status} tone={statusColor(j.status as any).text} />
          <DetailStat label="Uptime" value={`${j.uptime.toFixed(1)}%`} />
          <DetailStat label="Last Run" value={j.lastChecked ? timeAgo(j.lastChecked) : 'never'} />
          <DetailStat label="Duration" value={formatMs(j.lastResponseTime)} />
        </div>

        {/* Steps */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Journey Steps ({j.steps?.length || 0})</div>
          <div className="space-y-2">
            {j.steps?.map((step: any, i: number) => {
              const action = stepActions.find((a) => a.value === step.action) || stepActions[0]
              const Icon = action.icon
              return (
                <div key={step.id} className="flex items-center gap-3 p-3 rounded-md border border-border bg-card">
                  <div className="text-xs font-medium text-muted-foreground tabular-nums w-6">{i + 1}</div>
                  <div className={cn('w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-muted')}>
                    <Icon className={cn('w-3.5 h-3.5', action.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground capitalize">{step.action}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {step.target || step.value || step.description || '—'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent runs */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Recent Runs ({j.runs?.length || 0})</div>
          <div className="bg-card border border-border rounded-md overflow-hidden">
            {j.runs && j.runs.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Time</th>
                      <th className="px-3 py-2 font-medium text-right">Duration</th>
                      <th className="px-3 py-2 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {j.runs.slice(0, 20).map((run: any) => {
                      const c = statusColor(run.status as any)
                      return (
                        <tr key={run.id} className="border-b border-border/50 hover:bg-accent/20">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <span className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
                              <span className={cn('capitalize', c.text)}>{run.status}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{timeAgo(run.checkedAt)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-foreground">{formatMs(run.responseTime)}</td>
                          <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">{run.errorMessage || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground">No runs yet</div>
            )}
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
      <div className={cn('text-sm font-semibold mt-0.5 capitalize', tone, !tone && 'text-foreground')}>{value}</div>
    </div>
  )
}
