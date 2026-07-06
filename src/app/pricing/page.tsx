'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const plans = [
  {
    id: 'free',
    name: 'Free self-hosted',
    price: '$0',
    period: 'forever',
    description: 'Run Afrikintel on your own infrastructure.',
    features: ['10 monitors included', 'Smart alert dedup', 'Public status page', 'Community support'],
  },
  {
    id: 'pro',
    name: 'Hosted Pro',
    price: '$19',
    period: '/mo',
    description: 'Managed monitoring for small teams.',
    features: ['50 monitors', 'AI postmortems', 'Multi-region checks', 'Email support'],
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: '$79',
    period: '/mo',
    description: 'More monitors and faster support for growing teams.',
    features: ['200 monitors', 'Priority support', 'Team seats', '30-second checks'],
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function checkout(plan: string) {
    if (plan === 'free') {
      router.push('/dashboard')
      return
    }

    setError(null)
    setLoadingPlan(plan)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    setLoadingPlan(null)

    if (!res.ok) {
      setError(data.error || 'Unable to start checkout')
      return
    }

    router.push(data.url)
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:py-20">
        <nav className="flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2 text-sm font-semibold">
            <img src="/logo.svg" alt="Afrikintel" className="h-8 w-8" />
            Afrikintel
          </Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
        </nav>

        <section className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Pricing that scales from self-hosted to hosted.</h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Start free, then move to hosted plans when you want Afrikintel to handle uptime, workers, and operational upkeep for you.
          </p>
        </section>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={cn(
                'flex min-h-[420px] flex-col rounded-lg border bg-card p-6 shadow-sm',
                plan.highlighted && 'border-primary shadow-[0_0_40px_oklch(0.7_0.18_165/0.15)]',
              )}
            >
              <div>
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <p className="mt-2 min-h-12 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-6 flex items-end gap-1">
                  <span className="text-4xl font-semibold">{plan.price}</span>
                  <span className="pb-1 text-sm text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              <ul className="mt-8 space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => checkout(plan.id)}
                disabled={loadingPlan === plan.id}
                className={cn(
                  'mt-auto flex h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors',
                  plan.highlighted
                    ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border-border hover:bg-muted',
                )}
              >
                {loadingPlan === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {plan.id === 'free' ? 'Start Free' : 'Checkout'}
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
