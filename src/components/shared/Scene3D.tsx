'use client'

import { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

// ============================================================
// 3D Dashboard Cube Scene
// A rotating cube with monitoring data on each face,
// surrounded by orbit rings and floating particles.
// Mouse movement tilts the entire scene for parallax effect.
// ============================================================

export function Scene3D() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const cubeRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [tilt, setTilt] = useState({ x: -15, y: 0 })

  // Mouse parallax — tilt the scene based on cursor position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sceneRef.current) return
      const rect = sceneRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / window.innerWidth
      const dy = (e.clientY - cy) / window.innerHeight
      // Subtle tilt — max ±8 degrees
      setTilt({
        x: -15 + dy * 8,
        y: dx * 8,
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Particles config
  const particles = [
    { size: 4, top: '10%', left: '15%', color: 'oklch(0.7 0.18 165)', dx: 20, dy: -30, dz: 40, delay: 0 },
    { size: 6, top: '20%', left: '80%', color: 'oklch(0.6 0.18 290)', dx: -25, dy: 20, dz: 30, delay: 0.5 },
    { size: 3, top: '70%', left: '10%', color: 'oklch(0.65 0.13 200)', dx: 30, dy: -20, dz: 50, delay: 1 },
    { size: 5, top: '75%', left: '85%', color: 'oklch(0.7 0.18 165)', dx: -20, dy: -25, dz: 35, delay: 1.5 },
    { size: 4, top: '40%', left: '5%', color: 'oklch(0.6 0.18 290)', dx: 25, dy: 30, dz: 45, delay: 0.8 },
    { size: 3, top: '50%', left: '92%', color: 'oklch(0.65 0.13 200)', dx: -30, dy: -15, dz: 40, delay: 2 },
    { size: 5, top: '85%', left: '50%', color: 'oklch(0.7 0.18 165)', dx: 15, dy: -35, dz: 30, delay: 1.2 },
    { size: 4, top: '5%', left: '50%', color: 'oklch(0.6 0.18 290)', dx: -20, dy: 25, dz: 50, delay: 0.3 },
  ]

  return (
    <div
      ref={sceneRef}
      className="scene-3d relative w-full h-[500px] md:h-[600px] flex items-center justify-center"
      style={{
        perspective: '1200px',
        perspectiveOrigin: '50% 40%',
      }}
    >
      {/* Orbit rings */}
      <div className="orbit-ring orbit-ring-1">
        <div className="orbit-dot" />
      </div>
      <div className="orbit-ring orbit-ring-2">
        <div className="orbit-dot orbit-dot-purple" />
      </div>

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="particle-3d"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            top: p.top,
            left: p.left,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            // @ts-expect-error CSS custom properties
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--dz': `${p.dz}px`,
            animation: `particleFloat ${4 + i * 0.3}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Glow behind cube */}
      <div
        className="absolute w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.7 0.18 165 / 0.4), transparent 70%)',
        }}
      />

      {/* The 3D Cube */}
      <div
        ref={cubeRef}
        className={cn('cube-3d relative z-10', paused && 'paused')}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          animation: 'cubeRotate 24s linear infinite',
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Front face — Dashboard KPIs */}
        <div className="cube-face cube-face-front">
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="cube-status-dot" />
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium">All Systems</span>
            </div>
            <div className="text-3xl font-bold text-foreground tabular-nums">99.48%</div>
            <div className="text-[10px] text-muted-foreground">Avg Uptime · 24h</div>
            <div className="cube-bars mt-2">
              {[40, 65, 50, 80, 45, 70, 55, 90, 60, 75].map((h, i) => (
                <div
                  key={i}
                  className="cube-bar"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Back face — Incident Status */}
        <div className="cube-face cube-face-back">
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="text-[10px] uppercase tracking-wider text-amber-400 font-medium">Incidents</div>
            <div className="text-3xl font-bold text-foreground tabular-nums">0</div>
            <div className="text-[10px] text-muted-foreground">Open right now</div>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-md border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-center"
                >
                  <div className="cube-status-dot" style={{ width: '6px', height: '6px' }} />
                </div>
              ))}
            </div>
            <div className="text-[9px] text-muted-foreground mt-1">5 monitors · all up</div>
          </div>
        </div>

        {/* Right face — Response Time */}
        <div className="cube-face cube-face-right">
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="text-[10px] uppercase tracking-wider text-sky-400 font-medium">Response Time</div>
            <div className="text-3xl font-bold text-foreground tabular-nums">104<span className="text-base text-muted-foreground">ms</span></div>
            <div className="text-[10px] text-muted-foreground">Average · all checks</div>
            {/* Mini line chart */}
            <svg width="140" height="50" viewBox="0 0 140 50" className="mt-2">
              <defs>
                <linearGradient id="cubeLineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline
                points="0,30 14,25 28,35 42,20 56,28 70,15 84,22 98,18 112,30 126,20 140,25"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polygon
                points="0,30 14,25 28,35 42,20 56,28 70,15 84,22 98,18 112,30 126,20 140,25 140,50 0,50"
                fill="url(#cubeLineGrad)"
              />
            </svg>
          </div>
        </div>

        {/* Left face — Multi-Region */}
        <div className="cube-face cube-face-left">
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="text-[10px] uppercase tracking-wider text-teal-400 font-medium">Multi-Region</div>
            <div className="text-2xl font-bold text-foreground tabular-nums">3 Regions</div>
            <div className="flex flex-col gap-1.5 mt-1">
              {[
                { region: 'us-east', status: 'up', latency: '52ms' },
                { region: 'eu-west', status: 'up', latency: '89ms' },
                { region: 'ap-southeast', status: 'up', latency: '134ms' },
              ].map((r) => (
                <div key={r.region} className="flex items-center gap-2 text-[10px]">
                  <div className="cube-status-dot" style={{ width: '6px', height: '6px' }} />
                  <span className="text-foreground font-mono">{r.region}</span>
                  <span className="text-muted-foreground ml-auto tabular-nums">{r.latency}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top face — AI Postmortem */}
        <div className="cube-face cube-face-top">
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="text-[10px] uppercase tracking-wider text-purple-400 font-medium">AI Postmortem</div>
            <div className="text-2xl font-bold text-foreground">RCA</div>
            <div className="text-[10px] text-muted-foreground text-center leading-relaxed">
              Generated in<br />10 seconds
            </div>
            <div className="flex gap-1.5 mt-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-purple-400"
                  style={{
                    animation: `dotBlink 1.5s ease-in-out infinite`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom face — Alert Dedup */}
        <div className="cube-face cube-face-bottom">
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium">Alert Dedup</div>
            <div className="text-3xl font-bold text-foreground tabular-nums">67%</div>
            <div className="text-[10px] text-muted-foreground">Suppression rate</div>
            <div className="flex items-end gap-1 mt-1">
              <div className="w-3 h-4 bg-emerald-500/40 rounded-sm" />
              <div className="w-3 h-6 bg-emerald-500/50 rounded-sm" />
              <div className="w-3 h-10 bg-emerald-500/60 rounded-sm" />
              <div className="w-3 h-14 bg-emerald-500/70 rounded-sm" />
              <div className="w-3 h-16 bg-emerald-500/80 rounded-sm" />
              <div className="w-3 h-12 bg-emerald-500/50 rounded-sm" />
            </div>
            <div className="text-[9px] text-muted-foreground">47 alerts → 1 notification</div>
          </div>
        </div>
      </div>

      {/* Reflection / shadow under cube */}
      <div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 h-8 rounded-full blur-xl opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, oklch(0.7 0.18 165 / 0.3), transparent 70%)',
        }}
      />
    </div>
  )
}
