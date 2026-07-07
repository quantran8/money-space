import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

type SubSectionProps = {
  /** Group label, e.g. "Thanh khoản" / "Tổng tài sản". */
  title: string
  /** Optional trailing element (badge, tiny hint) aligned to the label. */
  aside?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * A meaning group inside a large section (design.md §9.9, §11.1).
 *
 * Renders a soft-tinted nested block with a muted label, then the caller's
 * metric cells. This is the "sub-section" tier of Section → Sub-section →
 * Metric — the label explains the group; individual MetricCells stay terse.
 */
export function SubSection({ title, aside, children, className }: SubSectionProps) {
  return (
    <div className={cn('rounded-3xl bg-muted/50 p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}
