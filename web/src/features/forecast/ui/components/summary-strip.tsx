import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Panel } from '@/components/ui/panel'
import type { ForecastResult } from '@money-space/core/features/forecast/model/forecast.types'
import type { RangeSummary } from '@money-space/core/features/forecast/model/forecast-range'
import {
  BALANCE_TONE_CLASS,
  balanceTone,
  canProjectBalance,
} from '@money-space/core/features/forecast/model/forecast-presentation'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

/**
 * The page's answer: the projected low, and the two flows that produce it.
 *
 * One grid, three columns, three rows — label / value / metadata. Every metric
 * occupies the same row in each, so the 40px primary figure and the 28px
 * supporting ones sit on a shared baseline and no column can drift vertically
 * as copy changes length. That is what lets the low point be visibly primary
 * (§32) without the row looking misaligned.
 *
 * The range is NOT restated here. It is set once in the picker above and shown
 * there; repeating it in a section header would be the same fact twice (§34).
 */
export function SummaryStrip({
  forecast,
  summary,
}: {
  forecast: ForecastResult
  /** Figures for the SELECTED window, not the whole fetched horizon. */
  summary: RangeSummary
}) {
  const { t } = useTranslation()

  // `Tiền vào` / `Tiền ra` beside it are unaffected: those are sums of real
  // events and do not depend on a balance existing.
  const hasLiquidSource = canProjectBalance(forecast.usableNowAssetCount)
  const lowestTone = balanceTone(summary.lowest)

  return (
    <Panel>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="t-subtitle">{t('upcoming.summary.title')}</h2>
        <span className="t-caption text-ink3">
          {t('upcoming.timeline.count', {
            count: summary.incomingCount + summary.outgoingCount,
          })}
        </span>
      </div>

      {/* No divider under the heading: the 28px gap is the hierarchy (§9). */}
      <div className="mt-7 grid gap-6 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-8">
        {/* Row 1 — labels. Each sits in a fixed-height box so a one-line and a
            two-line label still leave their values on the same baseline. */}
        <div>
          <p className="mb-2 t-body-sm text-ink2">{t('upcoming.summary.lowest')}</p>
          <p
            className={cn(
              'num t-figure',
              hasLiquidSource ? BALANCE_TONE_CLASS[lowestTone] : 'text-ink',
            )}
          >
            {hasLiquidSource ? formatVndScale(summary.lowest) : '—'}
          </p>
          <p className="num mt-1 t-caption text-ink3">
            {hasLiquidSource
              ? formatDayMonth(summary.lowestDate)
              : t('upcoming.summary.lowestNoSource')}
          </p>
        </div>

        <SummaryFlow
          icon={ArrowDownLeft}
          label={t('upcoming.summary.incoming')}
          value={summary.incoming}
          count={summary.incomingCount}
        />
        <SummaryFlow
          icon={ArrowUpRight}
          label={t('upcoming.summary.outgoing')}
          value={summary.outgoing}
          count={summary.outgoingCount}
        />
      </div>

      {/* The window asked for runs past what can be projected, so the figures
          above describe a shorter period than the label. Said plainly rather
          than left for the reader to infer from a date (§23, §48). */}
      {summary.truncated ? (
        <p className="mt-5 t-caption text-attention-ink">
          {t('upcoming.summary.truncated', {
            date: formatDayMonth(summary.coveredEnd),
          })}
        </p>
      ) : null}
    </Panel>
  )
}

function SummaryFlow({
  icon: Icon,
  label,
  value,
  count,
}: {
  icon: typeof ArrowDownLeft
  label: string
  value: number
  count: number
}) {
  const { t } = useTranslation()

  return (
    <div>
      <p className="mb-2 flex items-center gap-2 t-body-sm text-ink2">
        <Icon className="size-4 shrink-0 text-data-primary" strokeWidth={1.75} aria-hidden />
        {label}
      </p>
      <p className="num t-metric">{formatVndScale(value)}</p>
      <p className="mt-1 t-caption text-ink3">
        {count === 0
          ? t('upcoming.summary.noneKnown')
          : t('upcoming.summary.knownCount', { count })}
      </p>
    </div>
  )
}

/** "24/08" — mono-safe ASCII, per §10.1. */
function formatDayMonth(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}` : isoDate
}
