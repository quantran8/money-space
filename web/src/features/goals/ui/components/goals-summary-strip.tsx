import { useTranslation } from 'react-i18next'

import { Panel, PanelHeader } from '@/components/ui/panel'
import type { GoalItem } from '@money-space/core/features/goals/model/goals'
import { formatAmount, type GoalStats } from '@money-space/core/features/goals/model/goals-form'
import { cn } from '@money-space/core/shared/lib/utils'

type GoalsSummaryStripProps = {
  count: number
  stats: GoalStats
  goals: GoalItem[]
}

export function GoalsSummaryStrip({ count, stats, goals }: GoalsSummaryStripProps) {
  const { t } = useTranslation()
  const plannedMonthly = goals.reduce(
    (sum, goal) => sum + (goal.plannedMonthlyContribution ?? 0),
    0,
  )
  const requiredMonthly = goals.reduce(
    (sum, goal) => sum + (goal.projection?.requiredMonthlyContributionForTargetDate ?? 0),
    0,
  )
  const withDeadline = goals.filter(
    (goal) => Boolean(goal.targetDate) && goal.targetDate !== 'No deadline',
  ).length

  /**
   * The gap comes FIRST, and it is the only figure at `t-figure`.
   *
   * "Đã tích lũy" is a state — it is true whether or not anything needs doing.
   * "Cần thêm để đúng hạn" is the number that decides what the household does
   * this month, so it leads and it is the one the eye lands on; the other two
   * are the context that makes it mean something (§7.2).
   */
  const metrics = [
    {
      label: t('goals.demo.requiredMonthly'),
      value: formatAmount(requiredMonthly),
      note:
        withDeadline > 0
          ? t('goals.demo.withDeadline', { count: withDeadline })
          : t('goals.demo.noDeadlineGoals'),
      lead: true,
    },
    {
      label: t('goals.demo.saved'),
      value: formatAmount(stats.saved),
      note: t('goals.demo.savedNote', { target: formatAmount(stats.target) }),
      lead: false,
    },
    {
      label: t('goals.demo.monthlyShort'),
      value: formatAmount(plannedMonthly),
      note:
        plannedMonthly > 0 ? t('goals.demo.monthlyPlanNote') : t('goals.demo.noMonthlyPlan'),
      lead: false,
    },
  ]

  return (
    <Panel>
      <PanelHeader title={t('goals.demo.progressTitle')} meta={t('goals.countLabel', { count })} />

      {/*
        Three metrics, three ROWS — label, figure, note — shared across the
        columns via `subgrid`, so the notes sit on one line even though the lead
        figure is a step taller than the other two. Stacking three independent
        blocks instead would step the notes down by that difference and the row
        stops reading as one comparison.

        The middle row is `1fr` with the figure bottom-aligned, which is what
        puts a 40px number and a 28px number on the same footing. Below `md`
        the columns collapse and the lead drops back to `t-metric`: a 40px
        figure in a one-column stack is loud without being a comparison.
      */}
      <div className="s-head-body grid gap-x-12 gap-y-5 md:grid-cols-[1.2fr_1fr_1fr] md:grid-rows-[auto_1fr_auto] md:gap-y-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="grid gap-y-2 md:row-span-3 md:grid-rows-subgrid">
            <p className="t-body-sm text-ink2">{metric.label}</p>
            <p
              className={cn(
                'money-number self-end',
                metric.lead ? 't-metric lg:t-figure' : 't-metric',
              )}
            >
              {metric.value}
            </p>
            <p className="t-caption leading-5 text-ink3">{metric.note}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}
