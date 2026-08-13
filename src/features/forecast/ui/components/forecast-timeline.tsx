import { ArrowDownLeft, ArrowUpRight, Check, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { formatVndShort } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type ForecastTimelineProps = {
  days: ForecastDay[]
  protectedReserveAmount: number
  isLoading?: boolean
  isEmpty?: boolean
  /** Opens the create dialog from the empty state. */
  onAdd?: () => void
  /** Row actions. Keyed by `sourceEventId` — occurrences are not rows (§18). */
  onComplete?: (sourceEventId: string, occurrenceDate: string) => void
  onEdit?: (sourceEventId: string) => void
  onDelete?: (sourceEventId: string) => void
}

export function ForecastTimeline({
  days,
  protectedReserveAmount,
  isLoading = false,
  isEmpty = false,
  onAdd,
  onComplete,
  onEdit,
  onDelete,
}: ForecastTimelineProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <Card>
        <div className="space-y-4">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    )
  }

  if (isEmpty) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-center text-sm text-ink2">
            {t('upcoming.timeline.empty')}
          </p>
          {/* An empty forecast is the one place the add action matters most —
              there is nothing else on the screen to act on. */}
          {onAdd ? (
            <Button onClick={onAdd}>
              <Plus className="mr-2 size-4" />
              {t('upcoming.form.submit')}
            </Button>
          ) : null}
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="section-title text-xl font-semibold">{t('upcoming.timeline.title')}</h2>
      <div className="mt-5 space-y-6">
        {days.map((day) => (
          <DayGroup
            key={day.date}
            day={day}
            protectedReserveAmount={protectedReserveAmount}
            onComplete={onComplete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </Card>
  )
}

function DayGroup({
  day,
  protectedReserveAmount,
  onComplete,
  onEdit,
  onDelete,
}: {
  day: ForecastDay
  protectedReserveAmount: number
  onComplete?: (sourceEventId: string, occurrenceDate: string) => void
  onEdit?: (sourceEventId: string) => void
  onDelete?: (sourceEventId: string) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  const balances = runningBalancesForDay(day)
  const label = new Date(`${day.date}T00:00:00`).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const closingTone = balanceTone(day.closingBalance, protectedReserveAmount)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-ink2">
          {t('upcoming.timeline.closing')}{' '}
          <span className={cn('money-number font-semibold', BALANCE_TONE_CLASS[closingTone])}>
            {formatVndShort(day.closingBalance)}
          </span>
        </p>
      </div>
      <div className="mt-3 divide-y divide-border">
        {day.occurrences.map((occurrence) => (
          <OccurrenceRow
            key={occurrence.occurrenceKey}
            occurrence={occurrence}
            runningBalance={balances.get(occurrence.occurrenceKey) ?? day.closingBalance}
            protectedReserveAmount={protectedReserveAmount}
            onComplete={onComplete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}

function OccurrenceRow({
  occurrence,
  runningBalance,
  protectedReserveAmount,
  onComplete,
  onEdit,
  onDelete,
}: {
  occurrence: ForecastOccurrence
  runningBalance: number
  protectedReserveAmount: number
  onComplete?: (sourceEventId: string, occurrenceDate: string) => void
  onEdit?: (sourceEventId: string) => void
  onDelete?: (sourceEventId: string) => void
}) {
  const { t } = useTranslation()
  const isIncoming = occurrence.direction === 'incoming'
  const Icon = isIncoming ? ArrowDownLeft : ArrowUpRight
  const tone = balanceTone(runningBalance, protectedReserveAmount)
  const markers = occurrenceMarkers(occurrence)

  return (
    <div
      className={cn(
        'flex items-center gap-3 py-3',
        // Not counted in the balance — shown, but visually set back so it can't
        // be mistaken for money that actually moves.
        !occurrence.countedInBalance && 'opacity-60',
      )}
    >
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          isIncoming
            ? 'bg-accent-tint text-accent'
            : 'bg-sunk text-ink2',
        )}
      >
        <Icon className="size-4" strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{occurrence.name}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {markers.map((marker) => (
            <span
              key={marker}
              className="rounded-full bg-sunk px-2 py-0.5 text-[11px] font-medium text-ink2"
            >
              {t(`upcoming.markers.${marker}`)}
            </span>
          ))}
        </div>
      </div>

      <p className="money-number shrink-0 text-sm font-semibold">
        {isIncoming ? '+' : '−'}
        {formatVndShort(occurrence.amount)}
      </p>

      {/* The trailing running-balance column — what makes this a forecast
          rather than a list. */}
      <p
        className={cn(
          'money-number w-24 shrink-0 text-right text-sm font-semibold',
          BALANCE_TONE_CLASS[tone],
        )}
      >
        <span className="text-ink2">→ </span>
        {formatVndShort(runningBalance)}
      </p>

      {onComplete || onEdit || onDelete ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t('upcoming.rowActions.label')}
            className="shrink-0 rounded-full p-1.5 text-ink2 outline-none transition hover:bg-sunk hover:text-foreground"
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
