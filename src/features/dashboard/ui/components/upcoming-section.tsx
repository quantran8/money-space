import { Loader2 } from 'lucide-react'
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

import { Label, Panel, PanelHeader, PanelSplit, Sunk } from '@/components/ui/panel'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  buildDeltaSeries,
  buildOverdue,
  buildTimelineRows,
  type DeltaPoint,
  type OverdueSummary,
  type TimelineRow,
} from '@/features/dashboard/model/home-derivations'
import type { EventsSummaryResponse } from '@/features/events/api/events.repository'
import type { ForecastResult } from '@/features/forecast/model/forecast.types'
import { canProjectBalance } from '@/features/forecast/model/forecast-presentation'
import { chartAxis, chartGrid, chartSeparator } from '@/shared/constants/colors'
import { formatVndCell, formatVndCellSigned, formatVndScale } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

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
 * there is deliberately no separate "Những khoản sắp tới" block (§2.7).
 *
 * The lowest projected balance leads because it is the one number that says
 * whether the next month works. The table's `Còn lại` column carries the
 * running balance — that column is what turns a list of events into a sequence.
 */
export function UpcomingSection({
  forecast,
  eventsSummary,
  cashflowEvents = [],
  onCompleteOverdue,
  completingEventId,
}: {
  forecast: ForecastResult
  /** Thu/chi/ròng already RECORDED this month. Omitted → the block is skipped. */
  eventsSummary?: EventsSummaryResponse
  /** Source events, joined for an overdue row's real due date (`expectedDate`). */
  cashflowEvents?: { id: string; expectedDate: string }[]
  /** Marks one overdue occurrence resolved. The ONLY way it leaves the list. */
  onCompleteOverdue?: (sourceEventId: string, occurrenceDate: string) => void
  /** The overdue row currently being confirmed, for its button's spinner. */
  completingEventId?: string | null
}) {
  const { t } = useTranslation()

  const { rows, totalCount } = buildTimelineRows(forecast)
  const { points, lowestIndex } = buildDeltaSeries(forecast)
  const overdue = buildOverdue(forecast, cashflowEvents)

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
          <Link
            to="/upcoming"
            className="inline-flex min-h-11 shrink-0 items-center text-[13px] font-medium text-accent"
          >
            {t('home.upcoming.viewTimeline')}
          </Link>
        }
      />

      {/* First and full width, because it is the only thing here that is
          waiting on somebody. Everything below is a projection; this is a fact
          about right now, and it is already inside those projections (§18). */}
      <OverdueBlock
        overdue={overdue}
        onComplete={onCompleteOverdue}
        pendingId={completingEventId}
      />

      {/* What already happened, before what is projected. The section then
          reads in the order the household lives it: money that moved this
          month → what that came to → what is still coming (§12.2). */}
      <RecordedThisMonth summary={eventsSummary} asOfDate={forecast.asOfDate} />

      <div className="mt-9">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="text-[14px] font-medium">{t('home.upcoming.title')}</h3>
          <p className="font-mono text-[11px] text-ink3">
            {t('home.upcoming.meta', {
              range: `${formatDayMonth(forecast.asOfDate)} — ${formatDayMonth(forecast.horizonEndDate)}`,
              count: totalCount,
            })}
          </p>
        </div>

        <PanelSplit className="mt-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div>
            <Label>{t('home.upcoming.lowestLabel')}</Label>

          {/* MAY BE NEGATIVE — never clamped when it can be stated at all.
              With no wallet there is nothing to state, and an em-dash reads as
              "zero" rather than "not computable" (§23) — so it says so. */}
          <p
            className={cn(
              'mt-3 text-[30px] font-medium tracking-[-.03em]',
              canProject && 'num',
              canProject && lowest < 0 && 'text-alert',
            )}
          >
            {canProject ? formatVndScale(lowest) : t('home.upcoming.lowestUnavailable')}
          </p>

          <p className="mt-3 text-[13px] leading-5 text-ink2">
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
          </p>

          {/* The one thing that unblocks the figure above, stated as an action
              rather than as an instruction buried in a sentence (§2.10). */}
          {!canProject ? (
            <Sunk className="mt-5 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-[6px] size-1.5 shrink-0 rounded-full bg-attention" />
                <div className="min-w-0">
                  <p className="text-[13px] leading-5 text-ink2">
                    {t('home.upcoming.lowestNoSourceHint')}
                  </p>
                  <Link
                    to="/networth"
                    className="mt-3 inline-flex h-9 items-center rounded-control bg-accent px-4 text-[13px] font-medium text-panel transition-opacity hover:opacity-90"
                  >
                    {t('home.upcoming.addSource')}
                  </Link>
                </div>
              </div>
            </Sunk>
          ) : null}

          {showChart ? (
            <Sunk className="mt-6 p-4">
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
            </Sunk>
          ) : null}
        </div>

        <div>
          {rows.length === 0 ? (
            <p className="py-6 text-[13px] text-ink2">{t('home.upcoming.empty')}</p>
          ) : (
            <>
              {/* A real <table> with a real <thead> (§24) — now the shared
                  `Table` primitive, so this list is built the same way as every
                  other one rather than re-declaring the same markup. */}
              <div className="-mx-2.5 hidden lg:block">
                <Table className="text-[13px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {/* `.label-vi`: accented Vietnamese headings (§10.1). */}
                      <TableHead className="label-vi">{t('home.upcoming.column.date')}</TableHead>
                      <TableHead className="label-vi">{t('home.upcoming.column.item')}</TableHead>
                      {/* §10.4: the unit is declared ONCE here, not repeated
                          in every cell. */}
                      <TableHead className="label-vi text-right">
                        {t('home.upcoming.column.amountUnit')}
                      </TableHead>
                      <TableHead className="label-vi text-right">
                        {t('home.upcoming.column.remainingUnit')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.key}>
                        <TableCell className="font-mono text-[11px] whitespace-nowrap text-ink3">
                          {formatDayMonth(row.date)}
                        </TableCell>
                        <TableCell>
                          {row.name}
                          {row.unconfirmed ? (
                            <span className="ml-2 font-mono text-[11px] text-attention">
                              {t('home.upcoming.needsConfirm')}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'num text-right whitespace-nowrap',
                            row.signedAmount > 0 && 'text-accent',
                          )}
                        >
                          {formatVndCellSigned(row.signedAmount)}
                        </TableCell>
                        <TableCell className="num text-right whitespace-nowrap text-ink2">
                          {row.runningBalance === undefined
                            ? '·'
                            : formatVndCell(row.runningBalance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Below lg the four columns stop fitting, and a horizontally
                  scrolled table hides the running balance — the one column the
                  section exists for. Each event becomes its own block instead. */}
              <div className="space-y-2 lg:hidden">
                {rows.map((row) => (
                  <TimelineCard key={row.key} row={row} />
                ))}
              </div>
            </>
          )}

          {/* The "Còn lại" column is dashes without a wallet, and a column of
              dashes with no explanation reads as missing data rather than as a
              thing the household can fix. */}
          {!canProject && rows.length > 0 ? (
            <p className="mt-3 text-[12px] leading-5 text-ink3">
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
                className="inline-flex min-h-11 items-center text-[13px] font-medium text-accent"
              >
                {t('home.upcoming.more', { count: totalCount - rows.length })}
              </Link>
            </div>
          ) : null}
        </div>
        </PanelSplit>
      </div>
    </Panel>
  )
}

/**
 * The month so far: what has ACTUALLY been recorded, as context for the
 * forecast below it.
 *
 * Deliberately quiet. This is the past, and the section's primary answer is
 * "thấp nhất dự kiến" — giving the recorded figures hero weight put three
 * 26px numbers above the one number the section exists for, and the eye landed
 * on the wrong thing (§1.2, §2.8). A sunk strip with 20px figures reads as
 * ngữ cảnh, which is what it is.
 *
 * There is no "Ròng" figure: vào minus ra is the same fact a third time, and
 * §2.10 allows a number one place on a page. The net result the household
 * actually acts on is the projected low point below.
 *
 * Figures come from the backend's money-events summary, never re-derived here.
 * Renders nothing when the summary is unavailable — two zeroes would state that
 * nothing moved this month, which is a different claim from not knowing (§23).
 */
function RecordedThisMonth({
  summary,
  asOfDate,
}: {
  summary?: EventsSummaryResponse
  /** Today, per the forecast — the month is only recorded up to here. */
  asOfDate: string
}) {
  const { t } = useTranslation()

  if (!summary) return null

  return (
    <Sunk className="mt-7 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Label>{t('home.cashflow.recordedEyebrow')}</Label>
          <p className="mt-2 text-[13px] text-ink2">
            {t('home.cashflow.recordedNote', { date: formatDayMonth(asOfDate) })}
          </p>
        </div>

        <div className="flex items-baseline gap-7 sm:gap-10">
          {/* `formatVndCellSigned` owns the sign, including the real U+2212
              minus (§10.4) — `totalOutcome` arrives positive, so negate it. */}
          <Figure
            label={t('home.cashflow.in')}
            value={formatVndCellSigned(summary.totalIncome)}
            valueClassName="text-accent"
          />
          <Figure
            label={t('home.cashflow.out')}
            value={formatVndCellSigned(-summary.totalOutcome)}
          />
        </div>
      </div>
    </Sunk>
  )
}

function Figure({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  const { t } = useTranslation()

  return (
    <div>
      <p className="text-[12px] text-ink3">{label}</p>
      <p className={cn('num mt-1 text-[20px] font-medium', valueClassName)}>
        {value}{' '}
        {/* §10.4 — the unit is stated once, beside the figure, not baked into it. */}
        <span className="font-mono text-[11px] font-normal text-ink3">
          {t('units.million')}
        </span>
      </p>
    </div>
  )
}

/**
 * Overdue items, inside §12.2 rather than as a section of their own.
 *
 * They belong here because they are the same sequence: an item that came due
 * before today has not gone anywhere — it is still owed, still inside
 * `startingLiquidBalance` and everything projected from it, and it keeps
 * counting toward what is upcoming. Splitting it into a separate panel would
 * imply a second, parallel pot of money.
 *
 * What the product never does is resolve one automatically. Marking an item
 * done is always a button somebody presses (§18), which is exactly why this
 * block has to exist: without it the lowest-balance figure above reads as
 * settled when part of it is still waiting on the household.
 *
 * Amber, never red (§5.2, §25). Nothing here is a shortfall, and a household
 * can have perfectly good reasons an item is still open — the block states what
 * is waiting and what it comes to, and never says what anyone should do.
 * It renders nothing at all when there is nothing waiting.
 */
function OverdueBlock({
  overdue,
  onComplete,
  pendingId,
}: {
  overdue: OverdueSummary
  onComplete?: (sourceEventId: string, occurrenceDate: string) => void
  /** The row currently being confirmed, so only ITS button shows a spinner. */
  pendingId?: string | null
}) {
  const { t } = useTranslation()

  if (overdue.totalCount === 0) return null

  return (
    <section className="mt-7 rounded-sunk bg-attention-soft px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="label-vi text-attention">{t('home.upcoming.overdue.title')}</p>
          <p className="text-[13px] font-medium text-attention">
            {overdue.oldestDays === undefined
              ? t('home.upcoming.overdue.count', { count: overdue.totalCount })
              : t('home.upcoming.overdue.summary', {
                  count: overdue.totalCount,
                  days: overdue.oldestDays,
                })}
          </p>
        </div>

        <Link
          to="/upcoming"
          className="shrink-0 text-[13px] font-medium text-attention transition-opacity hover:opacity-70"
        >
          {t('home.upcoming.overdue.viewAll')}
        </Link>
      </div>

      <p className="mt-2.5 text-[12px] leading-5 text-ink2">
        {t('home.upcoming.overdue.note')}
      </p>

      <ul className="mt-3 space-y-1">
        {overdue.rows.map((row) => (
          <li
            key={row.key}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-control px-2 py-2.5 sm:grid-cols-[72px_minmax(0,1fr)_auto_auto]"
          >
            {/* When it FELL DUE, not the day it is listed under. Absent when
                the source event is not loaded — better no date than today's. */}
            <span className="order-1 font-mono text-[11px] text-attention sm:order-none">
              {row.dueDate ? formatDayMonth(row.dueDate) : ''}
            </span>

            <span className="order-3 col-span-2 truncate text-[13px] font-medium sm:order-none sm:col-span-1">
              {row.name}
            </span>

            <span
              className={cn(
                'num order-2 text-right text-[13px] font-medium sm:order-none',
                row.signedAmount > 0 && 'text-accent',
              )}
            >
              {formatVndCellSigned(row.signedAmount)} {t('units.million')}
            </span>

            {onComplete ? (
              // A real button, not a text link: this is the one action the
              // block exists to offer, and at link weight it read as a caption
              // beside the amount.
              <button
                type="button"
                // `row.date` — day 0 — is the idempotency key the API expects,
                // NOT `row.dueDate`, which is only what we show (§18).
                onClick={() => onComplete(row.sourceEventId, row.date)}
                disabled={pendingId === row.sourceEventId}
                className="order-4 inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 justify-self-end rounded-control bg-attention px-3 text-[12px] font-medium text-panel transition-opacity hover:opacity-90 disabled:opacity-60 sm:order-none"
              >
                {pendingId === row.sourceEventId ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    {t('home.upcoming.overdue.marking')}
                  </>
                ) : (
                  t('home.upcoming.overdue.markDone')
                )}
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {overdue.totalCount > overdue.rows.length ? (
        <p className="mt-3 px-2 text-[12px] text-ink2">
          {t('home.upcoming.overdue.more', {
            count: overdue.totalCount - overdue.rows.length,
          })}
        </p>
      ) : null}
    </section>
  )
}

function TimelineCard({ row }: { row: TimelineRow }) {
  const { t } = useTranslation()

  return (
    <Sunk className="flex items-start justify-between gap-4 p-3">
      <div className="min-w-0">
        <p className="text-[13px] font-medium">{row.name}</p>
        <p className="mt-1 font-mono text-[11px] text-ink3">
          {formatDayMonth(row.date)}
          {row.unconfirmed ? ` · ${t('home.upcoming.needsConfirm')}` : ''}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn('num text-[13px]', row.signedAmount > 0 && 'text-accent')}>
          {formatVndCellSigned(row.signedAmount)} {t('units.million')}
        </p>
        {row.runningBalance === undefined ? null : (
          <p className="num mt-1 text-[11px] text-ink3">
            {t('home.upcoming.remainingShort', {
              value: `${formatVndCell(row.runningBalance)} ${t('units.million')}`,
            })}
          </p>
        )}
      </div>
    </Sunk>
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
    <div className="mt-3 h-[116px] w-full" role="img" aria-label={ariaLabel}>
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
                  <p className="font-mono text-[11px] text-ink3">{formatDayMonth(point.date)}</p>
                  <p className="num mt-1 text-[13px] font-medium">
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
