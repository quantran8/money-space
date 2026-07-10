import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import type { GoalAllocationSlice } from '@/features/goals/model/goals-form'

type AllocationCardProps = {
  allocation: GoalAllocationSlice[]
}

export function AllocationCard({ allocation }: AllocationCardProps) {
  const { t } = useTranslation()
  return (
    <Card>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        {t('goals.allocation.eyebrow')}
      </p>
      <h3 className="section-title mt-1 text-xl font-semibold">
        {t('goals.allocation.title')}
      </h3>
      <div className="mt-5 space-y-4">
        {allocation.map((slice) => (
          <div key={slice.id}>
            <div className="flex justify-between text-sm">
              <span className="truncate">{slice.name}</span>
              <span className="text-[hsl(var(--muted-foreground))]">{slice.percent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
              <div
                className="h-full rounded-full"
                style={{ width: `${slice.percent}%`, backgroundColor: slice.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
