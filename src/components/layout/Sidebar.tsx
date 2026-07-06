'use client'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { ViewKey } from '@/lib/types'
import { useSession } from 'next-auth/react'
import { useState, useEffect, useSyncExternalStore } from 'react'
import {
  LayoutDashboard, Activity, AlertTriangle, Bell, Users, Globe, Settings,
  ChevronLeft, ChevronRight, Zap, ShieldCheck, LogIn, Menu, X,
} from 'lucide-react'
import { UserMenu } from '@/components/auth/LoginDialog'

const navItems: {
  key: ViewKey
  label: string
  icon: typeof LayoutDashboard
  description: string
}[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Live overview' },
  { key: 'monitors', label: 'Monitors', icon: Activity, description: 'All assets' },
  { key: 'incidents', label: 'Incidents', icon: AlertTriangle, description: 'Open & past' },
  { key: 'anomalies', label: 'Anomalies', icon: Zap, description: 'Predictive alerts' },
  { key: 'intelligence', label: 'Intelligence', icon: ShieldCheck, description: 'Correlation & RCA' },
  { key: 'journeys', label: 'Journeys', icon: Globe, description: 'Synthetic monitoring' },
  { key: 'notifications', label: 'Notifications', icon: Bell, description: 'Channels & logs' },
  { key: 'team', label: 'Team', icon: Users, description: 'Users & roles' },
  { key: 'status', label: 'Status Page', icon: Globe, description: 'Public page' },
  { key: 'settings', label: 'Settings', icon: Settings, description: 'System config' },
]

export function Sidebar({ onLoginClick }: { onLoginClick?: () => void }) {
  const activeView = useAppStore((s) => s.activeView)
  const setActiveView = useAppStore((s) => s.setActiveView)
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const liveStats = useAppStore((s) => s.liveStats)
  const { data: session } = useSession()
  const hydrated = useHydrated()
  const displaySession = hydrated ? session : null
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile sidebar on view change (deferred to avoid cascading renders)
  useEffect(() => {
    if (!activeView) return
    const t = setTimeout(() => setMobileOpen(false), 0)
    return () => clearTimeout(t)
  }, [activeView])

  const allUp = liveStats ? liveStats.up === liveStats.total && liveStats.down === 0 : false

  const asideContent = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 h-16 px-4 border-b border-sidebar-border">
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-emerald-500/30 blur-xl rounded-full" />
          <img src="/logo.svg" alt="Afrikintel" className="relative w-9 h-9 rounded-lg" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold tracking-tight text-foreground">
              Afrikintel
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Monitoring · v3.0
            </div>
          </div>
        )}
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden w-8 h-8 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* System status indicator */}
      {!collapsed && liveStats && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="relative">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  allUp ? 'bg-emerald-500' : liveStats.down > 0 ? 'bg-red-500' : 'bg-amber-500',
                )}
              >
                <div
                  className={cn(
                    'absolute inset-0 rounded-full animate-ping opacity-75',
                    allUp ? 'bg-emerald-500' : liveStats.down > 0 ? 'bg-red-500' : 'bg-amber-500',
                  )}
                />
              </div>
            </div>
            <span className="text-xs font-medium text-foreground">
              {allUp
                ? 'All systems operational'
                : liveStats.down > 0
                  ? `${liveStats.down} monitor${liveStats.down > 1 ? 's' : ''} down`
                  : `${liveStats.degraded} degraded`}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            {liveStats.up}/{liveStats.total} up · {liveStats.openIncidents} open incidents
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const active = activeView === item.key
            const Icon = item.icon
            const badge =
              item.key === 'incidents' && liveStats?.openIncidents
                ? liveStats.openIncidents
                : null
            return (
              <button
                key={item.key}
                onClick={() => setActiveView(item.key)}
                className={cn(
                  'group w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 relative',
                  active
                    ? 'bg-sidebar-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground',
                  collapsed && 'justify-center px-0',
                )}
                title={collapsed ? item.label : undefined}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-500 rounded-r" />
                )}
                <Icon
                  className={cn(
                    'w-[18px] h-[18px] shrink-0',
                    active && 'text-emerald-500',
                  )}
                  strokeWidth={active ? 2.4 : 2}
                />
                {!collapsed && (
                  <>
                    <div className="flex-1 text-left">
                      <div className="leading-tight">{item.label}</div>
                      <div className="text-[10px] text-muted-foreground/70 leading-tight">
                        {item.description}
                      </div>
                    </div>
                    {badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-500/15 text-red-400 tabular-nums">
                        {badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && badge && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* User card / login */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-sidebar-border">
          {displaySession ? (
            <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-sidebar-accent/50 transition-colors">
              <UserMenu />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">
                  {(displaySession.user as any).name || (displaySession.user as any).email}
                </div>
                <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  {(displaySession.user as any).role || 'viewer'}
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-sidebar-accent/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <LogIn className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-xs font-medium">Sign in</div>
                <div className="text-[10px] opacity-70">Manage & acknowledge</div>
              </div>
            </button>
          )}
        </div>
      )}
      {collapsed && !displaySession && (
        <div className="px-3 py-3 border-t border-sidebar-border flex justify-center">
          <button
            onClick={onLoginClick}
            className="w-8 h-8 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
            title="Sign in"
          >
            <LogIn className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {collapsed && displaySession && (
        <div className="px-3 py-3 border-t border-sidebar-border flex justify-center">
          <UserMenu />
        </div>
      )}

      {/* Collapse toggle — desktop only */}
      <button
        onClick={toggleSidebar}
        className="hidden md:flex h-10 border-t border-sidebar-border items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
        aria-label="Toggle sidebar"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </>
  )

  return (
    <>
      {/* Mobile hamburger button — fixed top-left */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 w-10 h-10 rounded-md bg-card border border-border flex items-center justify-center text-foreground shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop sidebar — always visible */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-out shrink-0',
          collapsed ? 'w-[68px]' : 'w-[260px]',
        )}
      >
        {asideContent}
      </aside>

      {/* Mobile sidebar — overlay when open */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-sidebar border-r border-sidebar-border flex flex-col animate-slide-in-left">
            {asideContent}
          </aside>
        </div>
      )}
    </>
  )
}

function subscribeHydration(onStoreChange: () => void) {
  const id = window.setTimeout(onStoreChange, 0)
  return () => window.clearTimeout(id)
}

function useHydrated() {
  return useSyncExternalStore(subscribeHydration, () => true, () => false)
}
