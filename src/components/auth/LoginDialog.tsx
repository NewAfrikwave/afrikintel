'use client'

import { useState } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { X, Mail, Lock, LogIn, LogOut, ShieldCheck, Github, Loader2, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

const demoAccounts = [
  { email: 'demo@afrikintel.com', password: 'demo1234', role: 'viewer', label: 'AppSumo Demo', color: 'emerald' },
  { email: 'admin@afrikintel.com', password: 'admin', role: 'admin', label: 'Admin', color: 'emerald' },
  { email: 'ops@afrikintel.com', password: 'ops', role: 'editor', label: 'Editor', color: 'sky' },
  { email: 'viewer@afrikintel.com', password: 'view', role: 'viewer', label: 'Viewer', color: 'zinc' },
]

export function LoginDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: session } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)

  const handleSignIn = async (e?: React.FormEvent, preset?: { email: string; password: string }) => {
    e?.preventDefault()
    const creds = preset || { email, password }
    if (!creds.email || !creds.password) {
      toast.error('Email and password required')
      return
    }
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        email: creds.email,
        password: creds.password,
        redirect: false,
      })
      if (res?.error) {
        toast.error('Invalid credentials')
      } else if (res?.ok) {
        toast.success('Signed in successfully')
        onClose()
        // Redirect to dashboard
        if (typeof window !== 'undefined') {
          window.location.href = '/dashboard'
        }
      }
    } catch (e: any) {
      toast.error(`Sign-in failed: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-card border border-border rounded-lg shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-6 border-b border-border overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 bg-emerald-500/30 pointer-events-none" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Sign in to Afrikintel</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Authenticate to manage monitors, acknowledge incidents, and access admin features
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Credentials form */}
              <form onSubmit={(e) => handleSignIn(e)} className="space-y-3">
                <div>
                  <div className="text-xs text-foreground mb-1.5">Email</div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full h-10 pl-9 pr-3 bg-background border border-border rounded-md text-xs outline-none focus:border-emerald-500/40"
                      required
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-foreground mb-1.5">Password</div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-10 pl-9 pr-9 bg-background border border-border rounded-md text-xs outline-none focus:border-emerald-500/40"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogIn className="w-3.5 h-3.5" />
                  )}
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                  <span className="bg-card px-2 text-muted-foreground">or demo accounts</span>
                </div>
              </div>

              {/* Demo account quick-fill buttons */}
              <div className="grid grid-cols-3 gap-2">
                {demoAccounts.map((a) => (
                  <button
                    key={a.email}
                    onClick={() => {
                      setEmail(a.email)
                      setPassword(a.password)
                      handleSignIn(undefined, { email: a.email, password: a.password })
                    }}
                    disabled={loading}
                    className={cn(
                      'p-2.5 rounded-md border text-left transition-all hover:scale-[1.02]',
                      a.color === 'emerald' && 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10',
                      a.color === 'sky' && 'border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/10',
                      a.color === 'zinc' && 'border-border bg-muted/30 hover:bg-muted/50',
                      loading && 'opacity-50',
                    )}
                  >
                    <div className="text-[11px] font-medium text-foreground">{a.label}</div>
                    <div className="text-[9px] text-muted-foreground truncate">{a.email}</div>
                  </button>
                ))}
              </div>

              {/* GitHub OAuth */}
              <button
                onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
                className="w-full h-10 rounded-md border border-border hover:bg-muted text-xs font-medium flex items-center justify-center gap-2"
              >
                <Github className="w-3.5 h-3.5" />
                Continue with GitHub
                <span className="text-[10px] text-muted-foreground ml-1">
                  (requires GITHUB_ID env)
                </span>
              </button>
            </div>

            <div className="border-t border-border p-4 text-center text-[10px] text-muted-foreground">
              By signing in you agree to the terms of service. Sessions expire after 30 days.
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function UserMenu() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)

  if (status === 'loading') {
    return (
      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
    )
  }

  if (!session) {
    return null
  }

  const user = session.user as any
  const initials = (user.name || user.email || '?')
    .split(/[\s@]/)
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-semibold text-white hover:ring-2 ring-emerald-500/30 transition-all"
      >
        {user.image ? (
          <img src={user.image} alt={user.name} className="w-full h-full rounded-full" />
        ) : (
          initials
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 top-10 z-50 w-56 bg-popover border border-border rounded-md shadow-xl py-1"
          >
            <div className="px-3 py-2 border-b border-border">
              <div className="text-xs font-medium text-foreground truncate">{user.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
              <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] uppercase font-medium bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-2.5 h-2.5" />
                {user.role}
              </div>
            </div>
            <button
              onClick={() => {
                signOut({ callbackUrl: '/landing' })
                setOpen(false)
              }}
              className="w-full px-3 py-2 text-left text-xs hover:bg-accent flex items-center gap-2 text-foreground"
            >
              <LogOut className="w-3 h-3" />
              Sign out
            </button>
          </motion.div>
        </>
      )}
    </div>
  )
}
