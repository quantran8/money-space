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
 *
 * Sits on `--sunk`, not on panel white: it is nested inside a panel, and the
 * lightness step is the only thing separating the two now that borders and
 * shadows are gone (§2.1–2.2). The value gets negative tracking via
 * `.money-number`, which is safe because it only ever holds a number (§10.3).
 */
export function MetricCell({ label, value, hint, className }: MetricCellProps) {
  return (
    <div className={cn('rounded-sunk bg-sunk p-4', className)}>
      <p className="text-[13px] text-ink2">{label}</p>
      <p className="money-number mt-2 text-[22px]">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-ink3">{hint}</p> : null}
    </div>
  )
}
