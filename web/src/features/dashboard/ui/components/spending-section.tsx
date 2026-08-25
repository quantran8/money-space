import { ArrowDownLeft, ArrowUpRight, History } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Panel, PanelHeader } from '@/components/ui/panel'
import type { EventsSummaryResponse } from '@money-space/core/features/events/api/events.repository'
import type { MoneyEventItem } from '@money-space/core/features/events/model/events.types'
import { formatVndCellSigned, formatVndScale } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

/**
 * Home section 3 — Chi tiêu tháng này.
 *
 * What has ALREADY moved this month, as its own card rather than as a strip
 * inside the 30-day section. The two were folded together while the recorded
 * figures were context for the forecast; separated, each says one thing: this
 * card is the month that happened, §12.2 is the month that is coming.
 *
 * The two totals are the answer and the rows underneath are the evidence — a
 * household that reads "−21,6 tr" and wants to know what that was made of
 * should not have to leave Home to see the last few movements. It stops at
 * three: past that this becomes the Events page, which is where the full
 * ledger lives (§2.14).
 *
 * Deliberately no "ròng" figure: thu minus chi is the same fact a third time,
 * and §2.10 gives a number one place on a page.
 *
 * Nothing here attributes a movement to a person. The rows name WHAT was
 * recorded, never who recorded it (§0.2, §16.4).
 */
export function SpendingSection({
  summary,
  recentEvents,
  asOfDate,
}: {
  /** Backend aggregate for the month. Omitted → the card renders nothing. */
  summary?: EventsSummaryResponse
  /** The newest recorded movements, already sorted and capped by the hook. */
  recentEvents: MoneyEventItem[]
  /** Today, per the forecast — the month is only recorded up to here. */
  asOfDate: string
}) {
  const { t } = useTranslation()

  // Two zeroes would state that nothing moved this month, which is a different
  // claim from not knowing (§23).
  if (!summary) return null

  return (
    <Panel className="h-full">
      <PanelHeader
        title={t('home.spending.title')}
        meta={t('home.spending.meta', { date: formatDayMonth(asOfDate) })}
      />

      <div className="mt-7 grid gap-7 sm:grid-cols-2 sm:gap-8">
        <SpendingTotal
          icon={ArrowDownLeft}
          label={t('home.spending.income')}
          value={formatVndScale(summary.totalIncome)}
          tone="text-positive-ink"
          disc="bg-positive/15"
        />
        <SpendingTotal
          icon={ArrowUpRight}
          label={t('home.spending.outcome')}
          value={formatVndScale(-summary.totalOutcome)}
          tone="text-alert-ink"
          disc="bg-alert/15"
        />
      </div>

      {recentEvents.length > 0 ? (
        <div className="mt-8">
          <h3 className="flex items-center gap-2 t-subtitle">
            <History className="size-4 shrink-0 text-ink2" strokeWidth={1.7} aria-hidden />
            {t('home.spending.recent')}
          </h3>

          <ul className="mt-2">
            {recentEvents.map((event, index) => (
              <li
                key={event.id ?? `${event.isoDate}-${index}`}
                className={cn(
                  'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3',
                  index > 0 && 'border-t border-divider',
                )}
              >
                <span className="num w-10 shrink-0 font-mono t-caption-sm text-ink3">
                  {formatDayMonth(event.isoDate)}
                </span>
                <div className="min-w-0">
                  {/* The note is what the household actually wrote; the type is
                      the fallback when they wrote nothing, so a row is never
                      blank. */}
                  <p className="truncate t-body-sm font-medium">
                    {event.note || t(`options.eventType.${event.type}`)}
                  </p>
                  {event.category ? (
                    <p className="truncate t-caption text-ink2">
                      {/* Categories are enum-like, so they resolve through a
                          keyed lookup and fall back to the raw value for a
                          household's own custom category. */}
                      {t(`options.eventCategory.${event.category}`, {
                        defaultValue: event.category,
                      })}
                    </p>
                  ) : null}
                </div>
                {/* `amount` arrives already signed (inflow > 0), so the sign is
                    the data's, not something re-derived from `direction`. */}
                <span
                  className={cn(
                    'num shrink-0 t-body-sm font-medium',
                    event.amount > 0 ? 'text-positive-ink' : 'text-alert-ink',
                  )}
                >
                  {formatVndCellSigned(event.amount)}{' '}
                  <span className="font-mono t-caption-sm text-ink3">
                    {t('units.million')}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <Link
            to="/events"
            className="mt-3 inline-flex min-h-11 items-center t-body-sm font-medium text-action"
          >
            {t('home.spending.viewAll')}
          </Link>
        </div>
      ) : null}
    </Panel>
  )
}

function SpendingTotal({
  icon: Icon,
  label,
  value,
  tone,
  disc,
}: {
  icon: typeof ArrowDownLeft
  label: string
  value: string
  /** Text-safe ink tone for the figure and the glyph. */
  tone: string
  /** The tinted disc behind the glyph — the fill colour at low alpha. */
  disc: string
}) {
  return (
    <div className="flex items-start gap-4">
      {/* A tinted disc, so the two directions are told apart before either
          figure is read. Decorative — the label names the direction (§24). */}
      <span
        className={cn(
          'mt-1 flex size-10 shrink-0 items-center justify-center rounded-pill',
          disc,
        )}
        aria-hidden
      >
        <Icon className={cn('size-5', tone)} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="t-body-sm font-medium">{label}</p>
        {/* `formatVndScale` carries its own unit ("21,6 tr"), so no unit span
            is appended here — that would print it twice (§10.4). */}
        <p
          className={cn(
            'num mt-1 t-figure leading-[1.06]',
            tone,
          )}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

/** "24/08" — mono-safe ASCII, per §10.1. */
function formatDayMonth(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}` : isoDate
}
