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
 * A panel surface: no border, no shadow, radius 14 (§2.2–2.3). The `inverted`
 * variant no longer paints a dark tile — no section in v4.0 uses a dark ground
 * (§4.3, §19) — so the headline total is distinguished by an accent value on
 * the same panel instead.
 */
export function SummaryTile({ label, value, dotColor, inverted, className }: SummaryTileProps) {
  return (
    <div className={cn('rounded-panel bg-panel p-5', className)}>
      <div className="flex items-center gap-2">
        {dotColor ? (
          <span className="size-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
        ) : null}
        <p className="text-[13px] text-ink2">{label}</p>
      </div>
      <p className={cn('money-number mt-3 text-[30px]', inverted && 'text-accent')}>{value}</p>
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
