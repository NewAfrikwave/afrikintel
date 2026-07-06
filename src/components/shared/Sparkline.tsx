'use client'

import { cn } from '@/lib/utils'
import { statusColor } from '@/lib/monitor-utils'

// Mini SVG sparkline for tiny status history bars
export function StatusBars({
  history,
  width = 80,
  height = 22,
}: {
  history: { status: string }[]
  width?: number
  height?: number
}) {
  const data = history.slice(-30)
  const barW = width / Math.max(1, data.length) - 1
  return (
    <svg width={width} height={height} className="overflow-visible">
      {data.length === 0 && (
        <rect width={width} height={height} fill="oklch(0.4 0.01 240 / 0.2)" rx={2} />
      )}
      {data.map((d, i) => {
        const color =
          d.status === 'up'
            ? '#10b981'
            : d.status === 'down'
              ? '#ef4444'
              : d.status === 'degraded'
                ? '#f59e0b'
                : '#52525b'
        return (
          <rect
            key={i}
            x={i * (barW + 1)}
            y={0}
            width={Math.max(1, barW)}
            height={height}
            fill={color}
            opacity={0.85}
            rx={1}
          >
            <title>{d.status} · {i + 1} checks ago</title>
          </rect>
        )
      })}
    </svg>
  )
}

// Tiny sparkline chart for response time
export function ResponseSparkline({
  data,
  width = 120,
  height = 30,
  color = '#10b981',
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
}) {
  if (!data.length) {
    return <div className="text-[10px] text-muted-foreground">no data</div>
  }
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = Math.max(1, max - min)
  const stepX = width / Math.max(1, data.length - 1)

  const points = data
    .map((v, i) => {
      const x = i * stepX
      const y = height - ((v - min) / range) * (height - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  const areaPoints = `0,${height} ${points} ${width},${height}`

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polygon points={areaPoints} fill={color} opacity={0.12} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={(data.length - 1) * stepX}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r={2.5}
        fill={color}
      />
    </svg>
  )
}

// Status dot with optional pulse
export function StatusDot({
  status,
  pulse = false,
  size = 'md',
}: {
  status: 'up' | 'down' | 'degraded' | 'pending'
  pulse?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const c = statusColor(status)
  const sz = size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-3 h-3' : 'w-2 h-2'
  return (
    <span className="relative inline-flex">
      {pulse && (
        <span
          className={cn('absolute inline-flex animate-ping opacity-75 rounded-full', sz, c.dot)}
        />
      )}
      <span className={cn('relative inline-flex rounded-full', sz, c.dot)} />
    </span>
  )
}
