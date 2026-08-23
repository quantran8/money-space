import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { PeriodSummary } from '@money-space/core/features/events/model/events-form'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'

import { Label, Money, Panel, PanelHeader, SummaryStrip } from '@/components/ui'
import { dateLocale, shortMonthLabel } from '@/features/events/lib/event-months'

/**
 * What this month came to, above the timeline that lists it row by row.
 *
 * Only records that actually happened are counted — an unpaid or postponed row
 * is money that has not moved, and folding it in here would report a month that
 * has not finished happening. That is why the count says "đã xảy ra" rather
 * than simply how many rows are below.
 *
 * The web shows three equal metrics in a row. At 375pt three money figures
 * across leave ~100pt each, which truncates them (§6: money never truncates).
 * So net — the one figure that answers "did this month add up" — is the panel's
 * anchor, and thu / chi sit under it as a two-up strip. That is also the honest
 * hierarchy: thu and chi are the workings, net is the answer.
 */
export function EventsSummaryPanel({
  summary,
  month,
}: {
  summary: PeriodSummary
  month: string
}) {
  const { t, i18n } = useTranslation()
  const locale = dateLocale(i18n.resolvedLanguage)
  const isNegative = summary.netChange < 0

  return (
    <Panel>
      <PanelHeader
        title={shortMonthLabel(month, locale)}
        right={
          <Label>{t('events.summary.recordedCount', { count: summary.recordedCount })}</Label>
        }
      />

      <View className="mt-5">
        <Label>{t('events.summary.net')}</Label>
        {/* Never clamped: a month that spent more than it took in reads
            negative, and that number is the signal (Invariant 1). */}
        <Money
          className={isNegative ? 'text-alert' : 'text-interactive'}
          size={32}
        >
          {`${isNegative ? '−' : '+'}${formatVndScale(Math.abs(summary.netChange))}`}
        </Money>
      </View>

      <SummaryStrip
        className="mt-4"
        items={[
          {
            key: 'received',
            label: t('events.summary.received'),
            value: `+${formatVndScale(summary.totalIncome)}`,
          },
          {
            key: 'spent',
            label: t('events.summary.spent'),
            value: `−${formatVndScale(summary.totalOutcome)}`,
          },
        ]}
      />
    </Panel>
  )
}
