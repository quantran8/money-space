import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Panel, PanelHeader } from '@/components/ui/panel'
import {
  CATEGORY_ICON_DEFAULT_COLOR,
  CATEGORY_ICON_FALLBACK,
  CATEGORY_ICONS,
} from '@/features/events/ui/components/category-icon'
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
  categoryVisualById,
  asOfDate,
}: {
  /** Backend aggregate for the month. Omitted → the card renders nothing. */
  summary?: EventsSummaryResponse
  /** The newest recorded movements, already sorted and capped by the hook. */
  recentEvents: MoneyEventItem[]
  /** Category id → its label and disc, so a row here draws the same mark the
   *  Events timeline draws. An event carries only the FK, so the caller
   *  resolves it. */
  categoryVisualById?: Record<
    string,
    { label: string; iconKey: string | null; iconColor: string | null }
  >
  /** Today, per the forecast — the month is only recorded up to here. */
  asOfDate: string
}) {
  const { t } = useTranslation()

  // Two zeroes would state that nothing moved this month, which is a different
  // claim from not knowing (§23) — so the card keeps its place and says which
  // of the two it is, rather than disappearing or rendering 0 đ.
  if (!summary) {
    return (
      <Panel className="h-full">
        <PanelHeader title={t('home.spending.title')} />
        <p className="mt-6 t-body-sm text-ink2">{t('home.spending.unavailable')}</p>
      </Panel>
    )
  }

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
          {/* No glyph beside the heading: the rows below now carry category
              discs, and a second icon on the heading competes with them for
              the same reading. */}
          <h3 className="t-subtitle">{t('home.spending.recent')}</h3>

          <ul className="mt-2">
            {recentEvents.map((event, index) => (
              <RecentEventRow
                key={event.id ?? `${event.isoDate}-${index}`}
                event={event}
                visual={categoryVisualById?.[event.categoryId]}
                isFirst={index === 0}
              />
            ))}
          </ul>

          <Link
            to="/events"
            className="mt-3 inline-flex min-h-11 items-center t-body font-medium text-action"
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

/**
 * One recorded movement, drawn the way the Events timeline draws it
 * (`record-card.tsx`): a category disc, the note over its category, and the
 * signed amount. The two surfaces list the same events, so a row that named a
 * category one way here and another way there would read as two different
 * kinds of record.
 *
 * The date moves into the meta line under the title. As a fixed left column it
 * took the position the disc needs, and on three rows a column of dates earns
 * less than the category identity does.
 */
function RecentEventRow({
  event,
  visual,
  isFirst,
}: {
  event: MoneyEventItem
  visual?: { label: string; iconKey: string | null; iconColor: string | null }
  isFirst: boolean
}) {
  const { t } = useTranslation()
  // Member access, not a helper call — see record-card.tsx for why the lookup
  // is written this way.
  const CategoryIcon = (visual?.iconKey && CATEGORY_ICONS[visual.iconKey]) || CATEGORY_ICON_FALLBACK

  return (
    <li
      className={cn(
        'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3',
        !isFirst && 'border-t border-divider',
      )}
    >
      {/* Category identity lives in the disc fill; the glyph stays white for
          every category, including the fallback state. */}
      <span
        className="grid size-11 shrink-0 place-items-center rounded-pill text-white"
        style={{ backgroundColor: visual?.iconColor ?? CATEGORY_ICON_DEFAULT_COLOR }}
        role="img"
        aria-label={visual?.label ?? undefined}
        title={visual?.label ?? undefined}
      >
        <CategoryIcon className="size-5" strokeWidth={1.75} />
      </span>

      <div className="min-w-0">
        {/* The note is what the household actually wrote; the category label is
            the fallback when they wrote nothing, so a row is never blank — and
            the subtitle then drops rather than printing the same name twice. */}
        <p className="truncate t-body-sm font-medium">
          {event.note || visual?.label || t(`options.eventType.${event.type}`)}
        </p>
        <p className="truncate t-caption text-ink3">
          {event.note && visual?.label
            ? `${formatDayMonth(event.isoDate)} · ${visual.label}`
            : formatDayMonth(event.isoDate)}
        </p>
      </div>

      {/* `amount` arrives already signed (inflow > 0), so the sign is the
          data's, not something re-derived from `direction`. */}
      <span
        className={cn(
          'num shrink-0 t-body-sm font-medium',
          event.amount > 0 ? 'text-positive-ink' : 'text-alert-ink',
        )}
      >
        {formatVndCellSigned(event.amount)}{' '}
        <span className="font-mono t-caption-sm text-ink3">{t('units.million')}</span>
      </span>
    </li>
  )
}

/** "24/08" — mono-safe ASCII, per §10.1. */
function formatDayMonth(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}` : isoDate
}
