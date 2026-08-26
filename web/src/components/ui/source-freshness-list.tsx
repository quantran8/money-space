import { AnimatePresence, motion } from 'motion/react'
import * as React from 'react'

import type { SourceFreshnessRow } from '@money-space/core/shared/presentation.types'

import { easeOut } from '@/components/ui/motion'
import { Sunk } from '@/components/ui/panel'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@money-space/core/shared/lib/utils'

/**
 * SourceFreshnessList (§11.5, §2.15).
 *
 * The money sources a figure is computed FROM. This is the second thing a
 * household reads on Home (§1.1): the hero, the low point and the state are all
 * outputs of the same inputs, so if an input is old all three are old and
 * nothing else on the page would say so.
 *
 * v12 collapses the per-source rows behind one summary line — "8 nguồn · cũ
 * nhất 6 ngày trước" — and opens them as a TABLE (nguồn → cập nhật → số tiền).
 * Two things follow from that:
 *  - **Freshness gets its own column**, so ages line up down the block and the
 *    oldest source is found by scanning one column instead of comparing labels
 *    strung after each name.
 *  - **No row cap.** The list only had to be capped at 4 because it was always
 *    open and pushed §12.2 below the fold; collapsed by default, it can name
 *    every source, which is what makes the total above it verifiable rather
 *    than asserted. Nothing links away to finish the list.
 *  - **The open/close is animated.** Opening the block moves everything below
 *    it down by most of a screen, and an instant jump of that size reads as the
 *    page reloading rather than as this block growing. The height transition is
 *    what ties the new rows to the summary line they came from.
 *
 * The summary line renders even when everything is fresh: this is CONTEXT for
 * the number above it, not a warning (§25). It never shows a confidence
 * percentage — that would be a made-up number (§2.15).
 */
export type { SourceFreshnessRow } from '@money-space/core/shared/presentation.types'

export function SourceFreshnessList({
  rows,
  summary,
  action,
  footnote,
  labels,
  formatAge,
  formatValue,
  className,
}: {
  rows: SourceFreshnessRow[]
  /** "8 nguồn · cũ nhất 6 ngày trước" — the block declares its own scope. */
  summary: React.ReactNode
  action?: React.ReactNode
  /** What this figure deliberately leaves out. */
  footnote?: React.ReactNode
  /** Toggle copy and column headers — all copy is the caller's (§10.4). */
  labels: {
    show: string
    hide: string
    source: string
    updated: string
    amount: string
  }
  formatAge: (days: number | null) => string
  /** Required for `row.value` to render — money formatting is the caller's (§10.4). */
  formatValue?: (value: number) => string
  className?: string
}) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Sunk className={cn('mt-6', className)}>
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <p className="t-body-sm leading-5 text-ink2">{summary}</p>

        <span className="flex shrink-0 items-center gap-3">
          {action}
          {/* No `aria-controls`: the table is unmounted while collapsed, and
              pointing at an absent id is a dangling reference. `aria-expanded`
              already states the toggle's own state, which is what a screen
              reader needs here. */}
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            className="t-body font-medium text-action"
          >
            {isOpen ? labels.hide : labels.show}
          </button>
        </span>
      </div>

      {/* A table, not a list: the age column is what makes the oldest source
          findable at a glance, and it only lines up as a column.

          Height is animated so the rows unroll from under the summary rather
          than snapping in and shifting §12.2 down by a screenful with no
          explanation of where the jump came from. `overflow-hidden` is what
          clips them mid-transition; opacity trails slightly behind the height
          so the text is not readable while it is still moving. */}
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.24, ease: easeOut },
              opacity: { duration: 0.16, ease: easeOut },
            }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <Table className="t-body-sm">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="col" className="label-vi h-auto px-0 pb-2.5 font-normal">
                      {labels.source}
                    </TableHead>
                    <TableHead scope="col" className="label-vi h-auto px-0 pb-2.5 font-normal">
                      {labels.updated}
                    </TableHead>
                    {formatValue ? (
                      <TableHead scope="col" className="label-vi h-auto px-0 pb-2.5 text-right font-normal">
                        {labels.amount}
                      </TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.map((row) => (
                    // This table sits INSIDE a sunk block, so its hover band goes
                    // lighter (`--panel`) rather than the darker `--sunk` a table
                    // on a panel uses — same band, one surface up.
                    <TableRow key={row.id} className="hover:bg-card">
                      {/* A row header, not a column header: `TableHead` carries
                          `.label`, whose mono face must never touch the accented
                          Vietnamese of a source name (§10.1). The primitive has
                          no row-header cell, so this stays a plain `th`. */}
                      <th
                        scope="row"
                        className="rounded-l-[8px] py-2.5 pr-4 text-left align-middle font-medium"
                      >
                        {row.name}
                      </th>
                      <TableCell
                        className={cn(
                          'px-0 py-2.5 pr-4 font-mono t-caption-sm',
                          row.isStale ? 'font-medium text-attention' : 'text-ink2',
                          // Only the last cell of a row carries the right radius.
                          !formatValue && 'rounded-r-[8px] text-right',
                        )}
                      >
                        {formatAge(row.days)}
                      </TableCell>
                      {formatValue ? (
                        <TableCell className="num rounded-r-[8px] px-0 py-2.5 text-right text-ink2">
                          {row.value !== undefined ? formatValue(row.value) : null}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {footnote ? (
                <p className="mt-3.5 t-caption leading-5 text-ink3">{footnote}</p>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Sunk>
  )
}
