import { useTranslation } from 'react-i18next'

import { Progress } from '@/components/ui/progress'
import type { GoalItem } from '@/features/goals/model/goals.types'
import { SectionCard } from '@/features/dashboard/ui/components/section-card'

type LongTermGoalSectionProps = {
  mainGoal: GoalItem | undefined
}

export function LongTermGoalSection({ mainGoal }: LongTermGoalSectionProps) {
  const { t } = useTranslation()

  return (
    <SectionCard
      title={t('dashboard.sections.longTerm.title')}
      subtitle={t('dashboard.sections.longTerm.subtitle')}
      to="/goals"
      className="lg:col-span-8"
    >
      <div className="flex h-full flex-col justify-center rounded-[24px] bg-[hsl(var(--muted))] p-5">
        <div className="flex items-end justify-between gap-3">
          <p className="text-lg font-semibold tracking-[-0.02em] md:text-xl">
            {mainGoal?.name ?? 'No active goal'}
          </p>
          <p className="money-number text-3xl md:text-4xl">{mainGoal?.progress ?? 0}%</p>
        </div>
        <Progress value={mainGoal?.progress ?? 0} className="mt-4 h-2" />
      </div>
    </SectionCard>
  )
}
