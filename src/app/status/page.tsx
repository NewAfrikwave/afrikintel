import Link from 'next/link'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { StatusPageView } from '@/components/views/StatusPageView'

export default function PublicStatusPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/landing" className="flex items-center gap-2 text-sm font-semibold">
          <img src="/logo.svg" alt="Afrikintel" className="h-8 w-8" />
          Afrikintel
        </Link>
        <Link href="/demo" className="text-sm text-muted-foreground hover:text-foreground">
          Demo
        </Link>
      </div>
      <StatusPageView />
      <MarketingFooter />
    </main>
  )
}
