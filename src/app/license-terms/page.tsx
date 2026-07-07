import Link from 'next/link'
import { CheckCircle2, LifeBuoy, Scale, Server } from 'lucide-react'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

const licenseTerms = [
  'A Personal license allows one production Afrikintel instance for one buyer or company.',
  'A Team license allows up to five production instances for one company or agency.',
  'Licenses include 12 months of updates from the purchase date unless the AppSumo listing states a longer term.',
  'You may modify the project for your own internal or client use under the purchased instance limit.',
  'You may not resell, repackage, redistribute, publish, or sublicense the source/project package as a competing product or template.',
]

const supportTerms = [
  'Support covers license delivery, installation blockers, configuration guidance, and reproducible product bugs.',
  'Support does not include custom feature work, managed hosting, server administration, DNS management, or guaranteed incident response for buyer-run infrastructure.',
  'Buyers are responsible for backups, server security, SMTP deliverability, database maintenance, and uptime of their own deployment.',
]

const refundTerms = [
  'AppSumo purchases follow AppSumo refund rules and should be requested through AppSumo.',
  'Direct Stripe license purchases are digital goods. If delivery fails or a duplicate charge occurs, contact support within 14 days.',
  'Refunds are not guaranteed after source/project access has been delivered unless required by law or platform policy.',
]

export default function LicenseTermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:py-16">
        <nav className="flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2 text-sm font-semibold">
            <img src="/logo.svg" alt="Afrikintel" className="h-8 w-8" />
            Afrikintel
          </Link>
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
        </nav>

        <section>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Scale className="h-3.5 w-3.5" />
            License and support terms
          </div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Clear terms for self-hosted buyers.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Afrikintel is sold as a self-hosted project/license package. The hosted deployment is a demo environment, not a managed SaaS service.
          </p>
        </section>

        <TermsSection icon={Server} title="License use" items={licenseTerms} />
        <TermsSection icon={LifeBuoy} title="Support scope" items={supportTerms} />
        <TermsSection icon={CheckCircle2} title="Refund scope" items={refundTerms} />

        <section className="rounded-lg border border-primary/30 bg-primary/10 p-5 text-sm">
          Questions about a license? Email{' '}
          <a href="mailto:support@afrikintel.com" className="font-medium text-primary hover:underline">
            support@afrikintel.com
          </a>
          .
        </section>
      </div>
      <MarketingFooter />
    </main>
  )
}

function TermsSection({ icon: Icon, title, items }: { icon: typeof Server; title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
