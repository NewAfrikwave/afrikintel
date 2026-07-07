import Link from 'next/link'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  KeyRound,
  MessageSquare,
  PackageCheck,
  Server,
  Sparkles,
  Star,
} from 'lucide-react'

const tiers = [
  {
    name: 'Tier 1',
    price: '$59',
    limit: '1 production instance',
    fit: 'Founders, freelancers, and small teams running one monitoring stack',
    includes: ['Self-hosted license', 'Project/source package', 'Install guide', '12 months of updates'],
  },
  {
    name: 'Tier 2',
    price: '$99',
    limit: 'Up to 5 production instances',
    fit: 'Agencies, consultants, and teams monitoring several client or internal environments',
    includes: ['Team self-hosted license', 'Project/source package', 'Commercial use', 'Priority setup support'],
  },
]

const proof = [
  'Monitor websites, TCP services, DNS, ping targets, blacklist status, server agents, and synthetic journeys',
  'Use smart alert deduplication to reduce repeated incident noise',
  'Generate AI-assisted postmortem drafts after incidents',
  'Publish public status pages and route notifications through email/webhook/SMS channels',
]

const terms = [
  'The Railway deployment is a live demo and reviewer environment only.',
  'AppSumo buyers receive self-hosted license access, not a managed hosted account.',
  'You control your own server, database, SMTP, domain, and uptime after installation.',
  'Support covers setup blockers, license delivery issues, and launch-critical bugs.',
]

export default function AppSumoPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 lg:py-16">
        <nav className="flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2 text-sm font-semibold">
            <img src="/logo.svg" alt="Afrikintel" className="h-8 w-8" />
            Afrikintel
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/demo" className="text-muted-foreground hover:text-foreground">
              Demo
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
          </div>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AppSumo self-hosted launch
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              Buy the Afrikintel project. Run it on your own server.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Afrikintel is packaged for buyers who want a self-hosted monitoring platform, not another managed SaaS account. Use the live demo to review the product, then buy the license package through AppSumo.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/demo"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Open live demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border px-5 text-sm font-medium hover:bg-muted"
              >
                View license tiers
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-5 flex items-center gap-2 text-sm font-medium text-primary">
              <Star className="h-4 w-4" />
              AppSumo listing terms
            </div>
            <div className="grid gap-3">
              {tiers.map((tier) => (
                <div key={tier.name} className="rounded-md border border-border bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{tier.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{tier.limit}</div>
                    </div>
                    <div className="text-2xl font-semibold">{tier.price}</div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{tier.fit}</p>
                  <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                    {tier.includes.map((item) => (
                      <li key={item} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <InfoCard icon={Server} title="Demo server" body="The hosted deployment exists so buyers and reviewers can inspect the product before purchase." />
          <InfoCard icon={Download} title="Self-hosted package" body="Buyers install Afrikintel on their own VPS, Railway project, or private infrastructure." />
          <InfoCard icon={KeyRound} title="License clarity" body="Tier limits are based on production instances, not managed hosted monitors." />
          <InfoCard icon={MessageSquare} title="Setup support" body="Support is focused on install blockers, delivery issues, and launch-critical bugs." />
        </section>

        <section className="grid gap-6 rounded-lg border border-border bg-card p-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Why AppSumo buyers should care</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Afrikintel gives technical buyers a working monitoring product they can own, modify, and deploy without paying monthly monitoring subscriptions.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {proof.map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <PackageCheck className="h-4 w-4" />
              What is included
            </div>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {terms.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Clock className="h-4 w-4" />
              Before submission
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Submit the live demo URL, installation guide, refund policy, license terms, and support email. Keep the scope tight: buyers are purchasing self-hosted access, not a hosted monitoring service.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/docs/install" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted">
                Install guide
              </Link>
              <Link href="/license-terms" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted">
                License terms
              </Link>
            </div>
          </article>
        </section>
      </div>
      <MarketingFooter />
    </main>
  )
}

function InfoCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Server
  title: string
  body: string
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="mt-4 text-sm font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </article>
  )
}
