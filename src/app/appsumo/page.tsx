import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'

const tiers = [
  {
    name: 'Tier 1',
    price: '$59',
    limit: '50 hosted monitors',
    fit: 'Founders, freelancers, and small production stacks',
  },
  {
    name: 'Tier 2',
    price: '$99',
    limit: '200 hosted monitors',
    fit: 'Agencies and teams monitoring client or multi-service environments',
  },
]

const proof = [
  'Smart alert dedup reduces repeat incident noise',
  'AI-assisted postmortems turn timelines into usable RCA drafts',
  'Multi-region checks distinguish local failures from regional issues',
  'Public status pages and notification channels are included',
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

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AppSumo launch offer
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              Infrastructure monitoring that cuts alert noise before it reaches your team.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Afrikintel monitors websites, services, DNS, ping targets, blacklist status, server agents, and synthetic journeys with deduplication, incident correlation, anomaly detection, and AI postmortems.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                View LTD tiers
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border px-5 text-sm font-medium hover:bg-muted"
              >
                Open reviewer demo
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-5 flex items-center gap-2 text-sm font-medium text-primary">
              <Star className="h-4 w-4" />
              Launch deal terms
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
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <InfoCard icon={ShieldCheck} title="Hosted LTD" body="Lifetime hosted access. Source-code ownership is not included in AppSumo tiers." />
          <InfoCard icon={Clock} title="30-day guarantee" body="Built for AppSumo's refund window with a working reviewer demo and production deployment." />
          <InfoCard icon={MessageSquare} title="Support-ready" body="Launch support should prioritize checkout, onboarding, alerts, and reliability bugs." />
          <InfoCard icon={CheckCircle2} title="6-month gate" body="Keep building if MRR grows; package for acquisition if recurring revenue stalls." />
        </section>

        <section className="grid gap-6 rounded-lg border border-border bg-card p-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Why AppSumo buyers should care</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Most uptime tools tell you that something broke. Afrikintel is designed to reduce the number of alerts, group related failures, and help teams explain what happened after the incident.
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
      </div>
    </main>
  )
}

function InfoCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldCheck
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
