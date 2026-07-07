'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import {
  Zap, ShieldCheck, GitBranch, Sparkles, Activity, Globe, Bell, Server,
  ArrowRight, Check, TrendingUp, AlertTriangle, Clock, Cpu, Database,
} from 'lucide-react'
import { Scene3D } from '@/components/shared/Scene3D'

const features = [
  {
    icon: ShieldCheck,
    title: 'Smart Alert Dedup',
    description: 'When 8 monitors fail at once, you get 1 alert — not 8. 30-min suppression window with 2h re-alert for ongoing issues.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    glow: 'group-hover:shadow-[0_0_30px_oklch(0.7_0.18_165/0.15)]',
  },
  {
    icon: Sparkles,
    title: 'AI-Assisted Postmortems',
    description: 'One click generates a structured RCA from incident timeline, checks, and metrics. 10 seconds instead of 2 hours.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    glow: 'group-hover:shadow-[0_0_30px_oklch(0.6_0.18_290/0.15)]',
  },
  {
    icon: TrendingUp,
    title: 'Anomaly Detection',
    description: 'EWMA + z-score baselines alert BEFORE your hard thresholds trip. Catches degradation early.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    glow: 'group-hover:shadow-[0_0_30px_oklch(0.75_0.18_80/0.15)]',
  },
  {
    icon: GitBranch,
    title: 'Incident Correlation',
    description: 'Groups related failures into a single incident with auto-generated root-cause hypothesis.',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    glow: 'group-hover:shadow-[0_0_30px_oklch(0.65_0.13_200/0.15)]',
  },
  {
    icon: Globe,
    title: 'Multi-Region Checks',
    description: 'Monitor from us-east, eu-west, and ap-southeast simultaneously. Know if it\'s you or a region.',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    glow: 'group-hover:shadow-[0_0_30px_oklch(0.7_0.15_180/0.15)]',
  },
  {
    icon: Activity,
    title: 'Synthetic Monitoring',
    description: 'Multi-step user journeys: navigate, click, type, assert. Catch broken flows, not just broken pings.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    glow: 'group-hover:shadow-[0_0_30px_oklch(0.65_0.2_15/0.15)]',
  },
]

const plans = [
  {
    name: 'AppSumo Tier 1',
    price: '$59',
    period: 'lifetime',
    description: 'Hosted lifetime access for the launch cohort.',
    features: ['50 hosted monitors', 'Smart alert dedup', 'AI postmortems', 'Multi-region checks', 'Hosted updates included'],
    cta: 'View LTD',
    href: '/appsumo',
    highlighted: false,
  },
  {
    name: 'Hosted Pro',
    price: '$19',
    period: '/month',
    description: 'We host it, you monitor. For teams that want convenience.',
    features: ['50 monitors', 'All 5 AI features', '8 notification channels', 'Multi-region checks', '5-minute check intervals', 'Email support'],
    cta: 'Start Free Trial',
    href: '/pricing',
    highlighted: true,
  },
  {
    name: 'Self-hosted Team',
    price: '$249',
    period: 'one-time',
    description: 'Run Afrikintel on your own infrastructure with support.',
    features: ['Up to 5 instances', '12 months of updates', 'Commercial use', 'Email support', 'Portable deployment docs'],
    cta: 'Buy License',
    href: '/pricing',
    highlighted: false,
  },
]

const stats = [
  { label: 'Monitor Types', value: '6+', suffix: '' },
  { label: 'Notification Channels', value: '8', suffix: '' },
  { label: 'Check Regions', value: '3', suffix: '' },
  { label: 'AI Features', value: '5', suffix: '' },
]

// Animated counter component
function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  const [count, setCount] = useState(0)
  const target = parseInt(value) || 0
  const ref = useRef<HTMLSpanElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
          const duration = 1500
          const steps = 60
          const increment = target / steps
          let current = 0
          const interval = setInterval(() => {
            current += increment
            if (current >= target) {
              setCount(target)
              clearInterval(interval)
            } else {
              setCount(Math.floor(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.5 },
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, started])

  return (
    <span ref={ref} className="number-glow">
      {count}{suffix}
    </span>
  )
}

// Spotlight card — tracks mouse position for radial gradient effect
function SpotlightCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    ref.current?.style.setProperty('--mouse-x', `${x}%`)
    ref.current?.style.setProperty('--mouse-y', `${y}%`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn('spotlight', className)}
    >
      {children}
    </div>
  )
}

export default function LandingPage() {
  const { data: session } = useSession()
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])

  return (
    <div ref={containerRef} className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Global aurora background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="aurora-bg" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/40 blur-lg rounded-lg group-hover:bg-emerald-500/60 transition-colors" />
              <img src="/logo.svg" alt="Afrikintel" className="relative w-8 h-8 transition-transform group-hover:scale-110" />
            </div>
            <span className="text-sm font-semibold text-foreground">Afrikintel</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#features" className="nav-link hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="nav-link hover:text-foreground transition-colors">How it works</a>
            <a href="#pricing" className="nav-link hover:text-foreground transition-colors">Pricing</a>
            <Link href="/appsumo" className="nav-link hover:text-foreground transition-colors">AppSumo</Link>
            <Link href="/docs" className="nav-link hover:text-foreground transition-colors">Docs</Link>
          </div>
          <div className="flex items-center gap-2">
            {session ? (
              <Link
                href="/demo"
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium flex items-center gap-1.5 transition-all hover:shadow-[0_0_20px_oklch(0.7_0.18_165/0.3)]"
              >
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/api/auth/signin"
                  className="h-9 px-3 rounded-md hover:bg-muted text-xs font-medium text-foreground transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/demo"
                  className="h-9 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-all hover:shadow-[0_0_20px_oklch(0.7_0.18_165/0.3)]"
                >
                  Try Demo
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Grid fade background */}
        <div className="absolute inset-0 grid-fade pointer-events-none" />

        {/* Floating orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="float-orb-1 absolute top-20 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-30 bg-emerald-500/40" />
          <div className="float-orb-2 absolute top-32 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 bg-purple-500/40" />
          <div className="float-orb-3 absolute bottom-20 left-1/3 w-64 h-64 rounded-full blur-3xl opacity-25 bg-teal-500/40" />
        </div>

        {/* Decorative pulse line SVG */}
        <svg className="absolute top-1/2 left-0 w-full h-32 -translate-y-1/2 opacity-10 pulse-line pointer-events-none" viewBox="0 0 1200 100" preserveAspectRatio="none">
          <path d="M0,50 L200,50 L220,20 L240,80 L260,30 L280,70 L300,50 L500,50 L520,10 L540,90 L560,20 L580,80 L600,50 L900,50 L920,30 L940,70 L960,40 L980,60 L1000,50 L1200,50" stroke="#10b981" strokeWidth="2" fill="none" />
        </svg>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-medium mb-6 glow-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dot-pulse" />
              Self-hostable · Hosted LTD · AI-Powered
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 max-w-4xl mx-auto leading-[1.05]">
              Infrastructure monitoring
              <br />
              that doesn&apos;t{' '}
              <span className="gradient-text">drown you in alerts</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Afrikintel monitors your websites, services, and servers with smart alert dedup,
              AI-assisted postmortems, anomaly detection, and incident correlation.
              Self-hostable when you need control. Hosted when you want us to run it. Built for ops teams.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/demo"
                className="group h-11 px-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_30px_oklch(0.7_0.18_165/0.4)] hover:scale-105"
              >
                Try the Live Demo
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="/pricing"
                className="group h-11 px-6 rounded-md border border-border hover:bg-muted text-sm font-medium flex items-center justify-center gap-2 transition-all hover:scale-105 shimmer-border"
              >
                <Server className="w-4 h-4 text-emerald-400" />
                Buy Self-hosted License
              </a>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                className="text-center group"
              >
                <div className="text-4xl md:text-5xl font-bold text-foreground tabular-nums group-hover:gradient-text transition-all">
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-1.5 rounded-full bg-emerald-400"
            />
          </div>
        </motion.div>
      </section>

      {/* 3D Dashboard Cube Scene */}
      <section className="relative py-12 md:py-20 border-t border-border overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 grid-fade opacity-30 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-medium mb-3">
              <Activity className="w-3 h-3" />
              Live 3D Preview
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Your infrastructure, <span className="gradient-text">in 3D</span>
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground max-w-xl mx-auto">
              Every face of the cube shows real monitoring data. Hover to pause, move your mouse to tilt the scene.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Scene3D />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 md:py-24 border-t border-border relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-medium mb-3">
              <Zap className="w-3 h-3" />
              Features
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-3">
              Five features that{' '}
              <span className="gradient-text">actually matter</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every monitoring tool checks if your site is up. Afrikintel solves the problems that
              actually make ops teams hate their tools.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <SpotlightCard className={cn(
                    'group bg-card border border-border rounded-lg p-5 hover:border-foreground/20 transition-all duration-300 tilt-card shimmer-border h-full',
                    f.glow,
                  )}>
                    <div className={cn('w-10 h-10 rounded-md flex items-center justify-center mb-3 transition-transform group-hover:scale-110', f.bg)}>
                      <Icon className={cn('w-5 h-5', f.color)} />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1.5">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                  </SpotlightCard>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 md:py-24 border-t border-border bg-muted/20 relative">
        <div className="absolute inset-0 grid-fade opacity-50 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/5 text-sky-400 text-xs font-medium mb-3">
              <Activity className="w-3 h-3" />
              How it works
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-3">
              Up and running in <span className="gradient-text">5 minutes</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Add monitors',
                description: 'Enter your URLs, host:port pairs, or install the agent on your servers. Pick check regions and intervals.',
                icon: Activity,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
              },
              {
                step: '02',
                title: 'Get smart alerts',
                description: 'When something breaks, you get ONE alert (not 47). AI correlates failures and suppresses duplicates.',
                icon: Bell,
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
              },
              {
                step: '03',
                title: 'Generate postmortems',
                description: 'Click a button to generate a structured RCA from the incident data. 10 seconds instead of 2 hours.',
                icon: Sparkles,
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
              },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="relative group"
                >
                  <div className="text-6xl font-bold text-muted-foreground/10 absolute -top-6 -left-2 transition-colors group-hover:text-emerald-500/20">{s.step}</div>
                  <div className="relative bg-card border border-border rounded-lg p-5 transition-all group-hover:border-foreground/20 group-hover:shadow-lg">
                    <div className={cn('w-10 h-10 rounded-md flex items-center justify-center mb-3 transition-transform group-hover:scale-110', s.bg)}>
                      <Icon className={cn('w-5 h-5', s.color)} />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1.5">{s.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 md:py-24 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/5 text-purple-400 text-xs font-medium mb-3">
              <Cpu className="w-3 h-3" />
              Comparison
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-3">
              How we <span className="gradient-text">compare</span>
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass rounded-lg overflow-hidden overflow-x-auto shimmer-border"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Feature</th>
                  <th className="px-4 py-3 text-xs font-medium text-emerald-400 uppercase tracking-wider">Afrikintel</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Better Stack</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Uptime Robot</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Datadog</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ['Smart alert dedup', true, false, false, true],
                  ['AI postmortems', true, false, false, false],
                  ['Anomaly detection', true, true, false, true],
                  ['Incident correlation', true, false, false, false],
                  ['Synthetic monitoring', true, true, false, true],
                  ['Self-hostable', true, false, false, false],
                  ['Open source (MIT)', true, false, false, false],
                  ['Multi-region', true, true, false, true],
                  ['Public status page', true, true, true, true],
                  ['Price from', '$0', '$24/mo', '$0', '$15/host'],
                ].map((row, i) => (
                  <tr key={i} className={cn('transition-colors hover:bg-muted/20', i === 9 && 'bg-muted/10')}>
                    <td className="px-4 py-3 text-xs text-foreground font-medium">{row[0]}</td>
                    {[1, 2, 3, 4].map((j) => (
                      <td key={j} className="px-4 py-3 text-center">
                        {typeof row[j] === 'boolean' ? (
                          row[j] ? (
                            <Check className={cn('w-4 h-4 mx-auto', j === 1 ? 'text-emerald-400' : 'text-muted-foreground')} />
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )
                        ) : (
                          <span className={cn('text-xs', j === 1 ? 'text-emerald-400 font-medium' : 'text-muted-foreground')}>{row[j]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-24 border-t border-border bg-muted/20 relative">
        <div className="absolute inset-0 grid-fade opacity-50 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-medium mb-3">
              <Database className="w-3 h-3" />
              Pricing
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-3">
              Launch deal first. <span className="gradient-text">SaaS revenue next.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Afrikintel is priced for an AppSumo cash injection, recurring hosted SaaS, and a secondary self-hosted license channel.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={cn(
                  'group bg-card border rounded-lg p-6 relative transition-all hover:scale-[1.02]',
                  plan.highlighted
                    ? 'border-emerald-500/40 shadow-lg'
                    : 'border-border hover:border-foreground/20',
                )}
              >
                {plan.highlighted && (
                  <>
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity -z-10" />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">
                      Most Popular
                    </div>
                  </>
                )}
                <div className="text-sm font-semibold text-foreground mb-1">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-bold text-foreground group-hover:gradient-text transition-all">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4 min-h-[40px]">{plan.description}</p>
                <a
                  href={plan.href}
                  className={cn(
                    'block h-10 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 mb-4 transition-all hover:scale-105',
                    plan.highlighted
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_oklch(0.7_0.18_165/0.3)]'
                      : 'border border-border hover:bg-muted text-foreground',
                  )}
                >
                  {plan.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-xs text-muted-foreground">
              All offers include: 6 monitor types · 8 notification channels · public status page · multi-region checks
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 bg-gradient-to-r from-emerald-500 to-purple-500" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass border border-border rounded-2xl p-8 md:p-12 shimmer-border relative overflow-hidden"
          >
            <div className="absolute inset-0 grid-fade opacity-30 pointer-events-none" />
            <h2 className="relative text-2xl md:text-4xl font-bold text-foreground mb-3">
              Ready to stop <span className="gradient-text">drowning in alerts?</span>
            </h2>
            <p className="relative text-muted-foreground mb-6 max-w-xl mx-auto">
              Try the live demo — no signup required. Or deploy Afrikintel on your own infrastructure in 5 minutes.
            </p>
            <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/demo"
                className="group h-11 px-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_30px_oklch(0.7_0.18_165/0.4)] hover:scale-105"
              >
                Try Live Demo
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="/pricing"
                className="h-11 px-6 rounded-md border border-border hover:bg-muted text-sm font-medium flex items-center justify-center gap-2 transition-all hover:scale-105 text-foreground"
              >
                <Server className="w-4 h-4 text-emerald-400" />
                Buy Self-hosted License
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
