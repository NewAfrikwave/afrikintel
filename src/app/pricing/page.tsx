'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Check,
  Download,
  Infinity,
  Loader2,
  Server,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

type PricingOffer = {
  id: string
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  tag?: string
  highlighted?: boolean
  external?: boolean
}

const appsumoOffers: PricingOffer[] = [
  {
    id: 'appsumo_tier1',
    name: 'AppSumo Tier 1',
    price: '$59',
    period: 'lifetime',
    description: 'Hosted lifetime access for reviewers, founders, and early teams.',
    features: ['50 hosted monitors', 'Smart alert dedup', 'AI postmortems', 'Multi-region checks', 'Reviewer-ready demo onboarding'],
    cta: 'Claim Tier 1',
    tag: 'Launch offer',
    highlighted: true,
  },
  {
    id: 'appsumo_tier2',
    name: 'AppSumo Tier 2',
    price: '$99',
    period: 'lifetime',
    description: 'A larger LTD for agencies and teams monitoring multiple client stacks.',
    features: ['200 hosted monitors', 'Priority support queue', 'Team-ready dashboard', '30-second checks where available', 'Future hosted updates included'],
    cta: 'Claim Tier 2',
    tag: 'Best LTD value',
  },
]

const hostedOffers: PricingOffer[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Use Afrikintel for a small hosted setup or a self-hosted trial.',
    features: ['10 monitors', '5-minute checks', 'Public status page', 'Community support'],
    cta: 'Start Free',
  },
  {
    id: 'pro',
    name: 'Hosted Pro',
    price: '$19',
    period: '/mo',
    description: 'Managed monitoring for small teams and freelancers.',
    features: ['50 monitors', '1-minute checks', 'AI postmortems', 'Multi-region checks', 'Email support'],
    cta: 'Start Pro',
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: '$79',
    period: '/mo',
    description: 'More monitor volume and faster support for operational teams.',
    features: ['200 monitors', '30-second checks', 'Team seats', 'Priority support', 'Incident intelligence'],
    cta: 'Start Business',
  },
]

const licenseOffers: PricingOffer[] = [
  {
    id: 'self_hosted_personal',
    name: 'Personal License',
    price: '$99',
    period: 'one-time',
    description: 'Run one private Afrikintel instance with 12 months of updates.',
    features: ['1 self-hosted instance', '12 months of updates', 'Personal/commercial use', 'Email receipt and license record'],
    cta: 'Buy Personal',
  },
  {
    id: 'self_hosted_team',
    name: 'Team License',
    price: '$249',
    period: 'one-time',
    description: 'For teams running Afrikintel across internal or client environments.',
    features: ['Up to 5 instances', '12 months of updates', 'Email support', 'Team/commercial use'],
    cta: 'Buy Team',
    highlighted: true,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const search = useHydratedSearch()
  const licenseSuccess = new URLSearchParams(search).get('license') === '1'

  async function checkout(plan: string) {
    if (plan === 'free') {
      router.push('/demo')
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
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:py-16">
        <nav className="flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2 text-sm font-semibold">
            <img src="/logo.svg" alt="Afrikintel" className="h-8 w-8" />
            Afrikintel
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/appsumo" className="text-muted-foreground hover:text-foreground">
              AppSumo
            </Link>
            <Link href="/demo" className="text-muted-foreground hover:text-foreground">
              Demo
            </Link>
          </div>
        </nav>

        <section className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AppSumo-first launch model
          </div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Lifetime launch deals, hosted SaaS, and self-hosted licenses.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Start with the AppSumo LTD if you want the best early deal. Use hosted plans for recurring monitoring, or buy a self-hosted license for your own infrastructure.
          </p>
        </section>

        {licenseSuccess && (
          <div className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
            Purchase complete. Check your Stripe receipt for license and download details.
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <PricingSection
          eyebrow="Cash injection and launch proof"
          title="AppSumo Lifetime Deal"
          description="Hosted lifetime access for the first launch cohort. These buyers do not receive source-code ownership."
          icon={Infinity}
          offers={appsumoOffers}
          loadingPlan={loadingPlan}
          checkout={checkout}
        />

        <PricingSection
          eyebrow="Recurring revenue"
          title="Hosted SaaS"
          description="Monthly plans for customers who want Afrikintel operated for them."
          icon={ShieldCheck}
          offers={hostedOffers}
          loadingPlan={loadingPlan}
          checkout={checkout}
        />

        <PricingSection
          eyebrow="Passive secondary channel"
          title="Self-hosted Licenses"
          description="One-time licenses for teams that prefer to run Afrikintel on their own infrastructure."
          icon={Server}
          offers={licenseOffers}
          loadingPlan={loadingPlan}
          checkout={checkout}
        />

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">6-month decision gate</h2>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
            <DecisionCard title="$3K+ MRR" body="Keep building toward $10K MRR and a higher acquisition multiple." />
            <DecisionCard title="$1K-$3K MRR" body="Continue only if support load is manageable and acquisition is repeatable." />
            <DecisionCard title="< $1K MRR" body="Package AppSumo revenue, reviews, users, and MRR for Acquire.com." />
          </div>
        </section>
      </div>
      <MarketingFooter />
    </main>
  )
}

function PricingSection({
  eyebrow,
  title,
  description,
  icon: Icon,
  offers,
  loadingPlan,
  checkout,
}: {
  eyebrow: string
  title: string
  description: string
  icon: typeof Sparkles
  offers: PricingOffer[]
  loadingPlan: string | null
  checkout: (plan: string) => void
}) {
  return (
    <section>
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">{eyebrow}</p>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className={cn('grid gap-4', offers.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3')}>
        {offers.map((offer) => (
          <article
            key={offer.id}
            className={cn(
              'flex min-h-[360px] flex-col rounded-lg border bg-card p-6 shadow-sm',
              offer.highlighted && 'border-primary shadow-[0_0_40px_oklch(0.7_0.18_165/0.15)]',
            )}
          >
            <div>
              {offer.tag && (
                <div className="mb-3 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                  {offer.tag}
                </div>
              )}
              <h3 className="text-xl font-semibold">{offer.name}</h3>
              <p className="mt-2 min-h-12 text-sm text-muted-foreground">{offer.description}</p>
              <div className="mt-6 flex items-end gap-1">
                <span className="text-4xl font-semibold">{offer.price}</span>
                <span className="pb-1 text-sm text-muted-foreground">{offer.period}</span>
              </div>
            </div>

            <ul className="mt-8 space-y-3 text-sm">
              {offer.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => checkout(offer.id)}
              disabled={loadingPlan === offer.id}
              className={cn(
                'mt-auto flex h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors',
                offer.highlighted
                  ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border-border hover:bg-muted',
              )}
            >
              {loadingPlan === offer.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : offer.id.startsWith('self_hosted') ? (
                <Download className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {offer.cta}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

function DecisionCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-border bg-background/60 p-4">
      <div className="font-medium text-foreground">{title}</div>
      <p className="mt-1">{body}</p>
    </div>
  )
}

function subscribeHydratedSearch(onStoreChange: () => void) {
  const id = window.setTimeout(onStoreChange, 0)
  return () => window.clearTimeout(id)
}

function useHydratedSearch() {
  return useSyncExternalStore(
    subscribeHydratedSearch,
    () => window.location.search,
    () => '',
  )
}
