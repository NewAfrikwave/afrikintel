import Link from 'next/link'

const navLinks: Array<{ label: string; href: string; external?: boolean }> = [
  { label: 'Features', href: '/landing#features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'AppSumo', href: '/appsumo' },
  { label: 'Demo', href: '/demo' },
  { label: 'Docs', href: '/docs' },
  { label: 'Status', href: '/status' },
  { label: 'Support', href: 'mailto:support@afrikintel.com' },
  { label: 'Refund policy', href: '/refund-policy' },
]

export function MarketingFooter() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <Link href="/landing" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Afrikintel" className="h-7 w-7" />
          <span className="text-sm font-semibold text-foreground">Afrikintel</span>
          <span className="text-xs text-muted-foreground">Copyright 2026 Afrikintel. Commercial licenses available.</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className="hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
