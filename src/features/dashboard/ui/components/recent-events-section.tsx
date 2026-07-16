import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { MoneyEventItem } from '@/features/events/model/events.types'
import { formatVndSigned } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type RecentEventsSectionProps = {
  moneyEvents: MoneyEventItem[]
  subtitle: string
}

const GRID = 'md:grid-cols-[110px_1.4fr_0.8fr_0.75fr_90px]'

/**
 * "Biến động gần đây" (mockup `#recent`): a table of the money events that move
 * the overall picture. Renders as columns on desktop and stacks on mobile.
 * Events carry no explicit updater, so the trailing avatar is a neutral marker.
 */
export function RecentEventsSection({ moneyEvents, subtitle }: RecentEventsSectionProps) {
  const { t } = useTranslation()
  const visible = moneyEvents.slice(0, 4)

  const relatedLabel = (event: MoneyEventItem) =>
    event.assetName?.trim() ||
    t(`options.eventCategory.${event.category}`, { defaultValue: event.category })

  return (
    <section
      aria-labelledby="recent-title"
      className="rounded-[28px] border border-border bg-card p-6 apple-shadow-soft"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('dashboard.redesign.events.eyebrow')}
          </p>
          <h3 id="recent-title" className="section-title mt-1 text-xl font-semibold">
            {t('dashboard.redesign.events.title')}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            {subtitle || t('dashboard.redesign.events.subtitle')}
          </p>
        </div>
        <Link
          to="/events"
          className="text-left text-sm font-medium text-[hsl(var(--muted-foreground))] transition hover:text-foreground sm:text-right"
        >
          {t('dashboard.redesign.events.history')}
        </Link>
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {t('dashboard.redesign.events.empty')}
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border">
          <div
            className={cn(
              'hidden gap-4 border-b border-border bg-[hsl(var(--muted))] px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] md:grid',
              GRID,
            )}
          >
            <span>{t('dashboard.redesign.events.col.time')}</span>
            <span>{t('dashboard.redesign.events.col.event')}</span>
            <span>{t('dashboard.redesign.events.col.related')}</span>
            <span>{t('dashboard.redesign.events.col.change')}</span>
            <span className="text-right">{t('dashboard.redesign.events.col.by')}</span>
          </div>

          <div className="divide-y divide-border">
            {visible.map((event) => {
              const label =
                event.note?.trim() ||
                t(`options.eventCategory.${event.category}`, { defaultValue: event.category })
              const related = relatedLabel(event)
              return (
                <div
                  key={event.id ?? `${label}-${event.date}`}
                  className={cn('grid gap-3 px-4 py-4 md:items-center md:gap-4', GRID)}
                >
                  <div>
                    <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                      {event.date}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] md:hidden">
                      {related}
                    </p>
                  </div>
                  <p className="hidden text-sm text-[hsl(var(--muted-foreground))] md:block">
                    {related}
                  </p>
                  <p
                    className={cn(
                      'money-number text-sm',
                      event.direction === 'inflow'
                        ? 'text-[hsl(var(--status-green))]'
                        : event.direction === 'outflow'
                          ? 'text-foreground'
                          : 'text-[hsl(var(--muted-foreground))]',
                    )}
                  >
                    {event.direction === 'neutral' ? formatVndSigned(event.amount).replace(/^\+/, '') : formatVndSigned(event.amount)}
                  </p>
                  <div className="flex items-center md:justify-end">
                    <div
                      className="size-7 rounded-full bg-[hsl(var(--muted))]"
                      aria-hidden
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
