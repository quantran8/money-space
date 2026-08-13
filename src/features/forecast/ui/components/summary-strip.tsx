import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import type { ForecastResult } from '@/features/forecast/model/forecast.types'
import {
  BALANCE_TONE_CLASS,
  balanceTone,
} from '@/features/forecast/model/forecast-presentation'
import { formatVndShort } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

/** Incoming · Outgoing · Lowest · Today (§26). */
export function SummaryStrip({ forecast }: { forecast: ForecastResult }) {
  const { t } = useTranslation()

  const lowestTone = balanceTone(
    forecast.lowestProjectedBalance,
    forecast.protectedReserveAmount,
  )

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric
        label={t('upcoming.summary.incoming')}
        value={formatVndShort(forecast.totals.upcomingIncomeAmount)}
        note={t('upcoming.summary.incomingNote')}
      />
      <Metric
        label={t('upcoming.summary.outgoing')}
        value={formatVndShort(forecast.totals.upcomingOutgoingAmount)}
        note={t('upcoming.summary.outgoingNote', {
          required: formatVndShort(forecast.totals.requiredOutgoingAmount),
        })}
      />
      <Metric
        label={t('upcoming.summary.lowest')}
        // Never clamped: a negative lowest balance is the point of the screen.
        value={formatVndShort(forecast.lowestProjectedBalance)}
        note={t('upcoming.summary.lowestNote', {
          date: forecast.lowestProjectedBalanceDate,
        })}
        valueClassName={BALANCE_TONE_CLASS[lowestTone]}
      />
      <Metric
        label={t('upcoming.summary.today')}
        value={formatVndShort(forecast.startingLiquidBalance)}
        note={t('upcoming.summary.todayNote', { count: forecast.usableNowAssetCount })}
      />
    </section>
  )
}

function Metric({
  label,
  value,
  note,
  valueClassName,
}: {
  label: string
  value: string
  note: string
  valueClassName?: string
}) {
  return (
    <Card>
      <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className={cn('money-number mt-3 text-2xl font-semibold', valueClassName)}>
        {value}
      </p>
      <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{note}</p>
    </Card>
  )
}
