import Link from 'next/link'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

const sections = [
  {
    title: 'AppSumo self-hosted licenses',
    body: 'AppSumo purchases follow AppSumo platform refund terms, including the 30-day money-back guarantee when offered through AppSumo. Refund requests for AppSumo purchases should be started from the buyer account on AppSumo.',
  },
  {
    title: 'Direct Stripe licenses',
    body: 'Direct self-hosted license purchases are digital goods. If delivery fails, a duplicate charge occurs, or the license package cannot be accessed, contact support within 14 days and include the Stripe receipt email.',
  },
  {
    title: 'Demo server',
    body: 'The hosted Afrikintel server is provided for review and demonstration only. Buyers are responsible for operating their own production deployment after purchase.',
  },
]

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:py-16">
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
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Refund policy</h1>
          <p className="mt-4 text-muted-foreground">
            Afrikintel is sold as a self-hosted project/license package through AppSumo and optional direct Stripe checkout. Refund handling depends on where the purchase was made.
          </p>
        </section>

        <section className="space-y-4">
          {sections.map((section) => (
            <article key={section.title} className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-primary/30 bg-primary/10 p-5 text-sm">
          Need help with a purchase? Email{' '}
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
