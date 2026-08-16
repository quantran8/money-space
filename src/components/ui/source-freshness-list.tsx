import * as React from 'react'

import { Sunk } from '@/components/ui/panel'
import { cn } from '@/shared/lib/utils'

/**
 * SourceFreshnessList (§11.5, §2.15).
 *
 * The money sources a figure is computed FROM, named one per line, oldest
 * first. This is the second thing a household reads on Home (§1.1): the hero,
 * the low point and the state are all outputs of the same inputs, so if an
 * input is old all three are old and nothing else on the page would say so.
 *
 * It replaces the v4.0 segment strip. The strip could say *how many* sources
 * needed a look but never *which* — so the household had to leave the page to
 * find out, and the block that was meant to qualify the number instead just
 * unsettled it. Naming the sources makes it act on the spot, which is also what
 * lets the action live here at BLOCK level: "Cập nhật nhanh" plainly means these
 * sources, not everything in the app.
 *
 * It renders even when everything is fresh: this is CONTEXT for the number
 * above it, not a warning (§25). It never shows a confidence percentage — that
 * would be a made-up number (§2.15).
 */
export type SourceFreshnessRow = {
  id: string
  name: string
  /** What this source contributes to the figure above. Omit to show only the age. */
  value?: number
  /** Days since the value was last confirmed. `null` = never. */
  days: number | null
  /** Past the household's OWN update frequency, not a fixed number of days. */
  isStale: boolean
}

export function SourceFreshnessList({
  rows,
  summary,
  action,
  footnote,
  overflow,
  formatAge,
  formatValue,
  className,
}: {
  rows: SourceFreshnessRow[]
  /** "4 nguồn tiền mặt · cũ nhất 35 ngày" — the block declares its own scope. */
  summary: React.ReactNode
  action?: React.ReactNode
  /** What this figure deliberately leaves out. */
  footnote?: React.ReactNode
  /** Link to the page that owns the full list, when there are more sources. */
  overflow?: React.ReactNode
  formatAge: (days: number | null) => string
  /** Required for `row.value` to render — money formatting is the caller's (§10.4). */
  formatValue?: (value: number) => string
  className?: string
}) {
  return (
    <Sunk className={cn('mt-6 p-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="label">{summary}</p>
        {action ? <span className="shrink-0">{action}</span> : null}
      </div>

      <ul className="mt-3.5 space-y-2.5">
        {rows.map((row) => (
          <li
            key={row.id}
            className={cn(
              'flex items-center justify-between gap-3 text-[13px]',
              !row.isStale && 'text-ink2',
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              {/* Always rendered, so every name starts on the same optical line
                  and the dot reads as a mark rather than as an indent. */}
              <span
                className={cn(
                  'h-1.5 w-1.5 shrink-0 rounded-full',
                  row.isStale ? 'bg-attention' : 'bg-transparent',
                )}
              />
              <span className="truncate">{row.name}</span>
            </span>
            {/* Amount first, age second: what the source contributes is the
                fact, how old it is qualifies it. */}
            <span className="flex shrink-0 items-baseline gap-2">
              {row.value !== undefined && formatValue ? (
                <span className="num text-[13px] font-medium text-ink">
                  {formatValue(row.value)}
                </span>
              ) : null}
              <span
                className={cn(
                  'font-mono text-[11px]',
                  row.isStale ? 'text-attention' : 'text-ink3',
                )}
              >
                {formatAge(row.days)}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {overflow ? <div className="mt-3">{overflow}</div> : null}

      {footnote ? <p className="mt-3.5 text-[12px] leading-5 text-ink3">{footnote}</p> : null}
    </Sunk>
  )
}
