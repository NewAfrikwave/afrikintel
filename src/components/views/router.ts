'use client'

import { useAppStore } from '@/lib/store'
import type { ViewKey } from '@/lib/types'

export function useRouterView() {
  return useAppStore((s) => s.setActiveView)
}

export function useView(): ViewKey {
  return useAppStore((s) => s.activeView)
}
