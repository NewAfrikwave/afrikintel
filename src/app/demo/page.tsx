'use client'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function DemoLoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    signIn('credentials', {
      email: 'demo@afrikintel.com',
      password: 'demo1234',
      redirect: false,
    })
      .then((res) => {
        if (res?.ok) router.push('/dashboard?demo=1')
        else setError('Demo account is not seeded yet. Run bun run seed:demo, then try again.')
      })
      .catch(() => setError('Unable to start the demo session.'))
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 text-center shadow-sm">
        <img src="/logo.svg" alt="Afrikintel" className="mx-auto mb-4 h-10 w-10" />
        <h1 className="text-xl font-semibold">Opening the Afrikintel demo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Signing in as demo@afrikintel.com with a read-only reviewer account.
        </p>
        {error ? (
          <Link href="/dashboard" className="mt-5 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
            View public dashboard
          </Link>
        ) : (
          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing session
          </div>
        )}
      </div>
    </main>
  )
}
