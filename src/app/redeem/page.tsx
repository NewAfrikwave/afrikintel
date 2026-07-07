import Link from 'next/link'
import { CheckCircle2, Copy, LifeBuoy, Mail, PackageCheck, ShieldCheck } from 'lucide-react'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

const redemptionSteps = [
  {
    title: 'Buy and copy your AppSumo code',
    body: 'After checkout, copy the AppSumo code from your AppSumo account. Buy multiple codes if you want the stacked instance limits.',
  },
  {
    title: 'Email your code to support',
    body: 'Send your AppSumo code, purchase email, and preferred delivery email to support@afrikintel.com with the subject "Afrikintel AppSumo redemption".',
  },
  {
    title: 'Receive the self-hosted package',
    body: 'We will validate the code and send the project package, install guide, and license record for your code count.',
  },
]

const stackRules = [
  '1 code unlocks 1 production instance.',
  '2 codes unlock up to 5 production instances.',
  '3 codes unlock up to 10 production instances.',
  '4 codes unlock up to 15 production instances.',
  '5 codes unlock up to 25 production instances.',
]

export default function RedeemPage() {
  const emailHref =
    'mailto:support@afrikintel.com?subject=Afrikintel%20AppSumo%20redemption&body=AppSumo%20code%3A%0APurchase%20email%3A%0APreferred%20delivery%20email%3A'

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 lg:py-16">
        <nav className="flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2 text-sm font-semibold">
            <img src="/logo.svg" alt="Afrikintel" className="h-8 w-8" />
            Afrikintel
          </Link>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/demo" className="hover:text-foreground">
              Demo
            </Link>
            <Link href="/docs/install" className="hover:text-foreground">
              Install guide
            </Link>
          </div>
        </nav>

        <section className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <PackageCheck className="h-3.5 w-3.5" />
            AppSumo code redemption
          </div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Redeem your Afrikintel AppSumo code.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Afrikintel is delivered as a self-hosted project/license package. The Railway deployment is a live demo for review; production buyers run their own instance.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={emailHref}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Mail className="h-4 w-4" />
              Email redemption code
            </a>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <ShieldCheck className="h-4 w-4" />
              Open live demo
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {redemptionSteps.map((step, index) => (
            <article key={step.title} className="rounded-lg border border-border bg-card p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <h2 className="mt-4 text-base font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <article className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Copy className="h-4 w-4" />
              What to include in your email
            </div>
            <div className="mt-5 rounded-md border border-border bg-background/70 p-4 text-sm text-muted-foreground">
              <div>AppSumo code:</div>
              <div>Purchase email:</div>
              <div>Preferred delivery email:</div>
              <div>Company or project name:</div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Code validation and package delivery are handled manually so buyers do not need to create a separate hosted SaaS account before receiving the self-hosted package.
            </p>
          </article>

          <article className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Code stacking
            </div>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              {stackRules.map((rule) => (
                <li key={rule} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="rounded-lg border border-primary/30 bg-primary/10 p-5 text-sm text-primary">
          <div className="flex items-start gap-3">
            <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Support covers license delivery, installation blockers, configuration guidance, and reproducible product bugs. Buyers are responsible for hosting, backups, server security, SMTP deliverability, DNS, and uptime of their own deployment.
            </p>
          </div>
        </section>
      </div>
      <MarketingFooter />
    </main>
  )
}
