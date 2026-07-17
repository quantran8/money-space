import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import type { RecentUpdate } from '@/features/goals/model/goals-form'

type RecentUpdatesCardProps = {
  recent: RecentUpdate[]
}

export function RecentUpdatesCard({ recent }: RecentUpdatesCardProps) {
  const { t } = useTranslation()
  return (
    <Card>
      <h3 className="section-title text-xl font-semibold">{t('goals.recent.title')}</h3>
      {recent.length === 0 ? (
        <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
          {t('goals.recent.empty')}
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {recent.map((item) => (
            <div
              key={item.id}
              className="surface-muted flex items-start gap-3 rounded-3xl p-4"
            >
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[hsl(var(--status-green))]" />
              <p className="text-sm font-medium">{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
