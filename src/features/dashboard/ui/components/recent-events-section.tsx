import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { MoneyEventItem } from '@/features/events/model/events.types'
import { SectionCard } from '@/features/dashboard/ui/components/section-card'

type RecentEventsSectionProps = {
  moneyEvents: MoneyEventItem[]
  subtitle: string
}

export function RecentEventsSection({ moneyEvents, subtitle }: RecentEventsSectionProps) {
  const { t } = useTranslation()

  return (
    <SectionCard title={t('dashboard.sections.recent.title')} subtitle={subtitle} to="/events">
      <div className="divide-y divide-[hsl(var(--border))] overflow-hidden rounded-[24px] bg-[hsl(var(--muted))]">
        {moneyEvents.slice(0, 2).map((event) => (
          <Link
            key={event.id ?? `${event.title}-${event.date}`}
            to="/events"
            className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-[hsl(var(--secondary))]"
          >
            <div className="min-w-0">
              <p className="truncate font-medium tracking-[-0.01em]">{event.title}</p>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{event.date}</p>
            </div>
            <p className="money-number shrink-0 text-base">{event.amount}</p>
          </Link>
        ))}
      </div>
    </SectionCard>
  )
}
