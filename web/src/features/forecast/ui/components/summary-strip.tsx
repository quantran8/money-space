import { useTranslation } from 'react-i18next'

import { Label, Panel, PanelHeader } from '@/components/ui/panel'
import type { ForecastResult } from '@money-space/core/features/forecast/model/forecast.types'
import {
  BALANCE_TONE_CLASS,
  balanceTone,
  canProjectBalance,
} from '@money-space/core/features/forecast/model/forecast-presentation'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

/** One summary panel: incoming · outgoing · projected low (§26). */
export function SummaryStrip({ forecast }: { forecast: ForecastResult }) {
  const { t } = useTranslation()

  // `Tiền vào` / `Tiền ra` beside it are unaffected: those are sums of real
  // events and do not depend on a balance existing.
  const hasLiquidSource = canProjectBalance(forecast.usableNowAssetCount)
  const lowestTone = balanceTone(forecast.lowestProjectedBalance)

  return (
    <Panel>
      <PanelHeader
        title={t('upcoming.summary.title')}
        meta={`${formatDayMonth(forecast.asOfDate)} — ${formatDayMonth(forecast.horizonEndDate)}`}
      />

      <div className="mt-7 grid gap-5 sm:grid-cols-3 sm:gap-0">
        {/* Projected low leads: it is the primary read of this screen. */}
        <Metric
          label={t('upcoming.summary.lowest')}
          // Never clamped when it CAN be stated: a negative low point is the
          // point of the screen. Only the no-wallet case blanks it.
          value={
            hasLiquidSource
              ? formatVndShort(forecast.lowestProjectedBalance)
              : '—'
          }
          note={
            hasLiquidSource
              ? t('upcoming.summary.lowestNote', {
                  date: formatDayMonth(forecast.lowestProjectedBalanceDate),
                })
              : t('upcoming.summary.lowestNoSource')
          }
          valueClassName={hasLiquidSource ? BALANCE_TONE_CLASS[lowestTone] : undefined}
          className="sm:pr-7"
        />
        <Metric
          label={t('upcoming.summary.incoming')}
          value={formatVndShort(forecast.totals.upcomingIncomeAmount)}
          note={t('upcoming.summary.incomingNote')}
          className="sm:border-l sm:border-divider sm:px-7"
        />
        <Metric
          label={t('upcoming.summary.outgoing')}
          value={formatVndShort(forecast.totals.upcomingOutgoingAmount)}
          note={t('upcoming.summary.outgoingNote', {
            required: formatVndShort(forecast.totals.requiredOutgoingAmount),
          })}
          className="sm:border-l sm:border-divider sm:pl-7"
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
