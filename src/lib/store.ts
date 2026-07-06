'use client'

import { create } from 'zustand'
import type { MonitorStatus } from './types'

type ViewKey = 'dashboard' | 'monitors' | 'incidents' | 'notifications' | 'team' | 'status' | 'settings' | 'anomalies' | 'intelligence' | 'journeys'

interface AppState {
  // Navigation
  activeView: ViewKey
  setActiveView: (v: ViewKey) => void

  // Selected monitor (for drilldown)
  selectedMonitorId: string | null
  setSelectedMonitorId: (id: string | null) => void

  // Theme
  theme: 'dark' | 'light'
  toggleTheme: () => void
  setTheme: (t: 'dark' | 'light') => void

  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Global live stats (from websocket)
  liveStats: {
    total: number
    up: number
    down: number
    degraded: number
    openIncidents: number
    avgResponseTime: number
    avgUptime: number
  } | null
  setLiveStats: (s: AppState['liveStats']) => void

  // Toast notifications (for live incidents)
  liveToasts: { id: string; title: string; description: string; severity: MonitorStatus | 'resolved' }[]
  pushLiveToast: (t: { title: string; description: string; severity: MonitorStatus | 'resolved' }) => void
  dismissLiveToast: (id: string) => void

  // Auth (mock)
  currentUser: { id: string; name: string; email: string; role: 'admin' | 'editor' | 'viewer' }
  setCurrentUser: (u: AppState['currentUser']) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'dashboard',
  setActiveView: (v) => set({ activeView: v }),

  selectedMonitorId: null,
  setSelectedMonitorId: (id) => set({ selectedMonitorId: id }),

  theme: 'dark',
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setTheme: (t) => set({ theme: t }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  liveStats: null,
  setLiveStats: (s) => set({ liveStats: s }),

  liveToasts: [],
  pushLiveToast: (t) =>
    set((s) => {
      const id = Math.random().toString(36).slice(2)
      const toast = { id, ...t }
      // auto-dismiss after 8s
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          set((cur) => ({ liveToasts: cur.liveToasts.filter((x) => x.id !== id) }))
        }, 8000)
      }
      return { liveToasts: [toast, ...s.liveToasts].slice(0, 5) }
    }),
  dismissLiveToast: (id) => set((s) => ({ liveToasts: s.liveToasts.filter((x) => x.id !== id) })),

  currentUser: {
    id: 'u1',
    name: 'Alex Chen',
    email: 'admin@afrikintel.com',
    role: 'admin',
  },
  setCurrentUser: (u) => set({ currentUser: u }),
}))
