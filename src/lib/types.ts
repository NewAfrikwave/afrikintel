// Shared types for Afrikintel monitoring platform

export type MonitorType =
  | 'website'
  | 'service'
  | 'server'
  | 'ping'
  | 'dns'
  | 'blacklist'

export type MonitorStatus = 'up' | 'down' | 'degraded' | 'pending'

export type IncidentStatus = 'open' | 'acknowledged' | 'resolved'
export type Severity = 'critical' | 'warning' | 'info'

export type Role = 'admin' | 'editor' | 'viewer'

export type ViewKey =
  | 'dashboard'
  | 'monitors'
  | 'incidents'
  | 'notifications'
  | 'team'
  | 'status'
  | 'settings'
  | 'anomalies'
  | 'intelligence'
  | 'journeys'

export interface Monitor {
  id: string
  name: string
  type: MonitorType
  target: string
  port?: number | null
  interval: number
  timeout: number
  enabled: boolean
  paused: boolean
  status: MonitorStatus
  uptime: number
  responseTime?: number | null
  lastChecked?: string | null
  lastDownAt?: string | null
  consecutiveFailures: number
  thresholdResponseTime: number
  thresholdRetries: number
  thresholdCpu: number
  thresholdRam: number
  thresholdDisk: number
  public: boolean
  order: number
  description?: string | null
  tags?: string | null
  region?: string | null
  checkRegions?: string | null
  createdAt: string
  updatedAt: string
  _count?: { incidents: number }
}

export interface Check {
  id: string
  monitorId: string
  status: MonitorStatus
  responseTime?: number | null
  statusCode?: number | null
  errorMessage?: string | null
  latency?: number | null
  metadata?: string | null
  checkedAt: string
}

export interface ServerMetric {
  id: string
  monitorId: string
  cpuUsage: number
  cpuCores: number
  ramTotal: number
  ramUsed: number
  ramUsage: number
  diskTotal: number
  diskUsed: number
  diskUsage: number
  networkIn: number
  networkOut: number
  loadAvg1?: number | null
  loadAvg5?: number | null
  loadAvg15?: number | null
  uptime?: number | null
  processes?: number | null
  temperature?: number | null
  metadata?: string | null
  recordedAt: string
}

export interface IncidentUpdate {
  id: string
  incidentId: string
  status: string
  message: string
  author?: string | null
  createdAt: string
}

export interface Incident {
  id: string
  monitorId: string
  status: IncidentStatus
  severity: Severity
  title: string
  description?: string | null
  startedAt: string
  resolvedAt?: string | null
  duration?: number | null
  monitor?: { id: string; name: string; type: MonitorType }
  updates?: IncidentUpdate[]
}

export interface User {
  id: string
  email: string
  name: string
  role: Role
  avatar?: string | null
  active: boolean
  lastLogin?: string | null
  createdAt: string
}

export interface NotificationChannel {
  id: string
  type: string
  name: string
  config: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface NotificationLog {
  id: string
  channelId?: string | null
  channelName: string
  incidentId?: string | null
  monitorId?: string | null
  message: string
  status: string
  error?: string | null
  sentAt: string
}

export interface DashboardStats {
  summary: {
    total: number
    up: number
    down: number
    degraded: number
    paused: number
    openIncidents: number
    resolvedToday: number
    totalIncidents: number
    avgUptime: number
    avgResponseTime: number
  }
  uptimeTimeline: { hour: number; uptime: number; total: number }[]
  recentIncidents: (Incident & { monitor: { id: string; name: string; type: MonitorType } })[]
  monitors: Monitor[]
  byType: Record<string, number>
  byRegion: Record<string, number>
  byCheckRegion?: Record<string, { total: number; up: number; down: number; degraded: number }>
}

export interface LiveStats {
  total: number
  up: number
  down: number
  degraded: number
  openIncidents: number
  avgResponseTime: number
  avgUptime: number
  timestamp: number
  monitors: {
    id: string
    name: string
    type: MonitorType
    status: MonitorStatus
    responseTime?: number | null
    uptime: number
    region?: string | null
    lastChecked?: string | null
  }[]
}
