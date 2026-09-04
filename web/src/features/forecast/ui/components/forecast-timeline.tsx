import { Check, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Plus, Trash2, UserRound } from 'lucide-react'
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
import {
  CATEGORY_ICON_DEFAULT_COLOR,
  CATEGORY_ICON_FALLBACK,
  CATEGORY_ICONS,
} from '@/features/events/ui/components/category-icon'
import type {
  ForecastDay,
  ForecastOccurrence,
} from '@money-space/core/features/forecast/model/forecast.types'
import {
  BALANCE_TONE_CLASS,
  balanceTone,
  canProjectBalance,
  occurrenceMarkers,
  runningBalancesForDay,
} from '@money-space/core/features/forecast/model/forecast-presentation'
import { formatVndCell, formatVndCellSigned } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

type ForecastTimelineProps = {
  days: ForecastDay[]
  ownerNameByEventId?: Record<string, string | undefined>
  categoryVisualByEventId?: Record<string, ForecastCategoryVisual | undefined>
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

export type ForecastCategoryVisual = {
  label: string
  iconKey?: string | null
  iconColor?: string | null
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
  categoryVisualByEventId = {},
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
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-center t-body-sm text-ink2">
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

      <div className="mt-5 space-y-5">
        {groups.map((group) => {
          const [year, month] = group.key.split('-')
          return (
            <section key={group.key} aria-labelledby={`forecast-month-${group.key}`}>
              <h3 id={`forecast-month-${group.key}`} className="px-3 t-caption font-medium text-ink3">
                {t('upcoming.timeline.monthGroup', { month: Number(month), year })}
              </h3>
              <div className="mt-2 space-y-1">
                {group.rows.map(({ occurrence, runningBalance }) => (
                  <OccurrenceRow
                    key={occurrence.occurrenceKey}
                    occurrence={occurrence}
                    runningBalance={runningBalance}
                    ownerName={ownerNameByEventId[occurrence.sourceEventId]}
                    categoryVisual={categoryVisualByEventId[occurrence.sourceEventId]}
                    onComplete={onComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {rows.length > PAGE_SIZE ? (
        <div className="sunk mt-6 flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-caption text-ink2">
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
              className="flex h-9 items-center gap-1 rounded-control px-3 t-caption text-ink3 hover:bg-card disabled:opacity-40"
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
                    <span className="grid size-9 place-items-center t-caption text-ink3">…</span>
                  ) : null}
                  <button
                    type="button"
                    aria-current={safePage === pageNumber ? 'page' : undefined}
                    className={cn(
                      'grid size-9 place-items-center rounded-control t-caption',
                      safePage === pageNumber
                        ? 'bg-card font-medium text-ink'
                        : 'text-ink2 hover:bg-card',
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
              className="flex h-9 items-center gap-1 rounded-control px-3 t-caption font-medium text-action hover:bg-card disabled:opacity-40"
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
  categoryVisual,
  onComplete,
  onEdit,
  onDelete,
}: {
  occurrence: ForecastOccurrence
  runningBalance?: number
  ownerName?: string
  categoryVisual?: ForecastCategoryVisual
  onComplete?: (sourceEventId: string, occurrenceDate: string) => void
  onEdit?: (sourceEventId: string) => void
  onDelete?: (sourceEventId: string) => void
}) {
  const { t } = useTranslation()
  const tone = balanceTone(runningBalance ?? 0)
  // A repayment reminder is generated from its debt and regenerated whenever the
  // debt's schedule changes, so editing or deleting it here would be undone by
  // the next debt edit. The debt is the only place to change it — completing it
  // stays available, since recording a payment is not an edit of the plan.
  const isDebtDerived = Boolean(occurrence.debtId)
  const markers = occurrenceMarkers(occurrence).filter(
    (marker) => marker !== 'confirmed' && marker !== 'required',
  )
  const CategoryIcon =
    (categoryVisual?.iconKey && CATEGORY_ICONS[categoryVisual.iconKey]) ||
    CATEGORY_ICON_FALLBACK

  return (
    <article className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-control px-3 py-3 transition-colors hover:bg-wash sm:grid-cols-[72px_minmax(0,1fr)_160px_auto]">
      <div className="num t-body-sm text-ink2">
        {formatDayMonth(occurrence.originalDate ?? occurrence.date)}
      </div>

      <div className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-pill text-white"
          style={{
            backgroundColor:
              categoryVisual?.iconColor ?? CATEGORY_ICON_DEFAULT_COLOR,
          }}
          title={categoryVisual?.label}
        >
          <CategoryIcon className="size-4" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate t-body font-medium">{occurrence.name}</span>
            {markers.map((marker) => (
              <span
                key={marker}
                className="inline-flex shrink-0 items-center rounded-pill bg-attention-tint px-2 py-0.5 t-caption-sm font-medium text-attention-ink"
              >
                {t(`upcoming.markers.${marker}`)}
              </span>
            ))}
          </div>
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 t-caption text-ink3">
            <UserRound className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="truncate">
              {ownerName ?? t('upcoming.timeline.householdOwner')}
            </span>
          </span>
        </div>
      </div>

      <div className="col-start-1 row-start-3 text-left sm:col-start-3 sm:row-start-1 sm:text-right">
        <div className="num t-body font-medium">
          {formatVndCellSigned(
            occurrence.direction === 'incoming' ? occurrence.amount : -occurrence.amount,
          )}{' '}
          <span className="t-caption text-ink3">{t('units.million')}</span>
        </div>
        <div
          className={cn(
            'num mt-1 t-caption text-ink3',
            runningBalance !== undefined && BALANCE_TONE_CLASS[tone],
          )}
        >
          {runningBalance === undefined
            ? '—'
            : (
              <>
                {t('upcoming.timeline.columns.remaining').toLocaleLowerCase()}{' '}
                {formatVndCell(runningBalance)} {t('units.million')}
              </>
            )}
        </div>
      </div>

      <div className="col-start-2 row-start-3 justify-self-end sm:col-start-4 sm:row-start-1">
        {onComplete || ((onEdit || onDelete) && !isDebtDerived) ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t('upcoming.rowActions.label')}
              className="flex size-11 items-center justify-center rounded-control text-ink2 outline-none transition-colors hover:bg-wash hover:text-ink"
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
              {onEdit && !isDebtDerived ? (
                <DropdownMenuItem onClick={() => onEdit(occurrence.sourceEventId)}>
                  <Pencil className="mr-2 size-4" />
                  {t('upcoming.rowActions.edit')}
                </DropdownMenuItem>
              ) : null}
              {onDelete && !isDebtDerived ? (
                <DropdownMenuItem
                  className="text-alert-ink focus:text-alert-ink"
                  onClick={() => onDelete(occurrence.sourceEventId)}
                >
                  <Trash2 className="mr-2 size-4" />
                  {t('upcoming.rowActions.delete')}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </article>
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
