'use client'

import { useState } from 'react'
import { useFetch, apiPost, apiPut, apiDelete } from '@/lib/use-fetch'
import type { User, Role } from '@/lib/types'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/monitor-utils'
import {
  Plus, X, Trash2, Edit, Mail, Shield, ShieldCheck, ShieldAlert, Eye,
  Pencil, Crown, UserPlus,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const roleConfig: Record<Role, { label: string; icon: typeof Eye; color: string; bg: string; description: string }> = {
  admin: { label: 'Admin', icon: Crown, color: 'text-emerald-400', bg: 'bg-emerald-500/10', description: 'Full access to everything' },
  editor: { label: 'Editor', icon: Pencil, color: 'text-sky-400', bg: 'bg-sky-500/10', description: 'Manage monitors and view incidents' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-muted-foreground', bg: 'bg-muted', description: 'Read-only access to dashboards' },
}

export function TeamView() {
  const { data, loading, refetch } = useFetch<{ users: User[] }>('/api/users', { refreshMs: 10000 })
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

  const handleDelete = async (u: User) => {
    if (!confirm(`Remove ${u.name}? They will lose access immediately.`)) return
    try {
      await apiDelete(`/api/users/${u.id}`)
      toast.success(`${u.name} removed`)
      refetch()
    } catch (e) {
      toast.error(`Failed: ${(e as Error).message}`)
    }
  }

  if (loading && !data) {
    return (
      <div className="p-4 md:p-6 space-y-3 max-w-[1000px] mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-card border border-border shimmer" />
        ))}
      </div>
    )
  }

  const roleCounts = {
    admin: data?.users.filter((u) => u.role === 'admin').length || 0,
    editor: data?.users.filter((u) => u.role === 'editor').length || 0,
    viewer: data?.users.filter((u) => u.role === 'viewer').length || 0,
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1000px] mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(roleConfig) as Role[]).map((r) => {
          const cfg = roleConfig[r]
          const Icon = cfg.icon
          return (
            <div key={r} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-7 h-7 rounded-md flex items-center justify-center', cfg.bg)}>
                  <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
                </div>
                <span className="text-xs font-medium text-foreground">{cfg.label}</span>
              </div>
              <div className="text-2xl font-semibold text-foreground tabular-nums">{roleCounts[r]}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{cfg.description}</div>
            </div>
          )
        })}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Team Members</h2>
          <p className="text-xs text-muted-foreground">
            Manage user accounts and their access levels
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="h-9 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium flex items-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add Member
        </button>
      </div>

      {/* User list */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last Login</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.users.map((u, i) => {
              const cfg = roleConfig[u.role]
              const Icon = cfg.icon
              const initials = u.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
              return (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-border/50 hover:bg-accent/20"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-full h-full rounded-full" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-foreground font-medium">{u.name}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Mail className="w-2.5 h-2.5" />
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase', cfg.bg, cfg.color)}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center gap-1 text-[11px]',
                      u.active ? 'text-emerald-400' : 'text-muted-foreground',
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', u.active ? 'bg-emerald-500' : 'bg-muted-foreground')} />
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.lastLogin ? timeAgo(u.lastLogin) : 'never'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => { setEditing(u); setShowForm(true) }}
                        className="w-7 h-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="w-7 h-7 rounded hover:bg-muted text-muted-foreground hover:text-red-400 flex items-center justify-center"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <UserForm
            editing={editing}
            onClose={() => setShowForm(false)}
            onSaved={() => { setShowForm(false); refetch() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function UserForm({
  editing,
  onClose,
  onSaved,
}: {
  editing: User | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(editing?.name || '')
  const [email, setEmail] = useState(editing?.email || '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>(editing?.role || 'viewer')
  const [active, setActive] = useState(editing?.active ?? true)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name || !email) {
      toast.error('Name and email are required')
      return
    }
    if (!editing && !password) {
      toast.error('Password is required for new users')
      return
    }
    setSaving(true)
    try {
      const body: Record<string, unknown> = { name, email, role, active }
      if (password) body.password = password
      if (editing) {
        await apiPut(`/api/users/${editing.id}`, body)
        toast.success('User updated')
      } else {
        await apiPost('/api/users', body)
        toast.success('User created')
      }
      onSaved()
    } catch (e) {
      toast.error(`Failed: ${(e as Error).message}`)
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
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-card border border-border rounded-lg shadow-2xl"
      >
        <div className="border-b border-border p-5 flex items-center justify-between">
          <h2 className="text-base font-semibold">{editing ? 'Edit Member' : 'Add Team Member'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="text-xs text-foreground mb-1.5">Full Name</div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full h-9 px-3 bg-background border border-border rounded-md text-xs outline-none focus:border-emerald-500/40"
            />
          </div>
          <div>
            <div className="text-xs text-foreground mb-1.5">Email</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              className="w-full h-9 px-3 bg-background border border-border rounded-md text-xs outline-none focus:border-emerald-500/40"
            />
          </div>
          <div>
            <div className="text-xs text-foreground mb-1.5">
              Password {editing && '(leave blank to keep current)'}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-9 px-3 bg-background border border-border rounded-md text-xs outline-none focus:border-emerald-500/40"
            />
          </div>
          <div>
            <div className="text-xs text-foreground mb-1.5">Role</div>
            <div className="space-y-2">
              {(Object.keys(roleConfig) as Role[]).map((r) => {
                const cfg = roleConfig[r]
                const Icon = cfg.icon
                const active = role === r
                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={cn(
                      'w-full flex items-center gap-3 p-2.5 rounded-md border text-left transition-all',
                      active ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border hover:border-foreground/20',
                    )}
                  >
                    <div className={cn('w-7 h-7 rounded-md flex items-center justify-center shrink-0', cfg.bg)}>
                      <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-foreground">{cfg.label}</div>
                      <div className="text-[10px] text-muted-foreground">{cfg.description}</div>
                    </div>
                    {active && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                  </button>
                )
              })}
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500"
            />
            Account is active
          </label>
        </div>
        <div className="border-t border-border p-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-md border border-border hover:bg-muted text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-xs font-medium"
          >
            {saving ? 'Saving...' : editing ? 'Save changes' : 'Add member'}
          </button>
        </div>
      </motion.div>
    </>
  )
}
