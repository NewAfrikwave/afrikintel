'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  Download,
  ExternalLink,
  Loader2,
  PackageCheck,
  Server,
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
  action: 'appsumo' | 'stripe'
}

const appsumoOffers: PricingOffer[] = [
  {
    id: 'appsumo_tier1',
    name: 'AppSumo Tier 1',
    price: '$59',
    period: 'lifetime',
    description: 'Self-hosted license for one production instance. Buyers use the live demo to review the product before purchase.',
    features: ['1 production instance', 'Source/project access through the buyer package', 'Setup guide', '12 months of updates', 'Email support for setup blockers'],
    cta: 'View AppSumo terms',
    tag: 'Primary launch',
    highlighted: true,
    action: 'appsumo',
  },
  {
    id: 'appsumo_tier2',
    name: 'AppSumo Tier 2',
    price: '$99',
    period: 'lifetime',
    description: 'Team license for buyers running Afrikintel across internal or client environments.',
    features: ['Up to 5 production instances', 'Source/project access through the buyer package', 'Commercial use', '12 months of updates', 'Priority setup support'],
    cta: 'View AppSumo terms',
    tag: 'Best AppSumo value',
    action: 'appsumo',
  },
]

const directLicenseOffers: PricingOffer[] = [
  {
    id: 'self_hosted_personal',
    name: 'Personal License',
    price: '$99',
    period: 'one-time',
    description: 'Direct purchase for buyers who want the self-hosted project outside AppSumo.',
    features: ['1 production instance', 'Personal/commercial use', '12 months of updates', 'Install guide', 'Stripe receipt and license record'],
    cta: 'Buy Personal',
    action: 'stripe',
  },
  {
    id: 'self_hosted_team',
    name: 'Team License',
    price: '$249',
    period: 'one-time',
    description: 'Direct team license for internal teams, agencies, and client environments.',
    features: ['Up to 5 production instances', 'Commercial use', '12 months of updates', 'Email setup support', 'Portable deployment docs'],
    cta: 'Buy Team',
    highlighted: true,
    action: 'stripe',
  },
]

const proofPoints = [
  'The hosted Afrikintel server is a live demo only, not a managed monitoring service.',
  'AppSumo buyers purchase self-hosted license access, not ongoing hosted infrastructure.',
  'Direct Stripe checkout is only for self-hosted licenses sold outside AppSumo.',
  'Install docs, license terms, refund policy, and support expectations are published before submission.',
]

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const search = useHydratedSearch()
  const licenseSuccess = new URLSearchParams(search).get('license') === '1'

  async function checkout(offer: PricingOffer) {
    if (offer.action === 'appsumo') {
      window.location.href = '/appsumo'
      return
    }

    setError(null)
    setLoadingPlan(offer.id)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: offer.id }),
    })
    const data = await res.json()
    setLoadingPlan(null)

    if (!res.ok) {
      setError(data.error || 'Unable to start checkout')
      return
    }

    window.location.href = data.url
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

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AppSumo-first self-hosted launch
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              Buy Afrikintel as a self-hosted monitoring project.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              The live server is here for review and demos. Buyers get a self-hosted license/project package they can run on their own infrastructure.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Server className="h-4 w-4" />
              Demo-first proof
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Review the dashboard, monitors, incidents, status page, and postmortem flow before buying. No hosted SaaS subscription is being sold.
            </p>
            <Link
              href="/demo"
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted"
            >
              Open live demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {licenseSuccess && (
          <div className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
            Purchase complete. Check your Stripe receipt for license and delivery details.
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <PricingSection
          eyebrow="Main launch channel"
          title="AppSumo Lifetime Licenses"
          description="Use these tiers for AppSumo listing, reviews, testimonials, and validation. These are self-hosted licenses, not hosted accounts."
          icon={PackageCheck}
          offers={appsumoOffers}
          loadingPlan={loadingPlan}
          checkout={checkout}
        />

        <PricingSection
          eyebrow="Optional direct sales"
          title="Direct Self-hosted Licenses"
          description="Stripe checkout remains available only for buyers outside AppSumo who want a direct license."
          icon={Download}
          offers={directLicenseOffers}
          loadingPlan={loadingPlan}
          checkout={checkout}
        />

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">What buyers are getting</h2>
          <ul className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            {proofPoints.map((point) => (
              <li key={point} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/docs/install"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted"
            >
              Install guide
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/license-terms"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted"
            >
              License terms
              <ExternalLink className="h-4 w-4" />
            </Link>
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
  checkout: (offer: PricingOffer) => void
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
      <div className="grid gap-4 md:grid-cols-2">
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
              onClick={() => checkout(offer)}
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
              ) : offer.action === 'stripe' ? (
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
