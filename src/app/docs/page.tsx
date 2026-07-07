import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Database,
  KeyRound,
  Mail,
  Server,
  TerminalSquare,
  Webhook,
} from 'lucide-react'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

const quickStart = [
  {
    title: 'Review the live demo',
    body: 'Use /demo to inspect the product before buying. The hosted server is for review, not managed customer hosting.',
    icon: Server,
  },
  {
    title: 'Connect PostgreSQL',
    body: 'Production deployments should use PostgreSQL. Railway PostgreSQL is the recommended first setup.',
    icon: Database,
  },
  {
    title: 'Configure secrets',
    body: 'Set auth, SMTP, and optional Stripe variables if you want to sell direct licenses from your own deployment.',
    icon: KeyRound,
  },
  {
    title: 'Verify the monitor flow',
    body: 'Create a monitor, let the worker run checks, confirm incidents, alerts, and the status page.',
    icon: CheckCircle2,
  },
]

const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'CHECK_REGIONS',
]

const optionalVars = [
  'GITHUB_ID',
  'GITHUB_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_SELF_HOSTED_PERSONAL_PRICE_ID',
  'STRIPE_SELF_HOSTED_TEAM_PRICE_ID',
]

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 lg:py-16">
        <nav className="flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2 text-sm font-semibold">
            <img src="/logo.svg" alt="Afrikintel" className="h-8 w-8" />
            Afrikintel
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/demo" className="text-muted-foreground hover:text-foreground">
              Demo
            </Link>
          </div>
        </nav>

        <section className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Code2 className="h-3.5 w-3.5" />
            Afrikintel docs
          </div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Deploy, configure, and launch Afrikintel.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            A practical guide for AppSumo reviewers and self-hosted license buyers. The live server proves the product; buyers run their own production instance.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/docs/install"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Install guide
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="mailto:support@afrikintel.com"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border px-5 text-sm font-medium hover:bg-muted"
            >
              Contact support
            </a>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {quickStart.map((item) => (
            <article key={item.title} className="rounded-lg border border-border bg-card p-5">
              <item.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-4 text-sm font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Server className="h-4 w-4" />
              Recommended buyer deployment
            </div>
            <ol className="mt-5 space-y-4 text-sm text-muted-foreground">
              <DocStep title="Use the live demo first" body="The reviewer flow uses /demo and signs in as demo@afrikintel.com." />
              <DocStep title="Install your own instance" body="Use the Dockerfile with PostgreSQL. The Docker start script runs the app and monitor worker for a simple first launch." />
              <DocStep title="Configure optional Stripe" body="Only create Stripe prices if you want to sell direct self-hosted licenses outside AppSumo." />
              <DocStep title="Read the license terms" body="AppSumo and direct buyers receive self-hosted license access, not managed hosted infrastructure." />
            </ol>
          </article>

          <article className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <TerminalSquare className="h-4 w-4" />
              Required environment variables
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {requiredVars.map((name) => (
                <code key={name} className="rounded-md border border-border bg-background/70 px-2.5 py-2 text-xs text-muted-foreground">
                  {name}
                </code>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary">
              <Mail className="h-4 w-4" />
              Optional launch integrations
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {optionalVars.map((name) => (
                <code key={name} className="rounded-md border border-border bg-background/70 px-2.5 py-1.5 text-xs text-muted-foreground">
                  {name}
                </code>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Webhook className="h-4 w-4" />
              Direct license endpoints
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <Endpoint method="POST" path="/api/checkout" body="Creates optional Stripe checkouts for direct self-hosted license purchases." />
              <Endpoint method="POST" path="/api/stripe/webhook" body="Records one-time direct license purchases." />
            </div>
          </article>

          <article className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Pre-launch verification
            </div>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>Open /landing, /appsumo, /pricing, /demo, /status, and /refund-policy.</li>
              <li>Open /docs/install and /license-terms.</li>
              <li>Confirm optional direct-license checkout opens after Stripe price IDs are set.</li>
              <li>Create a monitor and confirm checks appear in the dashboard.</li>
              <li>Test SMTP with a real alert channel before AppSumo submission.</li>
              <li>Scan Railway logs for Prisma, webhook, or runtime errors.</li>
            </ul>
          </article>
        </section>
      </div>
      <MarketingFooter />
    </main>
  )
}

function DocStep({ title, body }: { title: string; body: string }) {
  return (
    <li>
      <div className="font-medium text-foreground">{title}</div>
      <p className="mt-1 leading-6">{body}</p>
    </li>
  )
}

function Endpoint({ method, path, body }: { method: string; path: string; body: string }) {
  return (
    <div className="rounded-md border border-border bg-background/70 p-3">
      <div className="flex items-center gap-2">
        <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{method}</span>
        <code className="text-xs text-foreground">{path}</code>
      </div>
      <p className="mt-2 text-muted-foreground">{body}</p>
    </div>
  )
}
