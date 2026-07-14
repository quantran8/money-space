import { ChevronRight, Landmark, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { MoneyEventItem } from '@/features/events/model/events.types'
import { formatVndSigned } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type RecentEventsSectionProps = {
  moneyEvents: MoneyEventItem[]
  subtitle: string
}

/**
 * "Gần đây" (mockup `#recent`): an intentionally quiet card listing the latest
 * money activity in the household.
 */
export function RecentEventsSection({ moneyEvents, subtitle }: RecentEventsSectionProps) {
  const { t } = useTranslation()
  const visible = moneyEvents.slice(0, 3)

  return (
    <section
      aria-labelledby="recent-title"
      className="rounded-[24px] bg-card p-5 shadow-[0_8px_26px_rgba(0,0,0,0.045)] sm:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 id="recent-title" className="section-title text-xl font-semibold sm:text-2xl">
            {t('dashboard.sections.recent.title')}
          </h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {subtitle || t('dashboard.sections.recent.subtitle')}
          </p>
        </div>
        <Link
          to="/events"
          className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-medium text-[hsl(var(--accent))] transition hover:bg-[hsla(var(--accent),0.06)]"
        >
          {t('common.view')}
          <ChevronRight className="size-4" strokeWidth={1.8} />
        </Link>
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {t('dashboard.sections.recent.empty')}
        </p>
      ) : (
        <div className="divide-y divide-[hsl(var(--border))]">
          {visible.map((event) => {
            const Icon = event.type?.startsWith('asset') ? TrendingUp : Landmark
            // `title` was dropped from money events — the note now labels the
            // event, falling back to its translated category when empty.
            const label =
              event.note?.trim() ||
              t(`options.eventCategory.${event.category}`, { defaultValue: event.category })
            return (
              <Link
                key={event.id ?? `${label}-${event.date}`}
                to="/events"
                className="group flex min-h-[72px] w-full items-center gap-4 py-3.5 text-left transition hover:opacity-75"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))]">
                  <Icon
                    className="size-5 text-[hsl(var(--muted-foreground))]"
                    strokeWidth={1.8}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{label}</span>
                  <span className="mt-1 block text-sm text-[hsl(var(--muted-foreground))]">
                    {event.date}
                  </span>
                </span>
                <span
                  className={cn(
                    'shrink-0 text-sm font-semibold',
                    event.amount >= 0
                      ? 'text-[hsl(var(--status-green))]'
                      : 'text-[hsl(var(--status-orange))]',
                  )}
                >
                  {formatVndSigned(event.amount)}
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-[hsl(var(--muted-foreground))]"
                  strokeWidth={1.8}
                />
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
