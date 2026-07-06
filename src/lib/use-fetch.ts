'use client'

import { useEffect, useState, useCallback } from 'react'

export function useFetch<T>(url: string | null, opts?: { refreshMs?: number }) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(!url ? false : true)
  const [error, setError] = useState<string | null>(null)
  const [refetchKey, setRefetchKey] = useState(0)

  const refetch = useCallback(() => setRefetchKey((k) => k + 1), [])

  useEffect(() => {
    if (!url) return
    let cancelled = false
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<T>
      })
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setError(null)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(String(e.message || e))
          setLoading(false)
        }
      })

    if (opts?.refreshMs) {
      const t = setInterval(() => setRefetchKey((k) => k + 1), opts.refreshMs)
      return () => {
        cancelled = true
        clearInterval(t)
      }
    }
    return () => {
      cancelled = true
    }
  }, [url, opts?.refreshMs, refetchKey])

  return { data, loading, error, refetch }
}

export async function apiPost<T = unknown>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || `HTTP ${r.status}`)
  }
  return r.json() as Promise<T>
}

export async function apiPut<T = unknown>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || `HTTP ${r.status}`)
  }
  return r.json() as Promise<T>
}

export async function apiDelete<T = unknown>(url: string): Promise<T> {
  const r = await fetch(url, { method: 'DELETE' })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json() as Promise<T>
}
