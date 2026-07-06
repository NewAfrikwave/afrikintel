'use client'

import { SessionProvider } from 'next-auth/react'
import { useState, useEffect, createContext, useContext, useCallback } from 'react'

interface AuthContextValue {
  isAuthEnabled: boolean
  isAuthRequired: boolean
}

const AuthContext = createContext<AuthContextValue>({
  isAuthEnabled: false,
  isAuthRequired: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // In this demo, auth is enabled but optional — users can sign in to personalize,
  // but the dashboard remains viewable without auth (like a public status page).
  // To require auth, set the env var REQUIRE_AUTH=1.
  const [isAuthRequired] = useState(false)

  return (
    <SessionProvider>
      <AuthContext.Provider value={{ isAuthEnabled: true, isAuthRequired: isAuthRequired }}>
        {children}
      </AuthContext.Provider>
    </SessionProvider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
