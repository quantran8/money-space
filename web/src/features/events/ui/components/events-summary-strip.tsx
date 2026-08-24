import { useTranslation } from 'react-i18next'

import { Label, Panel, PanelHeader } from '@/components/ui/panel'
import type { PeriodSummary } from '@money-space/core/features/events/model/events-form'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

type EventsSummaryStripProps = {
  summary: PeriodSummary
  /** `YYYY-MM` — the period the figures describe, echoed as the panel title. */
  month: string
}

function monthLabel(monthKey: string, locale: string) {
  const [year, month] = monthKey.split('-').map(Number)
  if (locale === 'vi-VN') return `Tháng ${month}`
  return new Date(year, month - 1, 1).toLocaleDateString(locale, { month: 'long' })
}

/**
 * What this month came to, above the timeline that lists it row by row.
 *
 * Only records that actually happened are counted — an unpaid or postponed row
 * is money that has not moved, and folding it in here would report a month that
 * has not finished happening. That is why the count says "đã xảy ra" and not
 * simply how many rows are below.
 */
export function EventsSummaryStrip({ summary, month }: EventsSummaryStripProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'

  return (
    <Panel>
      <PanelHeader
        title={<span className="capitalize">{monthLabel(month, locale)}</span>}
        meta={t('events.summary.recordedCount', { count: summary.recordedCount })}
      />
      <div className="mt-7 grid gap-5 sm:grid-cols-3 sm:gap-0">
        <Metric
          label={t('events.summary.received')}
          value={`+${formatVndScale(summary.totalIncome)}`}
          className="sm:pr-7"
          valueClassName="text-action"
        />
        <Metric
          label={t('events.summary.spent')}
          value={`−${formatVndScale(summary.totalOutcome)}`}
          className="sm:border-l sm:border-divider sm:px-7"
        />
        {/* The one figure that answers "did this month add up or not", so it
            carries the sign and takes its colour from the answer. */}
        <Metric
          label={t('events.summary.net')}
          value={`${summary.netChange < 0 ? '−' : '+'}${formatVndScale(Math.abs(summary.netChange))}`}
          className="sm:border-l sm:border-divider sm:pl-7"
          valueClassName={summary.netChange < 0 ? 'text-alert' : 'text-action'}
        />
      </div>
    </Panel>
  )
}

function Metric({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string
  value: string
  className?: string
  valueClassName?: string
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <p className={cn('money-number mt-2 text-[30px]', valueClassName)}>{value}</p>
    </div>
  )
}
