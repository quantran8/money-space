import { Check, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
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

export function ForecastTimeline({
  days,
  ownerNameByEventId = {},
  isLoading = false,
  isEmpty = false,
  onAdd,
  onComplete,
  onEdit,
  onDelete,
}: ForecastTimelineProps) {
  const { t } = useTranslation()
  const rows = flattenTimeline(days)

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
            <tr className="label">
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

          <tbody className="block lg:table-row-group">
            {rows.map(({ occurrence, runningBalance }) => (
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
        </table>
      </div>
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
        {formatDayMonth(occurrence.date)}
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

function flattenTimeline(days: ForecastDay[]): TimelineRow[] {
  return days.flatMap((day) => {
    const balances = runningBalancesForDay(day)
    return day.occurrences.map((occurrence) => ({
      occurrence,
      // A displayed-but-excluded amount must not claim a resulting balance.
      runningBalance: occurrence.countedInBalance
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
