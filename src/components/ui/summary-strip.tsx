import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

type SummaryTileProps = {
  /** Short metric label, e.g. "Dùng ngay". */
  label: string
  /** The value, rendered with money-number tracking. */
  value: ReactNode
  /** Optional colored status dot (chart palette hue) shown before the label. */
  dotColor?: string
  /** Render as the dark, inverted "total" tile. */
  inverted?: boolean
  className?: string
}

/**
 * One tile in a detail-page summary strip (design.md §14, §2.6).
 *
 * Holds label + a large money number, with an optional palette dot or an
 * inverted dark treatment for the headline total. Tiles sit directly on the
 * page background — they are the strip itself, not nested inside a section card.
 */
export function SummaryTile({ label, value, dotColor, inverted, className }: SummaryTileProps) {
  return (
    <div
      className={cn(
        'rounded-[28px] border p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)]',
        inverted
          ? 'border-transparent bg-[hsl(var(--foreground))] text-white'
          : 'border-border bg-card',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {dotColor ? (
          <span className="size-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
        ) : null}
        <p className={cn('text-sm', inverted ? 'text-white/60' : 'text-muted-foreground')}>
          {label}
        </p>
      </div>
      <p className="money-number mt-3 text-3xl font-semibold">{value}</p>
    </div>
  )
}

/**
 * The strip container: a responsive row of SummaryTiles above the toolbar
 * on a management/detail page.
 */
export function SummaryStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {children}
    </section>
  )
}
