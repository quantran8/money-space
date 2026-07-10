import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { GoalItem } from '@/features/goals/model/goals'
import { formatAmount, goalAmount } from '@/features/goals/model/goals-form'

type PrimaryGoalCardProps = {
  goal: GoalItem
  remaining: number
  pace: number
}

export function PrimaryGoalCard({ goal, remaining, pace }: PrimaryGoalCardProps) {
  const { t } = useTranslation()
  return (
    <Card className="apple-shadow">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {t('goals.primary.eyebrow')}
            </p>
            <Badge className="bg-[hsla(var(--status-green),0.12)] text-[hsl(var(--status-green))]">
              {t('goals.primary.onTrack')}
            </Badge>
          </div>
          <h2 className="section-title mt-2 truncate text-2xl font-semibold">
            {goal.name}
          </h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {formatAmount(goalAmount(goal.currentAmount, goal.current))} /{' '}
            {formatAmount(goalAmount(goal.targetAmount, goal.target))} ·{' '}
            {t('goals.primary.remaining', { value: formatAmount(remaining) })}
          </p>
        </div>
        <p className="money-number shrink-0 text-5xl font-semibold sm:text-6xl">
          {goal.progress}%
        </p>
      </div>

      <Progress value={goal.progress} className="mt-6 h-3" />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="surface-muted rounded-3xl p-4">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            {t('goals.primary.saved')}
          </p>
          <p className="money-number mt-2 text-2xl font-semibold">
            {formatAmount(goalAmount(goal.currentAmount, goal.current))}
          </p>
        </div>
        <div className="surface-muted rounded-3xl p-4">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            {t('goals.primary.remainingLabel')}
          </p>
          <p className="money-number mt-2 text-2xl font-semibold">
            {formatAmount(remaining)}
          </p>
        </div>
        <div className="surface-muted rounded-3xl p-4">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            {t('goals.primary.pace')}
          </p>
          <p className="money-number mt-2 text-2xl font-semibold">
            {t('goals.primary.paceValue', { value: formatAmount(pace) })}
          </p>
        </div>
      </div>
    </Card>
  )
}
