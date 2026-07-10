import { useTranslation } from 'react-i18next'

import { SummaryStrip, SummaryTile } from '@/components/ui/summary-strip'
import { formatAmount, type GoalStats } from '@/features/goals/model/goals-form'

type GoalsSummaryStripProps = {
  count: number
  stats: GoalStats
}

export function GoalsSummaryStrip({ count, stats }: GoalsSummaryStripProps) {
  const { t } = useTranslation()
  return (
    <SummaryStrip>
      <SummaryTile
        label={t('goals.strip.count')}
        value={t('goals.countLabel', { count })}
      />
      <SummaryTile
        label={t('goals.strip.saved')}
        value={formatAmount(stats.saved)}
        dotColor="hsl(var(--status-green))"
      />
      <SummaryTile label={t('goals.strip.target')} value={formatAmount(stats.target)} />
      <SummaryTile label={t('goals.strip.avgProgress')} value={`${stats.avg}%`} inverted />
    </SummaryStrip>
  )
}
