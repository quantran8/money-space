import { ArrowDownLeft, ArrowUpRight, CalendarClock, Milestone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type XAxisTickContentProps,
} from 'recharts'

import { Label, Panel, PanelHeader, PanelSplit } from '@/components/ui/panel'
import {
  buildDeltaSeries,
  buildTimelineRows,
  type DeltaPoint,
  type TimelineRow,
} from '@money-space/core/features/dashboard/model/home-derivations'
import type { ForecastResult } from '@money-space/core/features/forecast/model/forecast.types'
import { canProjectBalance } from '@money-space/core/features/forecast/model/forecast-presentation'
import { chartAxis, chartGrid, chartSeparator } from '@money-space/core/shared/constants/colors'
import { formatVndCell, formatVndCellSigned, formatVndScale } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

/**
 * The chart earns its place only once the sequence stops being readable as a
 * list. Below this many events the table beside it already shows the shape, and
 * a five-point line is decoration (§2.8).
 */
const MIN_EVENTS_FOR_CHART = 6

/**
 * Home section 2 — Ba mươi ngày tới (§12.2).
 *
 * One section, not two: the summary and the events are the same function, so
 * there is deliberately no separate "Những khoản sắp tới" block (§2.7). What
 * DID split out is the overdue list — see `OverdueSection` for why the same
 * argument does not cover it.
 *
 * The lowest projected balance leads because it is the one number that says
 * whether the next month works. The table's `Còn lại` column carries the
 * running balance — that column is what turns a list of events into a sequence.
 */
export function UpcomingSection({ forecast }: { forecast: ForecastResult }) {
  const { t } = useTranslation()

  const { rows, totalCount } = buildTimelineRows(forecast)
  const { points, lowestIndex } = buildDeltaSeries(forecast)

  const lowest = forecast.lowestProjectedBalance
  const dip = forecast.startingLiquidBalance - lowest
  // No wallet means no balance for a low point to be OF — see
  // `canProjectBalance`. The outflows alone would render as a red deficit
  // against money the household never said it had.
  const canProject = canProjectBalance(forecast.usableNowAssetCount)

  const showChart = totalCount >= MIN_EVENTS_FOR_CHART && points.length > 1

  return (
    <Panel>
      <PanelHeader
        title={t('home.cashflow.title')}
        action={
          <span className="flex shrink-0 items-center gap-4">
            {/* The window every figure in this section is measured over. Mono
                is safe here — a date range has no diacritics (§10.1). */}
            {/* <span className="num font-mono t-caption-sm text-ink3">
              {formatDayMonth(forecast.asOfDate)} — {formatDayMonth(forecast.horizonEndDate)}
            </span> */}
            <Link
              to="/upcoming"
              className="inline-flex min-h-11 items-center t-body font-medium text-action"
            >
              {t('home.upcoming.viewTimeline')}
            </Link>
          </span>
        }
      />

      {/* The recorded half of the month used to sit here as a sunk strip. It is
          now its own card (`SpendingSection`), because the two halves answer
          different questions and folding them together left this section
          leading with the past when it exists to state what is coming. */}

      {/* The range and the count used to be restated here under a second
          heading. Both now sit in the section header, where the title already
          says "30 ngày tới" — repeating them was the same fact twice (§2.10). */}
      <div className="mt-1">
        <PanelSplit className="lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)] lg:gap-x-12">
          <div className="min-w-0">
            {/* The low point is the primary answer of this section, so it now
                leads at hero scale with the two horizon totals beside it — the
                figure says whether the month works, the totals say what drives
                it. They sit on one row because they answer the same question at
                different resolutions (03-patterns §5). */}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
              <div className="min-w-0">
                <Label>{t('home.upcoming.lowestLabel')}</Label>

                {/* MAY BE NEGATIVE — never clamped when it can be stated at all.
                    With no wallet there is nothing to state, and an em-dash reads as
                    "zero" rather than "not computable" (§23) — so it says so. */}
                <p
                  className={cn(
                    'mt-2 t-hero leading-[1.02] tracking-[-.045em]',
                    canProject && 'num',
                    canProject && lowest < 0 && 'text-alert',
                  )}
                >
                  {canProject ? formatVndScale(lowest) : t('home.upcoming.lowestUnavailable')}
                </p>

                {/* The date the figure above belongs to, led by a calendar
                    glyph so "when" is findable without reading the sentence.
                    Decorative: the date follows it in words (§24). */}
                <p className="mt-3 flex items-start gap-1.5 t-body-sm leading-5 text-ink2">
                  {canProject ? (
                    <CalendarClock
                      className="mt-[3px] size-4 shrink-0 text-ink3"
                      strokeWidth={1.7}
                      aria-hidden
                    />
                  ) : null}
                  <span>
                    {!canProject ? (
                      t('home.upcoming.lowestNoSourceShort')
                    ) : dip > 0 ? (
                      <>
                        {t('home.upcoming.lowestNoteDipBefore', {
                          date: formatDayMonth(forecast.lowestProjectedBalanceDate),
                        })}{' '}
                        <span className="num font-medium text-ink">{formatVndScale(dip)}</span>.
                      </>
                    ) : (
                      t('home.upcoming.lowestNoteNoDip', {
                        date: formatDayMonth(forecast.lowestProjectedBalanceDate),
                      })
                    )}
                  </span>
                </p>
              </div>

              <HorizonTotals forecast={forecast} />
            </div>

            {/* The one thing that unblocks the figure above, stated as an action
                rather than as an instruction buried in a sentence (§2.10). */}
            {!canProject ? (
              <div className="mt-6 border-t border-divider pt-4">
                <div className="flex items-start gap-3">
                  <span className="mt-[6px] size-1.5 shrink-0 rounded-full bg-attention" />
                  <div className="min-w-0">
                    <p className="t-body-sm leading-5 text-ink2">
                      {t('home.upcoming.lowestNoSourceHint')}
                    </p>
                    <Link
                      to="/networth"
                      className="mt-3 inline-flex h-11 items-center rounded-control bg-action px-4 t-body font-medium text-panel transition-opacity hover:opacity-90"
                    >
                      {t('home.upcoming.addSource')}
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Now the section's main visual rather than a footnote to it, so
                it gets real height and sits on the card instead of in a wash
                well — a chart this size is content, not a control (§2.4). */}
            {showChart ? (
              <div className="mt-7">
                <Label>{t('home.upcoming.chartLabel')}</Label>
                <CashflowDeltaChart
                  points={points}
                  lowestIndex={lowestIndex}
                  ariaLabel={t('home.upcoming.chartAria', {
                    lowest: formatVndScale(lowest),
                    date: formatDayMonth(forecast.lowestProjectedBalanceDate),
                    ending: formatVndScale(forecast.endingProjectedBalance),
                  })}
                />
              </div>
            ) : null}
          </div>

        <div>
          <h3 className="flex items-center gap-2 t-subtitle">
            <Milestone className="size-4 shrink-0 text-data-primary" strokeWidth={1.7} aria-hidden />
            {t('home.upcoming.sequenceTitle')}
          </h3>

          {rows.length === 0 ? (
            <p className="py-6 t-body-sm text-ink2">{t('home.upcoming.empty')}</p>
          ) : (
            /* A rail, not a table. The column this section exists for is the
               running balance, and at this width four columns squeezed it to
               the point of wrapping. The rail gives each event the full width
               for its name and keeps "còn lại" on its own line underneath,
               where it stays readable — and the connecting line does the work
               the date column used to do, showing these as one sequence rather
               than four unrelated rows. */
            <ol className="relative mt-3 space-y-0 pl-5">
              {/* The thread. Inset top and bottom so it runs BETWEEN the first
                  and last dots rather than past them. */}
              <span
                className="absolute top-2 bottom-4 left-[5px] w-px bg-divider"
                aria-hidden
              />
              {rows.map((row) => (
                <TimelineRailRow key={row.key} row={row} canProject={canProject} />
              ))}
            </ol>
          )}

          {/* The "Còn lại" column is dashes without a wallet, and a column of
              dashes with no explanation reads as missing data rather than as a
              thing the household can fix. */}
          {!canProject && rows.length > 0 ? (
            <p className="mt-3 t-caption leading-5 text-ink3">
              {t('home.upcoming.remainingUnavailable')}
            </p>
          ) : null}

          {/* Only when the table is actually truncated — "Xem timeline" already
              sits in the section header, so an unconditional link here would be
              the same destination offered twice. */}
          {totalCount > rows.length ? (
            <div className="mt-4">
              <Link
                to="/upcoming"
                className="inline-flex min-h-11 items-center t-body font-medium text-action"
              >
                {t('home.upcoming.more', { count: totalCount - rows.length })}
              </Link>
            </div>
          ) : null}

          {/* Overdue items used to sit here, folded shut under the rail. They
              are now their own card above this one (`OverdueSection`): they are
              the only thing on Home waiting on a person, and the figures in
              this section are computed as if they were already settled — so
              they have to be read BEFORE it, not after. */}
        </div>
        </PanelSplit>
      </div>
    </Panel>
  )
}

/**
 * What the horizon is MADE OF: money in and money out over the same 30 days,
 * each with the number of items behind it.
 *
 * It sits beside the low point rather than under it because it decomposes that
 * figure — the dip is the order these two arrive in — and a household reading
 * "thấp nhất 48 triệu" immediately asks what is coming and going to produce it.
 * The counts are what keep each total openable: a single figure with no item
 * count behind it cannot be checked against the table on the right (§2.15).
 *
 * Both totals count only what the forecast BANKS. An estimated inflow or an
 * unconfirmed outflow is listed in the table and marked there, but folding it
 * into a total here would state it as known (§2.16).
 */
function HorizonTotals({ forecast }: { forecast: ForecastResult }) {
  const { t } = useTranslation()

  const counted = forecast.timeline.filter((occurrence) => occurrence.countedInBalance)

  const sum = (direction: 'incoming' | 'outgoing') =>
    counted
      .filter((occurrence) => occurrence.direction === direction)
      .reduce((total, occurrence) => total + occurrence.amount, 0)

  const count = (direction: 'incoming' | 'outgoing') =>
    counted.filter((occurrence) => occurrence.direction === direction).length

  return (
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-1 lg:gap-5">
      {/* Direction carries a colour here because these two figures are read
          AGAINST each other — in versus out — and that is exactly the case
          §5.2 allows a tone for. Ink counterparts, not the fills: a fill-weight
          green fails contrast as text. */}
      <HorizonTotal
        icon={ArrowDownLeft}
        label={t('home.cashflow.in')}
        value={formatVndCellSigned(sum('incoming'))}
        count={count('incoming')}
        tone="text-positive-ink"
      />
      <HorizonTotal
        icon={ArrowUpRight}
        label={t('home.cashflow.out')}
        value={formatVndCellSigned(-sum('outgoing'))}
        count={count('outgoing')}
        tone="text-alert-ink"
      />
    </div>
  )
}

function HorizonTotal({
  icon: Icon,
  label,
  value,
  count,
  tone,
}: {
  icon: typeof ArrowDownLeft
  label: string
  value: string
  count: number
  tone?: string
}) {
  const { t } = useTranslation()

  return (
    <div className="flex min-w-0 items-start gap-3">
      {/* Direction as a glyph, so in and out are told apart before either
          figure is read. Decorative — the label beside it already names the
          direction in words, so it is hidden from AT rather than announced
          twice (§24). */}
      <Icon
        className={cn('mt-0.5 size-4 shrink-0', tone ?? 'text-ink2')}
        strokeWidth={1.8}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="t-caption text-ink3">{label}</p>
        <p className={cn('num mt-0.5 t-metric leading-tight', tone)}>
          {value}{' '}
          {/* §10.4 — the unit is stated once beside the figure, never baked in. */}
          <span className="font-mono t-caption-sm text-ink3">
            {t('units.million')}
          </span>
        </p>
        <p className="mt-1 t-caption text-ink2">
          {t('home.upcoming.horizonCount', { count })}
        </p>
      </div>
    </div>
  )
}

/**
 * One event on the rail: when, what, how much, and what it leaves behind.
 *
 * The dot encodes DIRECTION, not severity — inflow and outflow are facts about
 * the event, and neither is a warning (§5.2). An outflow that happens to create
 * the low point is not marked here: that is stated once, beside the figure it
 * produces, and repeating it as a colour would make an ordinary bill look like
 * a problem the household caused (§16).
 */
function TimelineRailRow({
  row,
  canProject,
}: {
  row: TimelineRow
  /** Without a wallet there is no running balance to state (§23). */
  canProject: boolean
}) {
  const { t } = useTranslation()

  const isInflow = row.signedAmount > 0

  return (
    <li className="relative grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 pb-6 last:pb-0">
      {/* The node. Ringed in the card colour so the thread appears to pass
          behind it rather than stopping at its edge. */}
      <span
        className={cn(
          'absolute top-[5px] -left-5 size-[11px] rounded-full border-[3px] border-card',
          isInflow ? 'bg-positive' : 'bg-data-primary',
        )}
        aria-hidden
      />

      <div className="min-w-0">
        <p className="font-mono t-caption-sm text-ink3">{formatDayMonth(row.date)}</p>
        <p className="mt-0.5 t-body-sm font-medium">{row.name}</p>
        {row.unconfirmed ? (
          <p className="mt-0.5 t-caption text-attention">
            {t('home.upcoming.needsConfirm')}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 pt-4 text-right">
        <p
          className={cn(
            'num t-body-sm font-medium',
            isInflow ? 'text-positive-ink' : 'text-alert-ink',
          )}
        >
          {formatVndCellSigned(row.signedAmount)}{' '}
          <span className="font-mono t-caption-sm text-ink3">
            {t('units.million')}
          </span>
        </p>
        {/* The running balance — the one column this section exists for. */}
        {row.runningBalance === undefined || !canProject ? null : (
          <p className="num mt-1 t-caption-sm whitespace-nowrap text-ink3">
            {t('home.upcoming.remainingShort', {
              value: `${formatVndCell(row.runningBalance)} ${t('units.million')}`,
            })}
          </p>
        )}
      </div>
    </li>
  )
}

/**
 * Thirty days of cash flow, drawn as CHANGE SINCE TODAY (§12.2).
 *
 * Two properties make the shape honest. The baseline is a true zero — today —
 * so the line cannot exaggerate a dip the way an auto-scaled balance axis does,
 * and the reading does not depend on how much money the household happens to
 * hold. And the interpolation is `stepAfter`, because a balance does not drift
 * between events: it holds flat and then moves on the day something is paid.
 * A smoothed curve would draw money leaving the account on days nothing happens.
 */
function CashflowDeltaChart({
  points,
  lowestIndex,
  ariaLabel,
}: {
  points: DeltaPoint[]
  lowestIndex: number
  ariaLabel: string
}) {
  const { t } = useTranslation()

  // Millions, because the axis label declares the unit once (§10.4).
  const data = points.map((point) => ({ ...point, value: point.delta / 1_000_000 }))
  const labels = new Map(data.map((point) => [point.index, formatDayMonth(point.date)]))

  const first = data[0].index
  const last = data[data.length - 1].index
  const middle = data[Math.floor((data.length - 1) / 2)].index

  return (
    <div className="mt-3 h-[190px] w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
          {/* Today. Every point on the line is read against this. */}
          <ReferenceLine y={0} stroke={chartGrid} strokeWidth={1} />

          <XAxis
            dataKey="index"
            type="number"
            domain={['dataMin', 'dataMax']}
            ticks={[first, middle, last]}
            interval={0}
            axisLine={false}
            tickLine={false}
            height={22}
            // The end ticks sit ON the plot edges, so a centred label is half
            // outside the well and renders clipped. They anchor inward instead.
            tick={({ x, y, payload }: XAxisTickContentProps) => {
              const value = Number(payload.value)
              return (
                <text
                  x={x}
                  y={y}
                  dy={6}
                  fill={chartAxis}
                  fontSize={10}
                  fontFamily="IBM Plex Mono, ui-monospace, monospace"
                  textAnchor={value === first ? 'start' : value === last ? 'end' : 'middle'}
                >
                  {labels.get(value) ?? ''}
                </text>
              )
            }}
          />
          <YAxis hide domain={['auto', 'auto']} />

          <Tooltip
            cursor={{ stroke: chartGrid, strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const point = payload[0].payload as (typeof data)[number]
              return (
                <div className="panel px-3 py-2 shadow-sm">
                  <p className="font-mono t-caption-sm text-ink3">{formatDayMonth(point.date)}</p>
                  <p className="num mt-1 t-body-sm font-medium">
                    {point.delta === 0
                      ? t('home.upcoming.chartSameAsToday')
                      : `${formatVndCellSigned(point.delta)} ${t('units.million')}`}
                  </p>
                </div>
              )
            }}
          />

          <Line
            type="stepAfter"
            dataKey="value"
            stroke="var(--ink2)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            isAnimationActive={false}
            dot={(props: { cx?: number; cy?: number; index?: number }) =>
              props.index === lowestIndex && props.cx != null && props.cy != null ? (
                <circle
                  key={`low-${props.index}`}
                  cx={props.cx}
                  cy={props.cy}
                  r={3.5}
                  fill="var(--attention)"
                />
              ) : (
                <g key={`dot-${props.index}`} />
              )
            }
            activeDot={{ r: 3.5, fill: 'var(--ink)', stroke: chartSeparator, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/** "24/08" — mono-safe ASCII, per §10.1. */
function formatDayMonth(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}` : isoDate
}
