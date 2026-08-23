import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { GoalItem } from '@money-space/core/features/goals/model/goals'
import { formatAmount, type GoalStats } from '@money-space/core/features/goals/model/goals-form'

import { Label, Money, Panel, PanelHeader, SummaryStrip } from '@/components/ui'

/**
 * The three figures that answer "where does the household stand across every
 * goal": what is behind them, what is being put in monthly, and what would be
 * needed to hit the dates.
 *
 * The web sets these as three equal columns. On a phone the first one is the
 * anchor — it is the only figure a household reads before deciding whether to
 * read anything else — so it sits above the other two as the section's own
 * number, and those two share a strip below it. That is §9's "one metric
 * outranking the group belongs outside the group", not a decoration.
 */
export function GoalsSummaryStrip({
  count,
  stats,
  goals,
}: {
  count: number
  stats: GoalStats
  goals: GoalItem[]
}) {
  const { t } = useTranslation()

  const plannedMonthly = goals.reduce(
    (sum, goal) => sum + (goal.plannedMonthlyContribution ?? 0),
    0,
  )
  const requiredMonthly = goals.reduce(
    (sum, goal) => sum + (goal.projection?.requiredMonthlyContributionForTargetDate ?? 0),
    0,
  )

  return (
    <Panel>
      <PanelHeader
        title={t('goals.demo.overview')}
        right={<Text className="text-[12px] text-ink3">{t('goals.countLabel', { count })}</Text>}
      />

      <View className="mt-6">
        <Label>{t('goals.demo.saved')}</Label>
        <Money className="mt-2" size={34}>
          {formatAmount(stats.saved)}
        </Money>
        <Text className="mt-2 text-[12px] leading-5 text-ink2">
          {t('goals.demo.savedNote', { target: formatAmount(stats.target) })}
        </Text>
      </View>

      <SummaryStrip
        className="mt-5"
        items={[
          {
            key: 'planned',
            label: t('goals.demo.monthlyPlan'),
            value: formatAmount(plannedMonthly),
          },
          {
            key: 'required',
            label: t('goals.demo.requiredMonthly'),
            value: formatAmount(requiredMonthly),
          },
        ]}
      />

      {/* One caveat line, not two notes under two tiles: a household with no
          declared pace needs to be told that once, and the second tile's
          "tính từ mục tiêu có ngày mong muốn" is scope the first note covers. */}
      <Text className="mt-3 text-[11px] leading-4 text-ink3">
        {plannedMonthly > 0
          ? t('goals.demo.monthlyPlanNote')
          : t('goals.demo.noMonthlyPlan')}
      </Text>
    </Panel>
  )
}
