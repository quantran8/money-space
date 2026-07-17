import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { GoalItem } from '@/features/goals/model/goals'
import { formatAmount } from '@/features/goals/model/goals-form'

type ThisMonthCardProps = {
  goal: GoalItem
  pace: number
  onSuggestContribution: (goalId: string, value: string) => void
}

export function ThisMonthCard({ goal, pace, onSuggestContribution }: ThisMonthCardProps) {
  const { t } = useTranslation()
  return (
    <Card>
      <h3 className="section-title text-xl font-semibold">
        {t('goals.thisMonth.title', { name: goal.name })}
      </h3>
      <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
        {t('goals.thisMonth.description', { value: formatAmount(pace) })}
      </p>
      <div className="surface-muted mt-5 rounded-3xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('goals.thisMonth.suggestion')}
          </span>
          <span className="money-number text-2xl font-semibold">
            {formatAmount(pace)}
          </span>
        </div>
        <Button
          className="mt-4 w-full"
          onClick={() => onSuggestContribution(goal.id, formatAmount(pace))}
        >
          {t('goals.thisMonth.action')}
        </Button>
      </div>
    </Card>
  )
}
