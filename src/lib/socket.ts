'use client'

import { io, Socket } from 'socket.io-client'
import type { MonitorStatus, LiveStats, Incident } from './types'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/?XTransformPort=3003', {
      path: '/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    })
    socket.on('connect', () => {
      // console.log('[Afrikintel] ws connected')
    })
    socket.on('disconnect', () => {
      // console.log('[Afrikintel] ws disconnected')
    })
  }
  return socket
}

export function subscribeStats(cb: (stats: LiveStats) => void) {
  const s = getSocket()
  const handler = (stats: LiveStats) => cb(stats)
  s.on('stats:update', handler)
  // Request immediately
  s.emit('request:stats')
  return () => s.off('stats:update', handler)
}

export function subscribeMonitorUpdate(
  cb: (data: { monitorId: string; status: MonitorStatus; responseTime?: number | null; incident?: unknown }) => void,
) {
  const s = getSocket()
  const handler = (data: { monitorId: string; status: MonitorStatus; responseTime?: number | null; incident?: unknown }) => cb(data)
  s.on('monitor:update', handler)
  return () => s.off('monitor:update', handler)
}

export function subscribeIncidentNew(cb: (data: { incident: Incident; monitor: { id: string; name: string } }) => void) {
  const s = getSocket()
  const handler = (data: { incident: Incident; monitor: { id: string; name: string } }) => cb(data)
  s.on('incident:new', handler)
  return () => s.off('incident:new', handler)
}

export function subscribeIncidentResolved(cb: (data: { incident: Incident; monitor: { id: string; name: string } }) => void) {
  const s = getSocket()
  const handler = (data: { incident: Incident; monitor: { id: string; name: string } }) => cb(data)
  s.on('incident:resolved', handler)
  return () => s.off('incident:resolved', handler)
}

export function subscribeMonitorHistory(monitorId: string, cb: (data: { monitorId: string; history: any[] }) => void) {
  const s = getSocket()
  s.emit('subscribe:monitor', monitorId)
  const handler = (data: { monitorId: string; history: any[] }) => {
    if (data.monitorId === monitorId) cb(data)
  }
  s.on('monitor:history', handler)
  return () => {
    s.off('monitor:history', handler)
    s.emit('unsubscribe:monitor', monitorId)
  }
}
