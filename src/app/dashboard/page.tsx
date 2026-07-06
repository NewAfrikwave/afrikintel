'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { LiveToasts } from '@/components/layout/LiveToasts'
import { DashboardView } from '@/components/views/DashboardView'
import { MonitorsView } from '@/components/views/MonitorsView'
import { IncidentsView } from '@/components/views/IncidentsView'
import { NotificationsView } from '@/components/views/NotificationsView'
import { TeamView } from '@/components/views/TeamView'
import { StatusPageView } from '@/components/views/StatusPageView'
import { SettingsView } from '@/components/views/SettingsView'
import { AnomaliesView } from '@/components/views/AnomaliesView'
import { IntelligenceView } from '@/components/views/IntelligenceView'
import { JourneysView } from '@/components/views/JourneysView'
import { useAppStore } from '@/lib/store'
import { subscribeStats, subscribeIncidentNew, subscribeIncidentResolved } from '@/lib/socket'
import { LoginDialog } from '@/components/auth/LoginDialog'

export default function Home() {
  const activeView = useAppStore((s) => s.activeView)
  const setLiveStats = useAppStore((s) => s.setLiveStats)
  const pushLiveToast = useAppStore((s) => s.pushLiveToast)
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)
  const [loginOpen, setLoginOpen] = useState(false)
  const { data: session } = useSession()

  // Sync session user to app store
  useEffect(() => {
    if (session?.user) {
      const u = session.user as any
      setCurrentUser({
        id: u.id || 'oauth',
        name: u.name || u.email || 'User',
        email: u.email || '',
        role: u.role || 'viewer',
      })
    }
  }, [session, setCurrentUser])

  useEffect(() => {
    const unsubStats = subscribeStats((stats) => {
      setLiveStats({
        total: stats.total,
        up: stats.up,
        down: stats.down,
        degraded: stats.degraded,
        openIncidents: stats.openIncidents,
        avgResponseTime: stats.avgResponseTime,
        avgUptime: stats.avgUptime,
      })
    })
    const unsubNew = subscribeIncidentNew(({ incident, monitor }) => {
      pushLiveToast({
        title: `New ${incident.severity} incident`,
        description: `${monitor.name}: ${incident.title}`,
        severity: incident.severity === 'critical' ? 'down' : 'degraded',
      })
    })
    const unsubRes = subscribeIncidentResolved(({ incident, monitor }) => {
      pushLiveToast({
        title: 'Service recovered',
        description: `${monitor.name} is back up after ${incident.duration || 0}s`,
        severity: 'resolved',
      })
    })
    return () => {
      unsubStats()
      unsubNew()
      unsubRes()
    }
  }, [setLiveStats, pushLiveToast])

  return (
    <div className="flex min-h-screen bg-background bg-grid">
      <Sidebar onLoginClick={() => setLoginOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onLoginClick={() => setLoginOpen(true)} />
        <main className="flex-1 overflow-x-hidden">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'monitors' && <MonitorsView />}
          {activeView === 'incidents' && <IncidentsView />}
          {activeView === 'notifications' && <NotificationsView />}
          {activeView === 'team' && <TeamView />}
          {activeView === 'status' && <StatusPageView />}
          {activeView === 'settings' && <SettingsView />}
          {activeView === 'anomalies' && <AnomaliesView />}
          {activeView === 'intelligence' && <IntelligenceView />}
          {activeView === 'journeys' && <JourneysView />}
        </main>
      </div>
      <LiveToasts />
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  )
}
