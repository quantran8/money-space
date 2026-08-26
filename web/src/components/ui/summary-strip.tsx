import type { ReactNode } from 'react'

import { cn } from '@money-space/core/shared/lib/utils'

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
 * One tile in a DETAIL-page summary strip (v5 02-components §3).
 *
 * A card surface: no border, no shadow, radius 22. Valid on a detail page where
 * each tile answers a different question — but NOT on Home: v5 04-recipes §16
 * rules out atomising Home into Total / Committed / Flexible when Flexible
 * Money is already the canonical answer.
 *
 * `inverted` marks the headline total by WEIGHT, never by the action colour —
 * a static metric never wears it (§4).
 */
export function SummaryTile({ label, value, dotColor, inverted, className }: SummaryTileProps) {
  return (
    <div className={cn('card-surface p-5', className)}>
      <div className="flex items-center gap-2">
        {dotColor ? (
          <span className="size-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
        ) : null}
        <p className="t-body-sm text-ink2">{label}</p>
      </div>
      <p className={cn('money-number mt-2 t-metric', inverted && 'font-normal text-ink')}>{value}</p>
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
