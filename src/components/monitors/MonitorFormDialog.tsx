'use client'

import { useState, useEffect } from 'react'
import type { Monitor, MonitorType } from '@/lib/types'
import { apiPost, apiPut } from '@/lib/use-fetch'
import { cn } from '@/lib/utils'
import { typeColor, typeIcon } from '@/lib/monitor-utils'
import * as Icons from 'lucide-react'
import { X, Globe, Network, Server, Radio, Tags, ShieldBan, Activity, Save, Zap, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const typeOptions: { value: MonitorType; label: string; icon: string; description: string }[] = [
  { value: 'website', label: 'Website', icon: 'Globe', description: 'HTTP/HTTPS URL check' },
  { value: 'service', label: 'Service', icon: 'Network', description: 'TCP/UDP port check' },
  { value: 'server', label: 'Server', icon: 'Server', description: 'Agent-based metrics' },
  { value: 'ping', label: 'Ping', icon: 'Radio', description: 'ICMP ping check' },
  { value: 'dns', label: 'DNS', icon: 'Tags', description: 'DNS resolution check' },
  { value: 'blacklist', label: 'Blacklist', icon: 'ShieldBan', description: 'IP blacklist check' },
]

const regions = ['us-east', 'us-west', 'eu-west', 'eu-central', 'ap-southeast', 'ap-northeast', 'global']

export function MonitorFormDialog({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean
  editing: Monitor | null
  onClose: () => void
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'website' as MonitorType,
    target: '',
    port: '',
    interval: 30,
    timeout: 30,
    description: '',
    tags: '',
    region: 'us-east',
    checkRegions: ['us-east'] as string[],
    thresholdResponseTime: 2000,
    thresholdCpu: 85,
    thresholdRam: 85,
    thresholdDisk: 90,
    thresholdRetries: 2,
    public: true,
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ status: string; responseTime?: number; errorMessage?: string | null; note?: string } | null>(null)

  const handleTest = async () => {
    if (!form.target) {
      toast.error('Enter a target first')
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const r = await fetch('/api/monitors/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          target: form.target,
          port: form.port ? parseInt(form.port) : undefined,
        }),
      })
      const result = await r.json()
      setTestResult(result)
      if (result.status === 'up') toast.success(`Connection OK · ${result.responseTime || 0}ms`)
      else if (result.status === 'degraded') toast.warning(`Degraded · ${result.errorMessage || ''}`)
      else toast.error(`Connection failed · ${result.errorMessage || ''}`)
    } catch (e: any) {
      setTestResult({ status: 'down', errorMessage: e.message })
      toast.error(`Test failed: ${e.message}`)
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        type: editing.type,
        target: editing.target,
        port: editing.port ? String(editing.port) : '',
        interval: editing.interval,
        timeout: editing.timeout,
        description: editing.description || '',
        tags: editing.tags || '',
        region: editing.region || 'us-east',
        checkRegions: editing.checkRegions ? editing.checkRegions.split(',').map((s) => s.trim()).filter(Boolean) : [editing.region || 'us-east'],
        thresholdResponseTime: editing.thresholdResponseTime,
        thresholdCpu: editing.thresholdCpu,
        thresholdRam: editing.thresholdRam,
        thresholdDisk: editing.thresholdDisk,
        thresholdRetries: editing.thresholdRetries,
        public: editing.public,
      })
    } else {
      setForm({
        name: '',
        type: 'website',
        target: '',
        port: '',
        interval: 30,
        timeout: 30,
        description: '',
        tags: '',
        region: 'us-east',
        checkRegions: ['us-east'],
        thresholdResponseTime: 2000,
        thresholdCpu: 85,
        thresholdRam: 85,
        thresholdDisk: 90,
        thresholdRetries: 2,
        public: true,
      })
    }
  }, [editing, open])

  const handleSave = async () => {
    if (!form.name || !form.target) {
      toast.error('Name and target are required')
      return
    }
    setSaving(true)
    try {
      const body = {
        ...form,
        port: form.port ? parseInt(form.port) : null,
        checkRegions: form.checkRegions.join(','),
      }
      if (editing) {
        await apiPut(`/api/monitors/${editing.id}`, body)
        toast.success('Monitor updated')
      } else {
        await apiPost('/api/monitors', body)
        toast.success('Monitor created')
      }
      onSaved()
    } catch (e) {
      toast.error(`Failed: ${(e as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const needsPort = form.type === 'service'
  const isServer = form.type === 'server'

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-lg shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border p-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {editing ? 'Edit Monitor' : 'New Monitor'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {editing ? 'Update monitor configuration' : 'Configure a new check to monitor'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Type selector */}
              {!editing && (
                <div>
                  <Label>Monitor Type</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {typeOptions.map((t) => {
                      const Icon = (Icons as any)[t.icon] || Activity
                      const active = form.type === t.value
                      return (
                        <button
                          key={t.value}
                          onClick={() => setForm({ ...form, type: t.value })}
                          className={cn(
                            'p-3 rounded-md border text-left transition-all',
                            active
                              ? 'border-emerald-500/40 bg-emerald-500/5'
                              : 'border-border hover:border-foreground/20 bg-background',
                          )}
                        >
                          <Icon className={cn('w-4 h-4 mb-1.5', active ? 'text-emerald-400' : 'text-muted-foreground')} />
                          <div className="text-xs font-medium text-foreground">{t.label}</div>
                          <div className="text-[10px] text-muted-foreground">{t.description}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Basic info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Name" required>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Main Website"
                    className="form-input"
                  />
                </Field>
                <Field label="Primary Region">
                  <select
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value, checkRegions: [e.target.value] })}
                    className="form-input"
                  >
                    {regions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Check Regions (multi)" className="sm:col-span-2">
                  <div className="flex flex-wrap gap-1.5">
                    {regions.map((r) => {
                      const active = form.checkRegions.includes(r)
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            const next = active
                              ? form.checkRegions.filter((x) => x !== r)
                              : [...form.checkRegions, r]
                            setForm({ ...form, checkRegions: next.length ? next : [form.region] })
                          }}
                          className={cn(
                            'px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all',
                            active
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                              : 'border-border bg-background text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {r}
                        </button>
                      )
                    })}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1.5">
                    Select one or more regions to check this monitor from. Each region runs its own check independently.
                  </div>
                </Field>
                <Field
                  label={form.type === 'website' ? 'URL' : needsPort ? 'Host' : 'Target'}
                  required
                  className="sm:col-span-2"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.target}
                      onChange={(e) => {
                        setForm({ ...form, target: e.target.value })
                        setTestResult(null)
                      }}
                      placeholder={
                        form.type === 'website'
                          ? 'https://example.com'
                          : needsPort
                            ? 'example.com'
                            : form.type === 'server'
                              ? 'server01.local'
                              : '8.8.8.8'
                      }
                      className="form-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleTest}
                      disabled={testing || !form.target}
                      className="h-9 px-3 rounded-md border border-border bg-background hover:bg-muted text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                    >
                      {testing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      Test
                    </button>
                  </div>
                  {testResult && (
                    <div className={cn(
                      'mt-2 p-2 rounded-md border text-[11px] flex items-start gap-2',
                      testResult.status === 'up' && 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
                      testResult.status === 'degraded' && 'border-amber-500/30 bg-amber-500/5 text-amber-400',
                      testResult.status === 'down' && 'border-red-500/30 bg-red-500/5 text-red-400',
                    )}>
                      {testResult.status === 'up' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-medium uppercase">{testResult.status}</span>
                        {testResult.responseTime != null && testResult.responseTime > 0 && (
                          <span> · {testResult.responseTime}ms</span>
                        )}
                        {testResult.errorMessage && <div className="opacity-80">{testResult.errorMessage}</div>}
                        {testResult.note && <div className="opacity-80">{testResult.note}</div>}
                      </div>
                    </div>
                  )}
                </Field>
                {needsPort && (
                  <Field label="Port">
                    <input
                      type="number"
                      value={form.port}
                      onChange={(e) => setForm({ ...form, port: e.target.value })}
                      placeholder="443"
                      className="form-input"
                    />
                  </Field>
                )}
                <Field label="Tags (comma separated)">
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="production, web"
                    className="form-input"
                  />
                </Field>
                <Field label="Description" className="sm:col-span-2">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional description"
                    className="form-input min-h-[60px] resize-none"
                  />
                </Field>
              </div>

              {/* Check config */}
              <div>
                <Label>Check Configuration</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  <Field label="Interval (s)">
                    <input
                      type="number"
                      value={form.interval}
                      onChange={(e) => setForm({ ...form, interval: parseInt(e.target.value) || 30 })}
                      className="form-input"
                    />
                  </Field>
                  <Field label="Timeout (s)">
                    <input
                      type="number"
                      value={form.timeout}
                      onChange={(e) => setForm({ ...form, timeout: parseInt(e.target.value) || 30 })}
                      className="form-input"
                    />
                  </Field>
                  <Field label="Retries">
                    <input
                      type="number"
                      value={form.thresholdRetries}
                      onChange={(e) => setForm({ ...form, thresholdRetries: parseInt(e.target.value) || 2 })}
                      className="form-input"
                    />
                  </Field>
                  <Field label="Response threshold (ms)">
                    <input
                      type="number"
                      value={form.thresholdResponseTime}
                      onChange={(e) => setForm({ ...form, thresholdResponseTime: parseInt(e.target.value) || 2000 })}
                      className="form-input"
                    />
                  </Field>
                </div>
              </div>

              {/* Server thresholds */}
              {isServer && (
                <div>
                  <Label>Server Thresholds (%)</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <Field label="CPU">
                      <input
                        type="number"
                        value={form.thresholdCpu}
                        onChange={(e) => setForm({ ...form, thresholdCpu: parseFloat(e.target.value) || 85 })}
                        className="form-input"
                      />
                    </Field>
                    <Field label="RAM">
                      <input
                        type="number"
                        value={form.thresholdRam}
                        onChange={(e) => setForm({ ...form, thresholdRam: parseFloat(e.target.value) || 85 })}
                        className="form-input"
                      />
                    </Field>
                    <Field label="Disk">
                      <input
                        type="number"
                        value={form.thresholdDisk}
                        onChange={(e) => setForm({ ...form, thresholdDisk: parseFloat(e.target.value) || 90 })}
                        className="form-input"
                      />
                    </Field>
                  </div>
                </div>
              )}

              {/* Agent install instructions for server monitors */}
              {isServer && (
                <div className="p-3 rounded-md border border-emerald-500/30 bg-emerald-500/5">
                  <div className="text-xs font-medium text-emerald-400 mb-1 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5" />
                    Server Agent Installation
                  </div>
                  <div className="text-[11px] text-muted-foreground mb-2">
                    After saving, install the agent on your server to start receiving metrics:
                  </div>
                  <pre className="text-[10px] bg-background/50 border border-border rounded p-2 overflow-x-auto text-foreground/90 font-mono">
{`# Download agent (Linux)
curl -O ${typeof window !== 'undefined' ? window.location.origin : 'http://your-afrikintel-host'}/afrikintel-agent.sh
chmod +x afrikintel-agent.sh

# Set environment variables
export AFRIKINTEL_MONITOR_ID="<your-monitor-id>"
export AFRIKINTEL_HOST="${typeof window !== 'undefined' ? window.location.origin : 'http://your-afrikintel-host'}"

# Run agent
./afrikintel-agent.sh`}
                  </pre>
                  <div className="text-[10px] text-muted-foreground mt-1.5">
                    Or use the Python agent: <code className="text-foreground">/afrikintel-agent.py</code> (requires <code className="text-foreground">psutil requests</code>)
                  </div>
                </div>
              )}

              {/* Public toggle */}
              <label className="flex items-center gap-3 p-3 rounded-md border border-border cursor-pointer hover:bg-accent/20">
                <input
                  type="checkbox"
                  checked={form.public}
                  onChange={(e) => setForm({ ...form, public: e.target.checked })}
                  className="w-4 h-4 rounded accent-emerald-500"
                />
                <div className="flex-1">
                  <div className="text-xs font-medium text-foreground">Show on public status page</div>
                  <div className="text-[11px] text-muted-foreground">
                    Visitors can see this monitor's status without authentication
                  </div>
                </div>
              </label>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-card border-t border-border p-4 flex items-center justify-end gap-2">
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
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Create monitor'}
              </button>
            </div>
          </motion.div>
        </>
      )}
      <style jsx global>{`
        .form-input {
          width: 100%;
          height: 36px;
          padding: 0 12px;
          background: oklch(0.13 0.005 240);
          border: 1px solid oklch(1 0 0 / 0.1);
          border-radius: 6px;
          color: oklch(0.96 0.005 240);
          font-size: 12px;
          outline: none;
          transition: border 0.15s;
        }
        .form-input:focus {
          border-color: oklch(0.7 0.18 165 / 0.5);
        }
        .form-input::placeholder {
          color: oklch(0.5 0.01 240);
        }
        textarea.form-input {
          height: auto;
          padding: 8px 12px;
          line-height: 1.5;
        }
      `}</style>
    </AnimatePresence>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
      {children}
    </div>
  )
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <div className="text-xs text-foreground mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </div>
      {children}
    </div>
  )
}
