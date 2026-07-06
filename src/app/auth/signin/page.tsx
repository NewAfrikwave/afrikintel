'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoginDialog } from '@/components/auth/LoginDialog'

export default function SignInPage() {
  const router = useRouter()
  const [open, setOpen] = useState(true)

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 text-center shadow-sm">
        <img src="/logo.svg" alt="Afrikintel" className="mx-auto mb-4 h-10 w-10" />
        <h1 className="text-xl font-semibold">Sign in to Afrikintel</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use credentials, GitHub OAuth, or the AppSumo demo account.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-5 h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Open sign in
        </button>
      </div>
      <LoginDialog
        open={open}
        onClose={() => {
          setOpen(false)
          router.push('/dashboard')
        }}
      />
    </main>
  )
}
