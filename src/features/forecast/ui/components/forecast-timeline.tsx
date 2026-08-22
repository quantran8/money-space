import { Check, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  ForecastDay,
  ForecastOccurrence,
} from '@/features/forecast/model/forecast.types'
import {
  BALANCE_TONE_CLASS,
  balanceTone,
  canProjectBalance,
  occurrenceMarkers,
  runningBalancesForDay,
} from '@/features/forecast/model/forecast-presentation'
import { formatVndCell, formatVndCellSigned } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type ForecastTimelineProps = {
  days: ForecastDay[]
  ownerNameByEventId?: Record<string, string | undefined>
  isLoading?: boolean
  isEmpty?: boolean
  /** Gates the running-balance column — see `canProjectBalance`. */
  usableNowAssetCount?: number
  /** Opens the create dialog from the empty state. */
  onAdd?: () => void
  /** Row actions. Keyed by `sourceEventId` — occurrences are not rows (§18). */
  onComplete?: (sourceEventId: string, occurrenceDate: string) => void
  onEdit?: (sourceEventId: string) => void
  onDelete?: (sourceEventId: string) => void
}

type TimelineRow = {
  occurrence: ForecastOccurrence
  runningBalance?: number
}

type MonthGroup = {
  key: string
  rows: TimelineRow[]
}

/** Matches the money-events history table so both lists page identically. */
const PAGE_SIZE = 10

/**
 * Split the flat timeline into month buckets, preserving order. The timeline is
 * already chronological, so the first time a month is seen fixes its position —
 * no re-sorting, which would fight the overdue-clamped ordering upstream.
 */
function groupByMonth(rows: TimelineRow[]): MonthGroup[] {
  const groups: MonthGroup[] = []
  const indexByKey = new Map<string, number>()
  for (const row of rows) {
    // Group by the date the money actually moves — the same date the running
    // balance uses — so an overdue item counted today sits under today's month.
    const key = row.occurrence.date.slice(0, 7)
    const at = indexByKey.get(key)
    if (at === undefined) {
      indexByKey.set(key, groups.length)
      groups.push({ key, rows: [row] })
    } else {
      groups[at].rows.push(row)
    }
  }
  return groups
}

export function ForecastTimeline({
  days,
  ownerNameByEventId = {},
  isLoading = false,
  isEmpty = false,
  usableNowAssetCount,
  onAdd,
  onComplete,
  onEdit,
  onDelete,
}: ForecastTimelineProps) {
  const { t } = useTranslation()
  const hasLiquidSource = canProjectBalance(usableNowAssetCount)
  const rows = useMemo(
    () => flattenTimeline(days, hasLiquidSource),
    [days, hasLiquidSource],
  )
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  // Clamp rather than reset: shrinking the horizon (60 → 7 ngày) can drop the
  // page count below the current page, and a stale `page` would render empty.
  const safePage = Math.min(page, totalPages)
  const visibleRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const groups = useMemo(() => groupByMonth(visibleRows), [visibleRows])
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (value) => totalPages <= 5 || value === 1 || value === totalPages || Math.abs(value - safePage) <= 1,
  )
  const firstVisible = rows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const lastVisible = Math.min(safePage * PAGE_SIZE, rows.length)

  if (isLoading) {
    return (
      <Panel>
        <PanelHeader title={t('upcoming.timeline.title')} />
        <div className="mt-7 space-y-2">
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-12 w-full rounded-control" />
          ))}
        </div>
      </Panel>
    )
  }

  if (isEmpty) {
    return (
      <Panel>
        <PanelHeader
          title={t('upcoming.timeline.title')}
          meta={t('upcoming.timeline.count', { count: 0 })}
        />
        <div className="flex flex-col items-center gap-4 py-10">
          <p className="text-center text-[13px] text-ink2">
            {t('upcoming.timeline.empty')}
          </p>
          {onAdd ? (
            <Button size="sm" onClick={onAdd}>
              <Plus className="size-4" />
              {t('upcoming.form.title')}
            </Button>
          ) : null}
        </div>
      </Panel>
    )
  }

  return (
    <Panel>
      <PanelHeader
        title={t('upcoming.timeline.title')}
        meta={t('upcoming.timeline.count', { count: rows.length })}
      />

      {/* A real table from `lg` up, where the five columns fit: the header row
          then labels the columns once instead of every row restating them.
          Below `lg` the same data stacks (see `OccurrenceRow`) rather than
          scrolling sideways — `Còn lại` is the column this screen exists for,
          and a horizontal scroll is exactly what hides it on a phone. */}
      <div className="mt-7">
        <table className="w-full lg:table-fixed">
          <thead className="hidden lg:table-header-group">
            <tr className="label-vi">
              <th scope="col" className="w-[84px] pb-3 text-left font-normal">
                {t('upcoming.timeline.columns.date')}
              </th>
              <th scope="col" className="pb-3 pr-8 text-left font-normal">
                {t('upcoming.timeline.columns.item')}
              </th>
              <th scope="col" className="w-[116px] pb-3 pr-8 text-left font-normal">
                {t('upcoming.timeline.columns.owner')}
              </th>
              <th scope="col" className="w-[128px] pb-3 pr-8 text-right font-normal">
                {t('upcoming.timeline.columns.amount')}
              </th>
              <th scope="col" className="w-[128px] pb-3 pr-5 text-right font-normal">
                {t('upcoming.timeline.columns.remaining')}
              </th>
              <th scope="col" className="w-[32px] pb-3">
                <span className="sr-only">{t('upcoming.rowActions.label')}</span>
              </th>
            </tr>
          </thead>

          {groups.map((group) => {
            const [year, month] = group.key.split('-')
            return (
              <tbody key={group.key} className="block lg:table-row-group">
                <tr className="block lg:table-row">
                  <th
                    scope="colgroup"
                    colSpan={6}
                    className="label block px-3 pb-2 pt-5 text-left font-normal lg:table-cell"
                  >
                    {t('upcoming.timeline.monthGroup', {
                      month: Number(month),
                      year,
                    })}
                  </th>
                </tr>
                {group.rows.map(({ occurrence, runningBalance }) => (
                  <OccurrenceRow
                    key={occurrence.occurrenceKey}
                    occurrence={occurrence}
                    runningBalance={runningBalance}
                    ownerName={ownerNameByEventId[occurrence.sourceEventId]}
                    onComplete={onComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </tbody>
            )
          })}
        </table>
      </div>

      {rows.length > PAGE_SIZE ? (
        <div className="sunk mt-6 flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-ink2">
            {t('upcoming.timeline.showing', {
              from: firstVisible,
              to: lastVisible,
              total: rows.length,
            })}
          </p>
          <nav className="flex items-center gap-1" aria-label={t('upcoming.timeline.pagination')}>
            <button
              type="button"
              disabled={safePage === 1}
              className="flex h-9 items-center gap-1 rounded-control px-3 text-[12px] text-ink3 hover:bg-panel disabled:opacity-40"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft className="size-4" strokeWidth={1.75} />
              {t('upcoming.timeline.previous')}
            </button>
            {pageNumbers.map((pageNumber, index) => {
              const previous = pageNumbers[index - 1]
              return (
                <span key={pageNumber} className="contents">
                  {previous && pageNumber - previous > 1 ? (
                    <span className="grid size-9 place-items-center text-[12px] text-ink3">…</span>
                  ) : null}
                  <button
                    type="button"
                    aria-current={safePage === pageNumber ? 'page' : undefined}
                    className={cn(
                      'grid size-9 place-items-center rounded-control text-[12px]',
                      safePage === pageNumber
                        ? 'bg-panel font-medium text-ink'
                        : 'text-ink2 hover:bg-panel',
                    )}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                </span>
              )
            })}
            <button
              type="button"
              disabled={safePage === totalPages}
              className="flex h-9 items-center gap-1 rounded-control px-3 text-[12px] font-medium text-accent hover:bg-panel disabled:opacity-40"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              {t('upcoming.timeline.next')}
              <ChevronRight className="size-4" strokeWidth={1.75} />
            </button>
          </nav>
        </div>
      ) : null}
    </Panel>
  )
}

function OccurrenceRow({
  occurrence,
  runningBalance,
  ownerName,
  onComplete,
  onEdit,
  onDelete,
}: {
  occurrence: ForecastOccurrence
  runningBalance?: number
  ownerName?: string
  onComplete?: (sourceEventId: string, occurrenceDate: string) => void
  onEdit?: (sourceEventId: string) => void
  onDelete?: (sourceEventId: string) => void
}) {
  const { t } = useTranslation()
  const isIncoming = occurrence.direction === 'incoming'
  const tone = balanceTone(runningBalance ?? 0)
  const markers = occurrenceMarkers(occurrence).filter(
    (marker) => marker !== 'confirmed' && marker !== 'required',
  )

  return (
    <tr className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 rounded-control px-3 py-3 transition-colors hover:bg-sunk lg:table-row lg:px-0 lg:py-0">
      <td className="col-start-1 row-start-1 font-mono text-[12px] text-ink3 lg:rounded-l-[8px] lg:py-3 lg:pl-3 lg:align-middle">
        {/* An overdue occurrence is pulled onto today so it still weighs on
            today's cash, but the date column states when the event happens —
            so it shows the real one. The clamp stays in `occurrence.date`,
            which is what the running balance and day grouping use, and the
            `overdue` marker is what tells the user it is being counted now. */}
        {formatDayMonth(occurrence.originalDate ?? occurrence.date)}
      </td>

      <td className="col-start-1 row-start-2 mt-1 min-w-0 lg:mt-0 lg:py-3 lg:pr-8 lg:align-middle">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="truncate text-[13px] font-medium lg:text-[14px]">
            {occurrence.name}
          </span>
          {/* A filled chip, not bare text: a marker is a state the row is IN,
              and at 10px unfilled it read as an afterthought trailing the name
              rather than as something qualifying it. */}
          {markers.map((marker) => (
            <span
              key={marker}
              className="inline-flex shrink-0 items-center rounded-[6px] bg-attention-tint px-2 py-1 text-[10px] font-medium text-attention"
            >
              {t(`upcoming.markers.${marker}`)}
            </span>
          ))}
        </div>
      </td>

      <td className="col-start-1 row-start-3 mt-2 text-[12px] text-ink2 lg:mt-0 lg:py-3 lg:pr-8 lg:align-middle lg:text-[13px]">
        {ownerName ?? t('upcoming.timeline.householdOwner')}
      </td>

      <td
        className={cn(
          'num col-start-2 row-start-2 mt-1 text-right text-[14px] font-medium lg:mt-0 lg:py-3 lg:pr-8 lg:align-middle',
          isIncoming && 'text-accent',
        )}
      >
        {formatVndCellSigned(isIncoming ? occurrence.amount : -occurrence.amount)}
      </td>

      <td
        className={cn(
          'num col-start-2 row-start-3 mt-2 text-right text-[12px] text-ink2 lg:mt-0 lg:py-3 lg:pr-5 lg:align-middle lg:text-[14px]',
          runningBalance !== undefined && BALANCE_TONE_CLASS[tone],
        )}
      >
        {runningBalance === undefined ? '—' : formatVndCell(runningBalance)}
      </td>

      <td className="col-start-2 row-start-1 justify-self-end lg:rounded-r-[8px] lg:py-3 lg:pr-3 lg:text-right lg:align-middle">
        {onComplete || onEdit || onDelete ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t('upcoming.rowActions.label')}
              className="flex size-8 items-center justify-center rounded-full text-ink3 outline-none transition hover:bg-panel hover:text-ink lg:ml-auto"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onComplete ? (
                <DropdownMenuItem
                  onClick={() => onComplete(occurrence.sourceEventId, occurrence.date)}
                >
                  <Check className="mr-2 size-4" />
                  {t('upcoming.rowActions.complete')}
                </DropdownMenuItem>
              ) : null}
              {onEdit ? (
                <DropdownMenuItem onClick={() => onEdit(occurrence.sourceEventId)}>
                  <Pencil className="mr-2 size-4" />
                  {t('upcoming.rowActions.edit')}
                </DropdownMenuItem>
              ) : null}
              {onDelete ? (
                <DropdownMenuItem
                  className="text-alert focus:text-alert"
                  onClick={() => onDelete(occurrence.sourceEventId)}
                >
                  <Trash2 className="mr-2 size-4" />
                  {t('upcoming.rowActions.delete')}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </td>
    </tr>
  )
}

function flattenTimeline(
  days: ForecastDay[],
  hasLiquidSource: boolean,
): TimelineRow[] {
  return days.flatMap((day) => {
    const balances = runningBalancesForDay(day)
    return day.occurrences.map((occurrence) => ({
      occurrence,
      // Two reasons a row claims no resulting balance, and they mean the same
      // thing to the reader: this number cannot be stated. One is per-row (the
      // amount is displayed but excluded from the balance); the other is
      // household-wide (there is no wallet for a balance to be OF).
      runningBalance:
        occurrence.countedInBalance && hasLiquidSource
          ? balances.get(occurrence.occurrenceKey)
          : undefined,
    }))
  })
}

/** "24/08" — mono-safe ASCII, per design.md §10.1. */
function formatDayMonth(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}` : isoDate
}
