import { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Panel, PanelHeader, Sunk } from '@/components/ui/panel'
import type { GoalMonthProgress } from '@money-space/core/features/goals/api/goals.repository'
import type { GoalProjection } from '@money-space/core/features/goals/model/goal-projection.types'
import { hasProjectedDate } from '@money-space/core/features/goals/model/goal-projection.types'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

type GoalRoadSectionProps = {
  current: number
  target: number
  remaining: number
  projection: GoalProjection | undefined
  plannedMonthly: number | null | undefined
  /** The goal's own history — the ACTUAL line. Empty until snapshots exist. */
  months: GoalMonthProgress[]
  /** `YYYY-MM-DD`, month-precision. `'No deadline'` is the legacy empty marker. */
  targetDate: string | undefined
  /** Renders a `YYYY-MM-DD` as `MM/YYYY` in the active locale. */
  formatDate: (value: string | undefined) => string
}

/**
 * "Đường tới mục tiêu" — the plan and the reality, on one timeline.
 *
 * The question a household asks here is a comparison — *are we keeping up?* —
 * and a comparison is what a chart answers in one glance. So this draws two
 * lines against the same months:
 *
 *  - **Thực tế** — where the goal actually stood at each month's close, taken
 *    from the frozen snapshots (`endAmount`). It stops at the current month,
 *    because that is where the record stops. Drawing it further would be
 *    forecasting dressed up as history.
 *  - **Theo kế hoạch** — where the declared pace says the goal should have been
 *    in those same months, and where it will be in the months ahead. It runs
 *    from the goal's starting point to the target.
 *
 * The gap between the two AT THE CURRENT MONTH is the answer, so it is drawn
 * explicitly: a dashed connector and the figure beside it. Earlier attempts drew
 * only forward-looking rays from today, which could show a pace but never
 * whether it had been kept.
 *
 * Being behind is drawn in `--attention`, never `--alert`: a savings pace
 * falling short is information, not a fault (design.md §16).
 */
export function GoalRoadSection({
  current,
  target,
  remaining,
  projection,
  plannedMonthly,
  months,
  targetDate,
  formatDate,
}: GoalRoadSectionProps) {
  const { t } = useTranslation()
  const [explainOpen, setExplainOpen] = useState(false)

  const pace = plannedMonthly != null && plannedMonthly > 0 ? plannedMonthly : null
  const projectedIso =
    projection && hasProjectedDate(projection)
      ? (projection.projectedCompletionDate ?? undefined)
      : undefined
  const desiredIso = targetDate && targetDate !== 'No deadline' ? targetDate : undefined
  const requiredMonthly = projection?.requiredMonthlyContributionForTargetDate
  const gapMonths = projection?.paceGapMonths ?? null

  const chart = useMemo(
    () => buildChart({ current, target, pace, months, projectedIso, desiredIso }),
    [current, target, pace, months, projectedIso, desiredIso],
  )

  const paceLabel =
    pace != null ? t('goals.detail.road.perMonth', { amount: formatVndScale(pace) }) : null
  const projectedLabel = projectedIso ? formatDate(projectedIso) : null
  const desiredLabel = desiredIso ? formatDate(desiredIso) : null

  return (
    <Panel>
      <PanelHeader
        title={t('goals.detail.road.title')}
        action={
          <button
            type="button"
            className="min-h-11 text-[13px] font-medium text-accent"
            onClick={() => setExplainOpen((open) => !open)}
            aria-expanded={explainOpen}
          >
            {explainOpen ? t('goals.detail.road.hide') : t('goals.detail.road.explain')}
          </button>
        }
      />

      <div className="mt-7 grid gap-x-14 gap-y-9 lg:grid-cols-[minmax(0,300px)_1fr]">
        {/* The answer in words on the left, the same answer as a shape on the
            right. `PanelSplit`'s order (§7.2): answer first. */}
        <div className="flex min-w-0 flex-col justify-center">
          <PaceVerdict
            gapMonths={gapMonths}
            hasDeadline={Boolean(desiredIso)}
            remaining={remaining}
          />

          {/* How far the actual line sits from the plan line right now. This is
              the chart's headline, so it is stated as a figure too. */}
          {chart.gapAtNow !== null ? (
            <div className="mt-5">
              <p className="label-vi">{t('goals.detail.road.vsPlan')}</p>
              <div
                className={cn(
                  'money-number mt-2 text-[30px]',
                  chart.gapAtNow < 0 && 'text-attention',
                )}
              >
                {chart.gapAtNow >= 0 ? '+' : '−'}
                {formatVndScale(Math.abs(chart.gapAtNow))}
              </div>
              <p className="mt-1 text-[12px] text-ink3">{chart.nowLabel}</p>
            </div>
          ) : (
            <p className="mt-4 text-[14px] leading-7 text-ink2">
              {paceLabel && projectedLabel ? (
                <Trans
                  i18nKey="goals.detail.road.conclusion"
                  values={{ pace: paceLabel, date: projectedLabel }}
                  components={[
                    <strong key="pace" className="num font-medium text-ink" />,
                    <strong key="date" className="num font-medium text-ink" />,
                  ]}
                />
              ) : (
                t('goals.detail.road.noPaceConclusion')
              )}
            </p>
          )}

          <div className="mt-7">
            <p className="label-vi">{t('goals.detail.road.atCurrentPace')}</p>
            <p className="money-number mt-2 font-mono text-[20px]">
              {projectedLabel ?? t('goals.detail.road.noDate')}
            </p>
            {requiredMonthly != null && requiredMonthly > 0 && desiredLabel ? (
              <p className="mt-2 text-[12px] text-ink3">
                {t('goals.detail.road.toBeOnTime', { date: desiredLabel })}
                {' · '}
                {t('goals.detail.road.perMonth', { amount: formatVndScale(requiredMonthly) })}
              </p>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 rounded-sunk bg-sunk p-3 sm:p-5">
          <div className="mb-1 flex flex-wrap items-center justify-end gap-x-5 gap-y-2 px-1 text-[10px] text-ink3">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-accent" />
              {t('goals.detail.road.actualLine')}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-[2px] w-5 rounded-full bg-protect" />
              {t('goals.detail.road.plannedLine')}
            </span>
          </div>

          <RoadChart
            chart={chart}
            ariaLabel={
              chart.gapAtNow !== null
                ? t('goals.detail.road.chartAriaCompare', {
                    current: formatVndScale(current),
                    month: chart.nowLabel,
                    gap: formatVndScale(Math.abs(chart.gapAtNow)),
                    state:
                      chart.gapAtNow < 0
                        ? t('goals.detail.road.behindWord')
                        : t('goals.detail.road.aheadWord'),
                    target: formatVndScale(target),
                  })
                : t('goals.detail.road.chartAriaNoPace', {
                    current: formatVndScale(current),
                    target: formatVndScale(target),
                  })
            }
          />

          {/* Snapshots only start when the goal does, so an eight-month-old
              household has eight months of line and no more. Saying so stops a
              short actual line reading as a gap in the saving. */}
          {chart.actual.length < 2 ? (
            <p className="mt-2 px-1 text-[11px] text-ink3">
              {t('goals.detail.road.notEnoughHistory')}
            </p>
          ) : null}
        </div>
      </div>

      {/* Every projected number has to be explainable (design.md §16). */}
      {explainOpen ? (
        <Sunk className="mt-5 px-4 py-4 text-[13px] leading-6 text-ink2">
          <span className="font-medium text-ink">{t('goals.detail.road.calcTitle')}</span>{' '}
          {pace != null
            ? t('goals.detail.road.calc', {
                remaining: formatVndScale(remaining),
                pace: formatVndScale(pace),
              })
            : t('goals.detail.road.calcNoPace', { remaining: formatVndScale(remaining) })}
          <span className="mt-2 block">{t('goals.detail.road.calcLines')}</span>
          {projection ? (
            <span className="mt-2 block">{t(`goals.projection.reason.${projection.reason}`)}</span>
          ) : null}
        </Sunk>
      ) : null}
    </Panel>
  )
}

/**
 * The one-line verdict above the conclusion.
 *
 * `paceGapMonths` is positive when the projection lands LATER than the target
 * date. A goal already covered says so and stops — "chậm 0 tháng" on a finished
 * goal is a sentence nobody needs.
 */
function PaceVerdict({
  gapMonths,
  hasDeadline,
  remaining,
}: {
  gapMonths: number | null
  hasDeadline: boolean
  remaining: number
}) {
  const { t } = useTranslation()

  if (remaining <= 0) {
    return <Badge tone="accent" label={t('goals.detail.road.complete')} />
  }
  if (!hasDeadline) {
    return <Badge tone="muted" label={t('goals.detail.road.noDeadline')} />
  }
  if (gapMonths === null) return null
  if (gapMonths > 0) {
    return <Badge tone="attention" label={t('goals.detail.road.lateBy', { count: gapMonths })} />
  }
  if (gapMonths < 0) {
    return (
      <Badge tone="accent" label={t('goals.detail.road.earlyBy', { count: Math.abs(gapMonths) })} />
    )
  }
  return <Badge tone="accent" label={t('goals.detail.road.onTime')} />
}

function Badge({ tone, label }: { tone: 'accent' | 'attention' | 'muted'; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-[12px] font-medium',
        tone === 'attention' && 'text-attention',
        tone === 'accent' && 'text-accent',
        tone === 'muted' && 'text-ink2',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          tone === 'attention' && 'bg-attention',
          tone === 'accent' && 'bg-accent',
          tone === 'muted' && 'bg-protect',
        )}
      />
      {label}
    </span>
  )
}

/** Chart geometry in the 760×270 viewBox the section draws into. */
const VIEW = { width: 760, height: 270 }
const PLOT = { left: 46, right: 726, top: 34, bottom: 205 }
/** How many months of plan to draw past the target, so the line has somewhere to end. */
const MAX_POINTS = 14

type Point = { x: number; y: number; month: string; value: number }

type ChartModel = {
  /** Where the goal actually stood, month by month. Stops at the current month. */
  actual: Point[]
  /** Where the declared pace says it should be, across the whole timeline. */
  plan: Point[]
  /** Plan minus actual at the current month; null when either side is unknown. */
  gapAtNow: number | null
  /** The current month's point on each line, for the delta connector. */
  nowActual: Point | null
  nowPlan: Point | null
  nowLabel: string
  /** Horizontal guides, top to bottom, with their axis figures. */
  guides: { y: number; label: string }[]
  /** Which months get an x-axis tick. */
  ticks: { x: number; label: string }[]
  /**
   * One entry per month on the timeline, carrying whatever each line has there.
   * This is what a hover or a tap resolves to — a MONTH, not a dot, so the
   * pointer does not have to find a 4px circle.
   */
  columns: {
    month: string
    label: string
    x: number
    actual: number | null
    plan: number | null
  }[]
  /** Half the gap between columns — the hit area's reach on each side. */
  columnWidth: number
  /** The y scale itself, so a selected value maps back exactly as it was drawn. */
  yAt: (value: number) => number
}

/**
 * Lay both lines out on one shared timeline.
 *
 * The x axis runs from the first month on record (or this month, for a goal with
 * no history yet) to whichever comes later — the target date or the projected
 * completion. Both lines are plotted against the SAME months, which is the only
 * way the vertical distance between them means anything.
 *
 * The y axis runs 0 → target, so "the top of the chart" is always the goal.
 */
function buildChart({
  current,
  target,
  pace,
  months,
  projectedIso,
  desiredIso,
}: {
  current: number
  target: number
  pace: number | null
  months: GoalMonthProgress[]
  projectedIso: string | undefined
  desiredIso: string | undefined
}): ChartModel {
  // Only months that actually closed with a figure. `endAmount` is total
  // progress at that close — market value included — which is the same quantity
  // the headline figure reports, so the line ends where the hero says it should.
  const history = months.filter((month) => Number.isFinite(month.endAmount))
  const firstMonth = history[0]?.month ?? monthKey(startOfThisMonth())
  const nowMonth = monthKey(startOfThisMonth())

  const lastMonth = [desiredIso, projectedIso]
    .filter((iso): iso is string => Boolean(iso))
    .map((iso) => iso.slice(0, 7))
    .reduce((latest, month) => (month > latest ? month : latest), nowMonth)

  const timeline = monthRange(firstMonth, lastMonth).slice(0, MAX_POINTS)
  const span = Math.max(timeline.length - 1, 1)
  const top = Math.max(target, current, 1)

  const xAt = (index: number) =>
    PLOT.left + (index / span) * (PLOT.right - PLOT.left)
  const yAt = (value: number) =>
    PLOT.bottom - (Math.min(Math.max(value, 0), top) / top) * (PLOT.bottom - PLOT.top)

  const byMonth = new Map(history.map((month) => [month.month, month]))
  // The plan starts where the goal did — the first month on record — and climbs
  // by the declared pace. Without a pace there is no plan line to draw, and
  // inventing a slope would be a guess drawn as a fact.
  const planStart = history[0]?.endAmount ?? current
  const actual: Point[] = []
  const plan: Point[] = []

  timeline.forEach((month, index) => {
    if (pace != null) {
      const planned = Math.min(planStart + pace * index, top)
      plan.push({ x: xAt(index), y: yAt(planned), month, value: planned })
    }
    const record = byMonth.get(month)
    // The actual line stops at the current month: past it there is no record,
    // and continuing it would be a forecast pretending to be history.
    if (record && month <= nowMonth) {
      actual.push({
        x: xAt(index),
        y: yAt(record.endAmount),
        month,
        value: record.endAmount,
      })
    }
  })

  const nowActual = actual.find((point) => point.month === nowMonth) ?? actual.at(-1) ?? null
  const nowPlan = nowActual ? (plan.find((point) => point.month === nowActual.month) ?? null) : null
  const gapAtNow = nowActual && nowPlan ? nowActual.value - nowPlan.value : null

  // Four guides, evenly spaced, labelled in millions — enough to read a level
  // off the chart without turning it into a grid.
  const guides = [0, 1, 2, 3].map((step) => {
    const value = top * (1 - step / 3)
    return { y: yAt(value), label: shortMillions(value) }
  })

  // At most six ticks, so the labels never collide on a narrow well.
  const step = Math.max(1, Math.ceil(timeline.length / 6))
  const ticks = timeline
    .map((month, index) => ({ month, index }))
    .filter(({ index }) => index % step === 0 || index === timeline.length - 1)
    .map(({ month, index }) => ({ x: xAt(index), label: shortMonth(month) }))

  const actualByMonth = new Map(actual.map((point) => [point.month, point.value]))
  const planByMonth = new Map(plan.map((point) => [point.month, point.value]))
  const columns = timeline.map((month, index) => ({
    month,
    label: shortMonth(month),
    x: xAt(index),
    actual: actualByMonth.get(month) ?? null,
    plan: planByMonth.get(month) ?? null,
  }))

  return {
    actual,
    plan,
    gapAtNow,
    nowActual,
    nowPlan,
    nowLabel: shortMonth(nowActual?.month ?? nowMonth),
    guides,
    ticks,
    columns,
    columnWidth: (PLOT.right - PLOT.left) / span / 2,
    yAt,
  }
}

/**
 * The chart, with a month readable on hover or tap.
 *
 * The hit areas are full-height COLUMNS, one per month, not the dots — asking a
 * pointer to land on a 4px circle (and a fingertip to do it at all) would make
 * the detail effectively unreachable. Anywhere in a month's column selects it.
 *
 * `pointer-events` stay off everything else so the lines never swallow a hover
 * meant for the column behind them.
 */
function RoadChart({ chart, ariaLabel }: { chart: ChartModel; ariaLabel: string }) {
  const { t } = useTranslation()
  const { actual, plan, guides, ticks, nowActual, nowPlan, gapAtNow, columns, columnWidth } = chart
  const [selected, setSelected] = useState<string | null>(null)

  const active = columns.find((column) => column.month === selected) ?? null

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      className="h-auto w-full touch-manipulation"
      role="img"
      aria-label={ariaLabel}
      onMouseLeave={() => setSelected(null)}
    >
      {guides.map((guide, index) => (
        <g key={guide.y}>
          <line
            x1={PLOT.left}
            y1={guide.y}
            x2={PLOT.right}
            y2={guide.y}
            // The target line is the one that matters, so it alone is solid.
            stroke={index === 0 ? 'var(--committed)' : 'var(--hair)'}
            strokeWidth={1}
          />
          <ChartText x={PLOT.left - 12} y={guide.y + 4} anchor="end">
            {guide.label}
          </ChartText>
        </g>
      ))}

      {plan.length > 1 ? (
        <polyline
          points={plan.map((point) => `${point.x},${point.y}`).join(' ')}
          fill="none"
          stroke="var(--protect)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}

      {actual.length > 1 ? (
        <polyline
          points={actual.map((point) => `${point.x},${point.y}`).join(' ')}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}

      {plan.map((point) => (
        <circle key={`p-${point.month}`} cx={point.x} cy={point.y} r={3.5} fill="var(--protect)" />
      ))}
      {actual.map((point, index) => (
        <circle
          key={`a-${point.month}`}
          cx={point.x}
          cy={point.y}
          // The latest actual point is where the household is standing.
          r={index === actual.length - 1 ? 6 : 4}
          fill="var(--accent)"
        />
      ))}

      {/* The gap at the current month, drawn as a connector between the two
          lines. This is the chart's whole point, so it is labelled. */}
      {nowActual && nowPlan && gapAtNow !== null && Math.abs(nowActual.y - nowPlan.y) > 6 ? (
        <>
          <line
            x1={nowActual.x}
            y1={nowPlan.y}
            x2={nowActual.x}
            y2={nowActual.y}
            stroke="var(--attention)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          <ChartTag
            x={nowActual.x}
            y={(nowActual.y + nowPlan.y) / 2}
            fill="var(--attention)"
            label={`${gapAtNow >= 0 ? '+' : '−'}${shortMillions(Math.abs(gapAtNow))} tr`}
          />
        </>
      ) : null}

      {ticks.map((tick) => (
        <ChartText key={tick.x} x={tick.x} y={247} anchor="middle">
          {tick.label}
        </ChartText>
      ))}

      {/* The selected month: a rule down the chart and a ring on each line that
          has a value there, so the eye lands on what the readout describes. */}
      {active ? (
        <g pointerEvents="none">
          <line
            x1={active.x}
            y1={PLOT.top - 8}
            x2={active.x}
            y2={PLOT.bottom + 8}
            stroke="var(--protect)"
            strokeWidth={1}
          />
          {active.plan !== null ? (
            <circle
              cx={active.x}
              cy={chart.yAt(active.plan)}
              r={5.5}
              fill="var(--protect)"
              stroke="var(--panel)"
              strokeWidth={2}
            />
          ) : null}
          {active.actual !== null ? (
            <circle
              cx={active.x}
              cy={chart.yAt(active.actual)}
              r={6.5}
              fill="var(--accent)"
              stroke="var(--panel)"
              strokeWidth={2}
            />
          ) : null}
          <Readout column={active} t={t} />
        </g>
      ) : null}

      {/* Hit areas last, so they sit above the lines and win the pointer. */}
      {columns.map((column) => (
        <rect
          key={column.month}
          x={column.x - columnWidth}
          y={PLOT.top - 12}
          width={columnWidth * 2}
          height={PLOT.bottom - PLOT.top + 32}
          fill="transparent"
          className="cursor-pointer"
          onMouseEnter={() => setSelected(column.month)}
          // Tap works where hover does not, and tapping the open month closes it.
          onClick={() => setSelected((value) => (value === column.month ? null : column.month))}
        >
          <title>{column.label}</title>
        </rect>
      ))}
    </svg>
  )
}

/**
 * The values for the selected month, on a plate beside the rule.
 *
 * Flips to the left of the rule near the right edge so it never runs off the
 * chart — the readout has to stay whole to be worth showing.
 */
function Readout({
  column,
  t,
}: {
  column: ChartModel['columns'][number]
  t: (key: string, options?: Record<string, unknown>) => string
}) {
  const width = 168
  const rows = [
    column.actual !== null
      ? { label: t('goals.detail.road.actualLine'), value: column.actual, fill: 'var(--accent)' }
      : null,
    column.plan !== null
      ? { label: t('goals.detail.road.plannedLine'), value: column.plan, fill: 'var(--protect)' }
      : null,
  ].filter((row): row is { label: string; value: number; fill: string } => row !== null)

  const height = 34 + rows.length * 20
  const flip = column.x + width + 16 > PLOT.right
  const x = flip ? column.x - width - 12 : column.x + 12

  return (
    <g pointerEvents="none">
      <rect
        x={x}
        y={PLOT.top}
        width={width}
        height={height}
        rx={8}
        fill="var(--panel)"
        stroke="var(--hair)"
        strokeWidth={1}
      />
      <ChartText x={x + 12} y={PLOT.top + 20} anchor="start" fill="var(--ink)">
        {column.label}
      </ChartText>
      {rows.map((row, index) => (
        <g key={row.label}>
          <circle cx={x + 16} cy={PLOT.top + 36 + index * 20} r={3.5} fill={row.fill} />
          <ChartText x={x + 26} y={PLOT.top + 40 + index * 20} anchor="start" fill="var(--ink2)">
            {row.label}
          </ChartText>
          <ChartText
            x={x + width - 12}
            y={PLOT.top + 40 + index * 20}
            anchor="end"
            fill="var(--ink)"
          >
            {`${shortMillions(row.value)} tr`}
          </ChartText>
        </g>
      ))}
      {/* The gap is the reason both lines are on one chart, so it is stated
          rather than left to be eyeballed. */}
      {rows.length === 2 ? (
        <ChartText
          x={x + width - 12}
          y={PLOT.top + height - 9}
          anchor="end"
          fill={column.actual! < column.plan! ? 'var(--attention)' : 'var(--accent)'}
        >
          {`${column.actual! >= column.plan! ? '+' : '−'}${shortMillions(
            Math.abs(column.actual! - column.plan!),
          )} tr`}
        </ChartText>
      ) : null}
    </g>
  )
}

function ChartText({
  x,
  y,
  anchor,
  fill = 'var(--ink3)',
  children,
}: {
  x: number
  y: number
  anchor: 'start' | 'middle' | 'end'
  fill?: string
  children: React.ReactNode
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={fill}
      fontFamily="IBM Plex Mono, ui-monospace, monospace"
      fontSize={10}
    >
      {children}
    </text>
  )
}

/**
 * A label on a white plate. The plate is what keeps it readable where it sits on
 * top of a line — the chart well is `--sunk`, so plain text on the line itself
 * is not legible.
 */
function ChartTag({ x, y, fill, label }: { x: number; y: number; fill: string; label: string }) {
  const width = Math.max(78, label.length * 7 + 20)
  const clampedX = Math.min(Math.max(x + width / 2 + 10, PLOT.left + width / 2), PLOT.right - width / 2)
  return (
    <>
      <rect x={clampedX - width / 2} y={y - 14} width={width} height={28} rx={7} fill="var(--panel)" />
      <ChartText x={clampedX} y={y + 4} anchor="middle" fill={fill}>
        {label}
      </ChartText>
    </>
  )
}

/** `162000000` → `162` — the axis wants a bare figure, not a formatted amount. */
function shortMillions(value: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(
    Math.round(value / 1_000_000),
  )
}

function startOfThisMonth(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
}

/** `Date` → `'2026-08'`. */
function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

/** `'2026-08'` → `'08/26'`. */
function shortMonth(month: string): string {
  const [year, m] = month.split('-')
  return `${m}/${year.slice(2)}`
}

/** Every month from `from` to `to` inclusive, as `YYYY-MM`. */
function monthRange(from: string, to: string): string[] {
  const [fy, fm] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  const count = (ty - fy) * 12 + (tm - fm)
  if (!Number.isFinite(count) || count < 0) return [from]
  return Array.from({ length: count + 1 }, (_, index) =>
    monthKey(new Date(Date.UTC(fy, fm - 1 + index, 1))),
  )
}
