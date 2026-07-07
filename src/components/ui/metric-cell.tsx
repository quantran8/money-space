import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

type MetricCellProps = {
  /** Short metric label, e.g. "Dùng ngay". */
  label: string
  /** The value, rendered with money-number tracking. */
  value: ReactNode
  /** Optional tiny hint below the value — keep it to one short line. */
  hint?: string
  className?: string
}

/**
 * A single metric inside a SubSection (design.md §9.9).
 *
 * Holds only label + value + optional tiny hint. Metric cells at the same
 * level must share this treatment — never highlight one metric on its own.
 */
export function MetricCell({ label, value, hint, className }: MetricCellProps) {
  return (
    <div className={cn('rounded-2xl bg-card p-4', className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="money-number mt-2 text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
