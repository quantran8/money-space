import { Text, View } from 'react-native'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'

import type { PeriodSummary } from '@money-space/core/features/events/model/events-form'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'

import { Label, Money, Panel, PanelHeader } from '@/components/ui'
import { colors } from '@/theme/tokens'

import type { LucideIcon } from 'lucide-react-native'

/**
 * What this month came to, above the timeline that lists it row by row.
 *
 * Only records that actually happened are counted — an unpaid or postponed row
 * is money that has not moved, and folding it in here would report a month that
 * has not finished happening. That is why the count says "đã xảy ra" rather
 * than simply how many rows are below.
 *
 * Net leads and is the only figure at `t-metric`: in and out are inputs to the
 * question, net IS the question ("did this month add up").
 *
 * The web sets the three side by side with `subgrid` keeping them on one
 * baseline. At 375pt three money figures across leave ~100pt each, which
 * truncates them (§6: money never truncates), so they stack instead — which is
 * also the honest hierarchy: thu and chi are the workings, net is the answer.
 *
 * The month is named once, by the scope control above, so this header carries
 * the section's own name rather than repeating it.
 */
export function EventsSummaryPanel({ summary }: { summary: PeriodSummary }) {
  const { t } = useTranslation()
  const isShort = summary.netChange < 0

  return (
    <Panel>
      <PanelHeader
        title={t('events.summary.title')}
        right={
          <Label>{t('events.summary.recordedCount', { count: summary.recordedCount })}</Label>
        }
      />

      <View className="mt-5 gap-5">
        <View>
          <MetricLabel
            icon={ArrowLeftRight}
            tone={colors.dataPrimary}
            label={t('events.summary.net')}
          />
          {/* Never clamped: a month that spent more than it took in reads
              negative, and that number is the signal (Invariant 1).

              Colour marks what needs a look (§5.2), so only a month that ended
              short is tinted. A positive net is the expected case and stays
              ink — a static metric never wears the action colour (§4). */}
          <Money className={isShort ? 'mt-2 text-alert-ink' : 'mt-2'}>
            {`${isShort ? '−' : '+'}${formatVndScale(Math.abs(summary.netChange))}`}
          </Money>
        </View>

        <View>
          <MetricLabel
            icon={ArrowDownLeft}
            tone={colors.protect}
            label={t('events.summary.moneyIn')}
          />
          <Money className="mt-2">{`+${formatVndScale(summary.totalIncome)}`}</Money>
        </View>

        <View>
          <MetricLabel
            icon={ArrowUpRight}
            tone={colors.ink2}
            label={t('events.summary.moneyOut')}
          />
          <Money className="mt-2">{`−${formatVndScale(summary.totalOutcome)}`}</Money>
        </View>
      </View>
    </Panel>
  )
}

function MetricLabel({
  icon: Icon,
  tone,
  label,
}: {
  icon: LucideIcon
  tone: string
  label: string
}) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon size={18} color={tone} strokeWidth={1.75} />
      <Text className="t-body-sm text-ink2">{label}</Text>
    </View>
  )
}
