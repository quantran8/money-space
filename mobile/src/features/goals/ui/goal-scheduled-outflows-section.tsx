import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { ScheduledOutflowImpact } from '@money-space/core/features/goals/api/goals.repository'
import { formatAmount } from '@money-space/core/features/goals/model/goals-form'

import { Collapsible, GroupedRow, Panel, RowMeta, Sunk } from '@/components/ui'
import { formatDayMonth } from '@/features/goals/lib/goal-dates'

/**
 * What money already scheduled to leave this goal's wallets will cost it.
 *
 * ## Why one section instead of a note on every figure
 *
 * A scheduled outflow moves several numbers on this screen at once — the total
 * held, this month's pace, each wallet's card. Hanging a projected figure off
 * each of them restates one fact three times, explains it none, and leaves the
 * cause (a named bill, on a date) nowhere to live. So every figure elsewhere
 * stays ACTUAL — the wallet as it stands, because money that has not moved has
 * not been spent — and this is the single place that says what is coming.
 *
 * ## What it deliberately does NOT touch
 *
 * The finish date and the declared pace above keep using the DECLARED figure. A
 * squeezed month is this month only: the wallet refills, and projecting a
 * one-month dip across years would report a pessimistic finish date the
 * household never chose. `paceNote` says exactly that.
 *
 * Renders nothing when the server sends `null` — a household with no bills
 * against these wallets never sees a speculative block.
 */
export function GoalScheduledOutflowsSection({
  impact,
  target,
}: {
  impact: ScheduledOutflowImpact | null
  /** The goal's target, so before/after can also be stated as a percentage. */
  target: number
}) {
  const { t, i18n } = useTranslation()

  if (!impact || impact.events.length === 0) return null

  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  const percent = (value: number) =>
    target > 0
      ? new Intl.NumberFormat(locale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(Math.min(Math.max((value / target) * 100, 0), 100))
      : null

  // The one event worth naming in the summary: the largest, since it is the one
  // most worth recognising and possibly changing.
  const lead = [...impact.events].sort((a, b) => b.amount - a.amount)[0]
  const projectedPercent = percent(impact.projectedAmount)

  return (
    <Panel>
      <Collapsible
        showLabel={t('goals.scheduledOutflows.show')}
        hideLabel={t('goals.scheduledOutflows.hide')}
        summary={
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-[16px] font-medium text-ink">
                {t('goals.scheduledOutflows.heading')}
              </Text>
              <Text className="rounded-full bg-attention-soft px-2 py-0.5 text-[10px] font-medium text-attention">
                {t('goals.scheduledOutflows.count', { count: impact.events.length })}
              </Text>
            </View>

            {/* The whole answer: when, from which wallet, how much, and where
                the goal stands afterwards. Two lines rather than one, because a
                phone would wrap a single line mid-figure and money must not
                break across lines. */}
            <View className="mt-2.5 flex-row flex-wrap items-center gap-x-2 gap-y-0.5">
              <Text className="font-mono text-[11px] text-ink3">
                {formatDayMonth(lead.expectedDate)}
              </Text>
              <Text className="text-[14px] font-medium text-ink" numberOfLines={1}>
                {lead.assetName}
              </Text>
              <Text
                className="text-[14px] font-medium text-alert"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                −{formatAmount(impact.outflowAmount)}
              </Text>
            </View>
            <Text className="mt-0.5 text-[14px] text-ink2">
              {t('goals.scheduledOutflows.after')}{' '}
              <Text className="font-medium text-ink" style={{ fontVariant: ['tabular-nums'] }}>
                {formatAmount(impact.projectedAmount)}
                {projectedPercent ? ` · ${projectedPercent}%` : ''}
              </Text>
            </Text>
          </View>
        }
      >
        <Text className="text-[14px] leading-5 text-ink2">
          {t('goals.scheduledOutflows.description')}
        </Text>

        {/* Before and after, stacked rather than side by side. Two 160pt
            columns would truncate money, and §6 does not allow that. Stating
            both in full also beats a strikethrough pair: the household reads
            two complete pictures instead of reconstructing one from edits. */}
        <Sunk className="mt-4">
          <Text
            className="text-[11px] font-medium uppercase text-ink3"
            style={{ letterSpacing: 0.66 }}
          >
            {t('goals.scheduledOutflows.beforeLabel')}
          </Text>
          <ImpactFigures
            held={impact.currentAmount}
            pace={impact.currentPace}
            target={target}
            percent={percent}
          />
        </Sunk>

        <View className="mt-2 rounded-sunk bg-attention-soft p-4">
          <View className="flex-row items-baseline justify-between gap-3">
            <Text
              className="text-[11px] font-medium uppercase text-attention"
              style={{ letterSpacing: 0.66 }}
            >
              {t('goals.scheduledOutflows.afterLabel')}
            </Text>
            <Text
              className="text-[11px] font-medium text-attention"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              −{formatAmount(impact.outflowAmount)}
            </Text>
          </View>
          <ImpactFigures
            held={impact.projectedAmount}
            pace={impact.projectedPace}
            target={target}
            percent={percent}
          />
        </View>

        {/* The bills themselves. Naming them is what makes the block explain
            rather than merely assert — the household can recognise the spend
            and go change it if the trade is not one they want. */}
        <View className="mt-4">
          {impact.events.map((event) => (
            <GroupedRow
              key={event.id}
              title={event.name}
              // The date is ASCII and takes the mono face; the wallet name is
              // the household's own words and must not (§5, hard constraint).
              meta={
                <RowMeta>
                  <Text className="font-mono">{formatDayMonth(event.expectedDate)}</Text>
                  {` · ${t('goals.scheduledOutflows.fromWallet', { wallet: event.assetName })}`}
                </RowMeta>
              }
              value={formatAmount(event.amount)}
              valueTone="muted"
            />
          ))}
        </View>

        <Text className="mt-3 text-[11px] leading-4 text-ink3">
          {t('goals.scheduledOutflows.paceNote')}
        </Text>
      </Collapsible>
    </Panel>
  )
}

/** The same readings on both sides, so the two blocks line up row for row. */
function ImpactFigures({
  held,
  pace,
  target,
  percent,
}: {
  held: number
  pace: number
  target: number
  percent: (value: number) => string | null
}) {
  const { t } = useTranslation()
  const remaining = Math.max(target - held, 0)
  const share = percent(held)

  return (
    <View className="mt-3 gap-2">
      <Figure label={t('goals.scheduledOutflows.totalLabel')} value={formatAmount(held)} />
      <Figure label={t('goals.scheduledOutflows.remainingLabel')} value={formatAmount(remaining)} />
      {share ? <Figure label={t('goals.scheduledOutflows.percentLabel')} value={`${share}%`} /> : null}
      <Figure label={t('goals.scheduledOutflows.paceLabel')} value={formatAmount(pace)} />
    </View>
  )
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline justify-between gap-3">
      <Text className="flex-1 text-[14px] text-ink2">{label}</Text>
      <Text
        className="text-[14px] font-medium text-ink"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
    </View>
  )
}
