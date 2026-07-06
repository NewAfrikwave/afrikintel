'use client'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { X, AlertTriangle, CheckCircle2, AlertCircle, Bell } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

export function LiveToasts() {
  const toasts = useAppStore((s) => s.liveToasts)
  const dismiss = useAppStore((s) => s.dismissLiveToast)
  const setActiveView = useAppStore((s) => s.setActiveView)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const icon =
            t.severity === 'down' ? (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            ) : t.severity === 'degraded' ? (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            ) : t.severity === 'resolved' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Bell className="w-4 h-4 text-sky-400" />
            )

          const accent =
            t.severity === 'down'
              ? 'border-l-red-500'
              : t.severity === 'degraded'
                ? 'border-l-amber-500'
                : t.severity === 'resolved'
                  ? 'border-l-emerald-500'
                  : 'border-l-sky-500'

          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className={cn(
                'pointer-events-auto bg-card border border-border border-l-4 rounded-md shadow-xl backdrop-blur-sm',
                'flex items-start gap-3 p-3 cursor-pointer hover:bg-accent/30 transition-colors',
                accent,
              )}
              onClick={() => {
                setActiveView('incidents')
                dismiss(t.id)
              }}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground">{t.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{t.description}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  dismiss(t.id)
                }}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
