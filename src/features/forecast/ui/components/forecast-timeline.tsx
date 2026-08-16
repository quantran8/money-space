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

      <div className="mt-7 hidden grid-cols-[84px_minmax(220px,1fr)_116px_128px_128px_32px] px-3 lg:grid">
        <p className="label">{t('upcoming.timeline.columns.date')}</p>
        <p className="label">{t('upcoming.timeline.columns.item')}</p>
        <p className="label">{t('upcoming.timeline.columns.owner')}</p>
        <p className="label text-right">{t('upcoming.timeline.columns.amount')}</p>
        <p className="label text-right">{t('upcoming.timeline.columns.remaining')}</p>
        <span />
      </div>

      <div className="mt-2 space-y-1">
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
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 rounded-control px-3 py-3 transition-colors hover:bg-sunk lg:grid-cols-[84px_minmax(220px,1fr)_116px_128px_128px_32px] lg:items-center lg:py-2.5">
      <p className="col-start-1 row-start-1 font-mono text-[11px] text-ink3 lg:col-auto lg:row-auto">
        {formatDayMonth(occurrence.date)}
      </p>

      <div className="col-start-1 row-start-2 mt-1 min-w-0 lg:col-auto lg:row-auto lg:mt-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-[13px] font-medium">{occurrence.name}</span>
          {markers.map((marker) => (
            <span key={marker} className="font-mono text-[10px] text-attention">
              {t(`upcoming.markers.${marker}`)}
            </span>
          ))}
        </div>
      </div>

      <p className="col-start-1 row-start-3 mt-2 text-[12px] text-ink2 lg:col-auto lg:row-auto lg:mt-0">
        {ownerName ?? t('upcoming.timeline.householdOwner')}
      </p>

      <p
        className={cn(
          'num col-start-2 row-start-2 mt-1 text-right text-[14px] font-medium lg:col-auto lg:row-auto lg:mt-0',
          isIncoming && 'text-accent',
        )}
      >
        {formatVndCellSigned(isIncoming ? occurrence.amount : -occurrence.amount)}
      </p>

      <p
        className={cn(
          'num col-start-2 row-start-3 mt-2 text-right text-[12px] text-ink2 lg:col-auto lg:row-auto lg:mt-0 lg:text-[14px]',
          runningBalance !== undefined && BALANCE_TONE_CLASS[tone],
        )}
      >
        {runningBalance === undefined ? '—' : formatVndCell(runningBalance)}
      </p>

      {onComplete || onEdit || onDelete ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t('upcoming.rowActions.label')}
            className="col-start-2 row-start-1 flex size-8 items-center justify-center justify-self-end rounded-full text-ink3 outline-none transition hover:bg-panel hover:text-ink lg:col-auto lg:row-auto"
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
    </div>
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
