'use client'

import { useState, useEffect } from 'react'
import { useFetch, apiPut } from '@/lib/use-fetch'
import { cn } from '@/lib/utils'
import {
  Settings as SettingsIcon, Palette, Globe, Clock, Database, Shield,
  Bell, Save, RotateCcw, Zap, Mail, Server, Activity, Cpu, CheckCircle2,
  AlertCircle, Loader2, Radio, Terminal,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface EngineStatus {
  running: boolean
  demoMode: boolean
  totalChecks: number
  realChecks: number
  simulatedChecks: number
  uptime: number
  lastCheckAt: number
  startedAt: number
}

const accentColors = [
  { name: 'Emerald', value: 'emerald', color: 'bg-emerald-500' },
  { name: 'Teal', value: 'teal', color: 'bg-teal-500' },
  { name: 'Cyan', value: 'cyan', color: 'bg-cyan-500' },
  { name: 'Sky', value: 'sky', color: 'bg-sky-500' },
  { name: 'Violet', value: 'violet', color: 'bg-violet-500' },
  { name: 'Purple', value: 'purple', color: 'bg-purple-500' },
  { name: 'Rose', value: 'rose', color: 'bg-rose-500' },
  { name: 'Amber', value: 'amber', color: 'bg-amber-500' },
]

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
]

const timezones = [
  'America/Chicago', 'America/New_York', 'America/Los_Angeles', 'America/Sao_Paulo',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Kolkata',
  'Australia/Sydney', 'UTC',
]

export function SettingsView() {
  const { data, loading, refetch } = useFetch<{ settings: Record<string, string> }>('/api/settings')
  const { data: engineData, refetch: refetchEngine } = useFetch<EngineStatus>('/api/engine', { refreshMs: 3000 })
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [togglingDemo, setTogglingDemo] = useState(false)

  useEffect(() => {
    if (data?.settings) setForm(data.settings)
  }, [data])

  const toggleDemoMode = async () => {
    if (!engineData) return
    setTogglingDemo(true)
    try {
      await fetch('/api/engine', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoMode: !engineData.demoMode }),
      })
      toast.success(`Demo mode ${!engineData.demoMode ? 'enabled' : 'disabled'}`)
      refetchEngine()
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`)
    } finally {
      setTogglingDemo(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiPut('/api/settings', form)
      toast.success('Settings saved')
      refetch()
    } catch (e) {
      toast.error(`Failed: ${(e as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (data?.settings) setForm(data.settings)
  }

  if (loading && !data) {
    return (
      <div className="p-4 md:p-6 max-w-[1000px] mx-auto space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-lg bg-card border border-border shimmer" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-[1000px] mx-auto space-y-5">
      {/* Engine Status */}
      <EngineStatusSection
        status={engineData || null}
        loading={!engineData}
        onToggleDemo={toggleDemoMode}
        toggling={togglingDemo}
      />

      {/* General */}
      <SettingsSection
        icon={SettingsIcon}
        title="General"
        description="Basic application configuration"
      >
        <Field label="Site Name">
          <input
            type="text"
            value={form.siteName || ''}
            onChange={(e) => setForm({ ...form, siteName: e.target.value })}
            className="form-input"
          />
        </Field>
        <Field label="Default Timezone">
          <select
            value={form.timezone || 'America/Chicago'}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            className="form-input"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </Field>
        <Field label="Data Retention (days)">
          <input
            type="number"
            value={form.retentionDays || '30'}
            onChange={(e) => setForm({ ...form, retentionDays: e.target.value })}
            className="form-input"
          />
        </Field>
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection
        icon={Palette}
        title="Appearance"
        description="Customize the look and feel"
      >
        <Field label="Theme">
          <div className="flex gap-2">
            {['dark', 'light'].map((t) => (
              <button
                key={t}
                onClick={() => setForm({ ...form, theme: t })}
                className={cn(
                  'flex-1 h-20 rounded-md border-2 transition-all relative overflow-hidden',
                  (form.theme || 'dark') === t
                    ? 'border-emerald-500/50'
                    : 'border-border hover:border-foreground/20',
                )}
              >
                <div className={cn(
                  'absolute inset-0',
                  t === 'dark' ? 'bg-zinc-950' : 'bg-white',
                )} />
                <div className="relative h-full p-2 flex flex-col justify-between">
                  <div className={cn('w-6 h-1 rounded-full', t === 'dark' ? 'bg-emerald-500' : 'bg-emerald-600')} />
                  <div className="flex gap-1">
                    <div className={cn('w-3 h-3 rounded', t === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200')} />
                    <div className={cn('w-3 h-3 rounded', t === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200')} />
                  </div>
                </div>
                <div className={cn(
                  'absolute bottom-1 right-1 text-[10px] font-medium capitalize',
                  t === 'dark' ? 'text-zinc-400' : 'text-zinc-600',
                )}>
                  {t}
                </div>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Accent Color">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {accentColors.map((c) => (
              <button
                key={c.value}
                onClick={() => setForm({ ...form, accent: c.value })}
                className={cn(
                  'aspect-square rounded-md transition-all relative',
                  c.color,
                  (form.accent || 'emerald') === c.value ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground' : 'hover:scale-105',
                )}
                title={c.name}
              >
                {(form.accent || 'emerald') === c.value && (
                  <svg className="absolute inset-0 m-auto w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </Field>
      </SettingsSection>

      {/* Language */}
      <SettingsSection
        icon={Globe}
        title="Language & Localization"
        description="Multi-language support for international teams"
      >
        <Field label="Default Language">
          <select
            value={form.language || 'en'}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
            className="form-input"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </Field>
        <div className="text-[11px] text-muted-foreground mt-2 p-3 bg-muted/30 rounded-md border border-border">
          The interface will be displayed in this language. Additional translations can be added in the locale files.
        </div>
      </SettingsSection>

      {/* Email / SMTP */}
      <SettingsSection
        icon={Mail}
        title="Email (SMTP)"
        description="Configure outbound email for alert delivery"
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="SMTP Host">
            <input
              type="text"
              value={form.smtp_host || ''}
              onChange={(e) => setForm({ ...form, smtp_host: e.target.value })}
              placeholder="smtp.gmail.com"
              className="form-input"
            />
          </Field>
          <Field label="Port">
            <input
              type="number"
              value={form.smtp_port || '587'}
              onChange={(e) => setForm({ ...form, smtp_port: e.target.value })}
              className="form-input"
            />
          </Field>
          <Field label="Username">
            <input
              type="text"
              value={form.smtp_user || ''}
              onChange={(e) => setForm({ ...form, smtp_user: e.target.value })}
              placeholder="alerts@yourdomain.com"
              className="form-input"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={form.smtp_pass || ''}
              onChange={(e) => setForm({ ...form, smtp_pass: e.target.value })}
              placeholder="app-specific password"
              className="form-input"
            />
          </Field>
          <Field label="From Address" className="col-span-2">
            <input
              type="email"
              value={form.smtp_from || ''}
              onChange={(e) => setForm({ ...form, smtp_from: e.target.value })}
              placeholder="alerts@yourdomain.com"
              className="form-input"
            />
          </Field>
        </div>
        <div className="text-[11px] text-muted-foreground mt-2 p-3 bg-muted/30 rounded-md border border-border">
          Email alerts are sent via this SMTP server when incidents open or resolve. Test by creating a notification channel of type "email" and clicking Test.
        </div>
      </SettingsSection>

      {/* Multi-region */}
      <SettingsSection
        icon={Globe}
        title="Check Regions"
        description="Configure which regions perform checks (multi-region monitoring)"
      >
        <Field label="Active Check Regions (comma-separated)">
          <input
            type="text"
            value={form.check_regions || 'us-east,eu-west,ap-southeast'}
            onChange={(e) => setForm({ ...form, check_regions: e.target.value })}
            placeholder="us-east,eu-west,ap-southeast"
            className="form-input"
          />
        </Field>
        <div className="text-[11px] text-muted-foreground mt-2 p-3 bg-muted/30 rounded-md border border-border">
          In single-instance mode, all regions are checked from this host (the region is just a label).
          For true multi-region monitoring, deploy Afrikintel in multiple regions and set each instance's <code className="text-foreground">CHECK_REGIONS</code> env var to the region it runs in.
        </div>
      </SettingsSection>

      {/* System */}
      <SettingsSection
        icon={Server}
        title="System Information"
        description="Runtime details about your Afrikintel installation"
      >
        <div className="grid grid-cols-2 gap-3">
          <InfoItem label="Version" value="2.1.0-production" icon={Zap} />
          <InfoItem label="Engine" value="Realtime Monitor" icon={Server} />
          <InfoItem
            label="Database"
            value={form.DATABASE_URL?.includes('postgresql') ? 'PostgreSQL (Prisma)' : 'SQLite (Prisma)'}
            icon={Database}
          />
          <InfoItem label="WebSocket" value="Connected · :3003" icon={Bell} />
        </div>
        <div className="mt-3 p-3 rounded-md border border-border bg-muted/30 text-[11px]">
          <div className="text-foreground font-medium mb-1">PostgreSQL migration</div>
          <div className="text-muted-foreground">
            To switch to PostgreSQL for production scale, see <code className="text-foreground">prisma/schema.postgres.prisma</code> and
            <code className="text-foreground"> .env.example</code> for setup instructions.
            PostgreSQL supports concurrent writes (multi-worker checks), better performance at scale,
            and built-in JSON operators for advanced metric queries.
          </div>
        </div>
      </SettingsSection>

      {/* Save bar */}
      <div className="sticky bottom-4 flex items-center justify-end gap-2 p-3 bg-card border border-border rounded-lg shadow-lg">
        <button
          onClick={handleReset}
          className="h-9 px-3 rounded-md border border-border hover:bg-muted text-xs font-medium flex items-center gap-1.5"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-xs font-medium flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

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
      `}</style>
    </div>
  )
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof SettingsIcon
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-3 ml-12">{children}</div>
    </motion.div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-foreground mb-1.5">{label}</div>
      {children}
    </div>
  )
}

function InfoItem({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Zap }) {
  return (
    <div className="p-3 rounded-md border border-border bg-muted/30">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="text-xs font-medium text-foreground">{value}</div>
    </div>
  )
}

function formatUptime(seconds: number): string {
  if (!seconds) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function timeAgo(ts: number): string {
  if (!ts) return 'never'
  const diff = Date.now() - ts
  if (diff < 5000) return 'just now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

function EngineStatusSection({
  status,
  loading,
  onToggleDemo,
  toggling,
}: {
  status: EngineStatus | null
  loading: boolean
  onToggleDemo: () => void
  toggling: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-5 relative overflow-hidden"
    >
      {/* Glow background */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none bg-emerald-500/30" />

      <div className="relative flex items-start gap-3 mb-4">
        <div className={cn(
          'w-9 h-9 rounded-md flex items-center justify-center shrink-0',
          status?.running ? 'bg-emerald-500/10' : 'bg-red-500/10',
        )}>
          {loading ? (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          ) : status?.running ? (
            <Cpu className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Check Engine
            {status?.running && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500">
                  <span className="absolute inline-flex w-1.5 h-1.5 rounded-full animate-ping opacity-75 bg-emerald-500" />
                </span>
                Running
              </span>
            )}
            {status?.demoMode && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 uppercase font-medium">
                Demo Mode
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground">
            Real-time monitoring engine · performs actual network checks
          </p>
        </div>
        {status?.running && (
          <button
            onClick={onToggleDemo}
            disabled={toggling}
            className={cn(
              'h-8 px-3 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors',
              status.demoMode
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
              toggling && 'opacity-50',
            )}
          >
            {toggling && <Loader2 className="w-3 h-3 animate-spin" />}
            {status.demoMode ? 'Disable Demo' : 'Enable Demo'}
          </button>
        )}
      </div>

      <div className="relative ml-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <EngineStat
          label="Total Checks"
          value={status?.totalChecks?.toLocaleString() || '0'}
          icon={Activity}
        />
        <EngineStat
          label="Real Checks"
          value={status?.realChecks?.toLocaleString() || '0'}
          icon={CheckCircle2}
          tone="emerald"
        />
        <EngineStat
          label="Simulated"
          value={status?.simulatedChecks?.toLocaleString() || '0'}
          icon={Radio}
          tone="amber"
        />
        <EngineStat
          label="Engine Uptime"
          value={formatUptime(status?.uptime || 0)}
          icon={Clock}
        />
      </div>

      <div className="relative ml-12 mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>Started: {status?.startedAt ? new Date(status.startedAt).toLocaleString() : '—'}</span>
          <span>·</span>
          <span>Last check: {timeAgo(status?.lastCheckAt || 0)}</span>
        </div>
        <a
          href="/afrikintel-agent.sh"
          download
          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
        >
          <Terminal className="w-3 h-3" />
          Download Agent
        </a>
      </div>

      {status?.demoMode && (
        <div className="relative ml-12 mt-3 p-2 rounded-md border border-amber-500/30 bg-amber-500/5 text-[11px] text-amber-400">
          <strong>Demo mode is active.</strong> All monitors are being checked with simulated data.
          Disable demo mode to start performing real HTTP/TCP/DNS/Ping/Blacklist checks against your monitor targets.
        </div>
      )}

      {!status?.running && !loading && (
        <div className="relative ml-12 mt-3 p-2 rounded-md border border-red-500/30 bg-red-500/5 text-[11px] text-red-400">
          <strong>Engine is not running.</strong> Start the monitor-service (port 3003) to enable real-time checks.
        </div>
      )}
    </motion.div>
  )
}

function EngineStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  icon: typeof Activity
  tone?: 'emerald' | 'amber'
}) {
  const colors = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
  }
  return (
    <div className="p-3 rounded-md border border-border bg-muted/30">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={cn('w-3 h-3 text-muted-foreground', tone && colors[tone])} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="text-lg font-semibold text-foreground tabular-nums">{value}</div>
    </div>
  )
}
