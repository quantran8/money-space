import { useTranslation } from 'react-i18next'

import { Label, Panel, PanelHeader } from '@/components/ui/panel'
import type { GoalItem } from '@money-space/core/features/goals/model/goals'
import { formatAmount, type GoalStats } from '@money-space/core/features/goals/model/goals-form'

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

  return (
    <Panel>
      <PanelHeader title={t('goals.demo.overview')} meta={t('goals.countLabel', { count })} />
      <div className="mt-7 grid gap-5 sm:grid-cols-3 sm:gap-0">
        <Metric
          label={t('goals.demo.saved')}
          value={formatAmount(stats.saved)}
          note={t('goals.demo.savedNote', { target: formatAmount(stats.target) })}
          className="sm:pr-7"
        />
        <Metric
          label={t('goals.demo.monthlyPlan')}
          value={formatAmount(plannedMonthly)}
          note={
            plannedMonthly > 0
              ? t('goals.demo.monthlyPlanNote')
              : t('goals.demo.noMonthlyPlan')
          }
          className="sm:border-l sm:border-divider sm:px-7"
        />
        <Metric
          label={t('goals.demo.requiredMonthly')}
          value={formatAmount(requiredMonthly)}
          note={t('goals.demo.requiredMonthlyNote')}
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
  className,
}: {
  label: string
  value: string
  note: string
  className?: string
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <p className="money-number mt-2 t-metric">{value}</p>
      <p className="mt-2 t-caption leading-5 text-ink2">{note}</p>
    </div>
  )
}
