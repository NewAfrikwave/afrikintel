import Link from 'next/link'
import { CheckCircle2, Database, KeyRound, Server, TerminalSquare } from 'lucide-react'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

const steps = [
  {
    title: 'Prepare the server',
    body: 'Use a VPS, Railway project, or Docker host with Node/Bun support, PostgreSQL, outbound email access, and a public domain if you want status pages.',
  },
  {
    title: 'Configure environment variables',
    body: 'Set DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, SMTP settings if you want alerts, and Stripe keys only if you plan to sell direct licenses from your own deployment.',
  },
  {
    title: 'Start the app and worker',
    body: 'Use the Dockerfile for a single-service launch. The included start flow runs the Next.js app and the monitor worker together for the first deployment.',
  },
  {
    title: 'Seed the reviewer demo',
    body: 'Run bun run seed:demo once if you want demo@afrikintel.com / demo1234 available for reviewers or internal buyers.',
  },
  {
    title: 'Verify the monitoring flow',
    body: 'Create a monitor, wait for checks, confirm incidents and notifications, then review the status page and postmortem output.',
  },
]

const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'CHECK_REGIONS',
]

const optionalVars = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'GITHUB_ID',
  'GITHUB_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_SELF_HOSTED_PERSONAL_PRICE_ID',
  'STRIPE_SELF_HOSTED_TEAM_PRICE_ID',
]

export default function InstallDocsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 lg:py-16">
        <nav className="flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2 text-sm font-semibold">
            <img src="/logo.svg" alt="Afrikintel" className="h-8 w-8" />
            Afrikintel
          </Link>
          <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
            Docs
          </Link>
        </nav>

        <section className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <TerminalSquare className="h-3.5 w-3.5" />
            Install guide
          </div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Deploy Afrikintel as a self-hosted monitoring project.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            This guide is written for AppSumo and direct-license buyers. The hosted Afrikintel deployment is a demo; production buyers run their own instance.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard icon={Server} title="Runtime" body="Docker or a Bun-capable server running the app and monitor worker." />
          <InfoCard icon={Database} title="Database" body="PostgreSQL is recommended for production. SQLite is development-only." />
          <InfoCard icon={KeyRound} title="Secrets" body="Use unique auth, SMTP, and optional Stripe credentials for each production install." />
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Setup steps</h2>
          <ol className="mt-5 space-y-5">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </span>
                <div>
                  <div className="font-medium">{step.title}</div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <EnvList title="Required variables" names={requiredVars} />
          <EnvList title="Optional variables" names={optionalVars} />
        </section>

        <section className="rounded-lg border border-primary/30 bg-primary/10 p-5 text-sm text-primary">
          Buyers are responsible for their own hosting, backups, DNS, SMTP deliverability, and uptime. Afrikintel support covers license delivery, setup blockers, and reproducible product bugs.
        </section>
      </div>
      <MarketingFooter />
    </main>
  )
}

function InfoCard({ icon: Icon, title, body }: { icon: typeof Server; title: string; body: string }) {
  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="mt-4 text-sm font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </article>
  )
}

function EnvList({ title, names }: { title: string; names: string[] }) {
  return (
    <article className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <CheckCircle2 className="h-4 w-4" />
        {title}
      </div>
      <div className="mt-5 grid gap-2">
        {names.map((name) => (
          <code key={name} className="rounded-md border border-border bg-background/70 px-2.5 py-2 text-xs text-muted-foreground">
            {name}
          </code>
        ))}
      </div>
    </article>
  )
}
