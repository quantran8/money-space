import { useTranslation } from 'react-i18next'

import { Label, Panel, PanelHeader } from '@/components/ui/panel'
import type { ForecastResult } from '@/features/forecast/model/forecast.types'
import {
  BALANCE_TONE_CLASS,
  balanceTone,
} from '@/features/forecast/model/forecast-presentation'
import { formatVndShort } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

/** One summary panel: incoming · outgoing · projected low (§26). */
export function SummaryStrip({ forecast }: { forecast: ForecastResult }) {
  const { t } = useTranslation()

  const lowestTone = balanceTone(
    forecast.lowestProjectedBalance,
    forecast.protectedReserveAmount,
  )

  return (
    <Panel>
      <PanelHeader
        title={t('upcoming.summary.title')}
        meta={`${formatDayMonth(forecast.asOfDate)} — ${formatDayMonth(forecast.horizonEndDate)}`}
      />

      <div className="mt-7 grid gap-5 sm:grid-cols-3 sm:gap-0">
        <Metric
          label={t('upcoming.summary.incoming')}
          value={formatVndShort(forecast.totals.upcomingIncomeAmount)}
          note={t('upcoming.summary.incomingNote')}
          className="sm:pr-7"
        />
        <Metric
          label={t('upcoming.summary.outgoing')}
          value={formatVndShort(forecast.totals.upcomingOutgoingAmount)}
          note={t('upcoming.summary.outgoingNote', {
            required: formatVndShort(forecast.totals.requiredOutgoingAmount),
          })}
          className="sm:border-l sm:border-hair sm:px-7"
        />
        <Metric
          label={t('upcoming.summary.lowest')}
          // Never clamped: a negative lowest balance is the point of the screen.
          value={formatVndShort(forecast.lowestProjectedBalance)}
          note={t('upcoming.summary.lowestNote', {
            date: formatDayMonth(forecast.lowestProjectedBalanceDate),
          })}
          valueClassName={BALANCE_TONE_CLASS[lowestTone]}
          className="sm:border-l sm:border-hair sm:pl-7"
        />
      </div>
    </Panel>
  )
}

function Metric({
  label,
  value,
  note,
  valueClassName,
  className,
}: {
  label: string
  value: string
  note: string
  valueClassName?: string
  className?: string
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <p className={cn('money-number mt-2 text-[30px]', valueClassName)}>
        {value}
      </p>
      <p className="mt-2 text-[12px] leading-5 text-ink2">{note}</p>
    </div>
  )
}

/** "13/08" — mono-safe ASCII, per design.md §10.1. */
function formatDayMonth(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}` : isoDate
}
