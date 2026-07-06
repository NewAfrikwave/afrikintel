'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ============================================================
// Loading skeleton — shimmer effect
// ============================================================
export function LoadingSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-lg bg-card border border-border shimmer"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )
}

// Card skeleton for dashboards
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-40 rounded-lg bg-card border border-border shimmer" />
      ))}
    </div>
  )
}

// KPI skeleton
export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-32 rounded-lg bg-card border border-border shimmer" />
      ))}
    </div>
  )
}

// ============================================================
// Error state with retry
// ============================================================
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6 text-red-400" />
      </div>
      <div className="text-sm font-medium text-foreground">{title}</div>
      {message && (
        <div className="text-xs text-muted-foreground mt-1 max-w-sm">{message}</div>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 h-8 px-3 rounded-md border border-border hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Try again
        </button>
      )}
    </motion.div>
  )
}

// ============================================================
// Empty state
// ============================================================
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  actionLabel,
  className,
}: {
  icon?: typeof Inbox
  title: string
  description?: string
  action?: () => void
  actionLabel?: string
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center bg-card border border-border rounded-lg',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">{title}</div>
      {description && (
        <div className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</div>
      )}
      {action && actionLabel && (
        <button
          onClick={action}
          className="mt-4 h-8 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  )
}

// ============================================================
// Loading spinner
// ============================================================
export function LoadingSpinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sz = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'
  return <Loader2 className={cn(sz, 'animate-spin text-muted-foreground', className)} />
}

// ============================================================
// Inline loading state for buttons
// ============================================================
export function ButtonLoading({ label = 'Loading...' }: { label?: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Loader2 className="w-3 h-3 animate-spin" />
      {label}
    </span>
  )
}
