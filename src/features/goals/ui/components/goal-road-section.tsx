import { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Panel, PanelHeader, Sunk } from '@/components/ui/panel'
import type { GoalProjection } from '@/features/goals/model/goal-projection.types'
import { hasProjectedDate } from '@/features/goals/model/goal-projection.types'
import { formatVndScale } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type GoalRoadSectionProps = {
  current: number
  target: number
  remaining: number
  projection: GoalProjection | undefined
  plannedMonthly: number | null | undefined
  /** `YYYY-MM-DD`, month-precision. `'No deadline'` is the legacy empty marker. */
  targetDate: string | undefined
  /** Renders a `YYYY-MM-DD` as `MM/YYYY` in the active locale. */
  formatDate: (value: string | undefined) => string
}

/**
 * "Đường tới mục tiêu" — the projection, as a picture and one sentence.
 *
 * The old plan panel stated three numbers side by side and left the household to
 * work out what they meant together. The question they actually ask is a
 * comparison — *is this pace going to get us there in time?* — and a comparison
 * is what a chart answers in one glance: the line they are on against the line
 * they would need. The conclusion card then says it in words, because a chart
 * nobody can restate is decoration.
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
  const desiredIso =
    targetDate && targetDate !== 'No deadline' ? targetDate : undefined
  const requiredMonthly = projection?.requiredMonthlyContributionForTargetDate
  const gapMonths = projection?.paceGapMonths ?? null

  const chart = useMemo(
    () => buildChart({ current, target, projectedIso, desiredIso }),
    [current, target, projectedIso, desiredIso],
  )

  const paceLabel = pace != null ? t('goals.detail.road.perMonth', { amount: formatVndScale(pace) }) : null
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

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)] lg:gap-10">
        <div className="min-w-0 rounded-sunk bg-sunk px-3 pb-3 pt-4 sm:px-5 sm:pt-5">
          <div className="flex items-center justify-between gap-4 px-1">
            <span className="text-[11px] text-ink3">{t('goals.detail.road.targetValue')}</span>
            <span className="num text-[11px] font-medium text-ink2">{formatVndScale(target)}</span>
          </div>

          <RoadChart
            chart={chart}
            paceLabel={paceLabel}
            requiredLabel={
              requiredMonthly != null && requiredMonthly > 0
                ? t('goals.detail.road.perMonth', { amount: formatVndScale(requiredMonthly) })
                : null
            }
            desiredMark={t('goals.detail.road.desiredMark')}
            ariaLabel={
              paceLabel && projectedLabel
                ? t('goals.detail.road.chartAria', {
                    current: formatVndScale(current),
                    pace: formatVndScale(pace ?? 0),
                    target: formatVndScale(target),
                    projected: projectedLabel,
                    desired: desiredLabel ?? t('goals.detail.road.noDeadline'),
                  })
                : t('goals.detail.road.chartAriaNoPace', {
                    current: formatVndScale(current),
                    target: formatVndScale(target),
                  })
            }
          />

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 pb-1 text-[10px] text-ink3">
            <span className="flex items-center gap-2">
              <span className="h-[3px] w-5 rounded-full bg-accent" />
              {t('goals.detail.road.currentPace')}
            </span>
            {chart.needed ? (
              <span className="flex items-center gap-2">
                <span className="w-5 border-t-2 border-dashed border-attention" />
                {t('goals.detail.road.neededPace')}
              </span>
            ) : null}
          </div>
        </div>

        {/* The same conclusion in words. `--accent-soft` because this is the
            section's answer, not a warning — the badge carries the verdict. */}
        <div className="rounded-sunk bg-accent-soft p-5 sm:p-6">
          <PaceVerdict gapMonths={gapMonths} hasDeadline={Boolean(desiredIso)} remaining={remaining} />

          <p className="mt-5 text-[14px] leading-7 text-ink2">
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

          {requiredMonthly != null && requiredMonthly > 0 && desiredLabel ? (
            <div className="mt-6">
              <p className="text-[11px] text-ink3">
                {t('goals.detail.road.toBeOnTime', { date: desiredLabel })}
              </p>
              <p className="money-number mt-1 text-[30px] text-ink">
                {t('goals.detail.road.perMonth', { amount: formatVndScale(requiredMonthly) })}
              </p>
            </div>
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

/** Chart geometry in the 680×260 viewBox the section draws into. */
const VIEW = { width: 680, height: 260 }
const PLOT = { left: 58, right: 644, top: 34, bottom: 176 }

type ChartModel = {
  /** Start and end of the line the current pace is actually on. */
  current: { x1: number; y1: number; x2: number; y2: number } | null
  /** The steeper line that would land on the target date. */
  needed: { x1: number; y1: number; x2: number; y2: number } | null
  /** Where the target date falls on the x axis, when there is one in range. */
  desiredX: number | null
  labels: { start: string; end: string; desired: string | null }
  values: { top: string; bottom: string }
}

/**
 * Lay the two lines out on a shared timeline.
 *
 * The x axis runs from this month to whichever comes later — the projected
 * completion or the target date — so both endpoints are always on screen. When
 * there is no projection (no declared pace) only the needed line is drawn:
 * inventing a slope for a pace nobody set would be a guess drawn as a fact.
 */
function buildChart({
  current,
  target,
  projectedIso,
  desiredIso,
}: {
  current: number
  target: number
  projectedIso: string | undefined
  desiredIso: string | undefined
}): ChartModel {
  const start = startOfThisMonth()
  const projected = projectedIso ? monthIndexFrom(start, projectedIso) : null
  const desired = desiredIso ? monthIndexFrom(start, desiredIso) : null

  // At least one month of span, so a goal landing this month still draws a line
  // rather than collapsing onto a single point.
  const span = Math.max(projected ?? 0, desired ?? 0, 1)
  // A date that has already passed clamps to month 0, which would draw a line
  // with no length and stack both pace tags on the start point. Anything
  // landing at or before this month gets a short visible run instead — the
  // label above it is what carries the meaning, and it needs somewhere to sit.
  const MIN_RUN = 0.12
  const xFor = (months: number) =>
    PLOT.left + Math.min(Math.max(months / span, MIN_RUN), 1) * (PLOT.right - PLOT.left)

  const startY = PLOT.bottom
  const endY = PLOT.top

  return {
    current:
      projected !== null
        ? { x1: PLOT.left, y1: startY, x2: xFor(projected), y2: endY }
        : null,
    // Only worth drawing when it differs from the pace already being kept.
    needed:
      desired !== null && (projected === null || desired < projected)
        ? { x1: PLOT.left, y1: startY, x2: xFor(desired), y2: endY }
        : null,
    desiredX: desired !== null ? xFor(desired) : null,
    labels: {
      start: monthLabel(start),
      end: monthLabel(addMonths(start, span)),
      desired: desiredIso ? monthLabel(new Date(`${desiredIso}T00:00:00Z`)) : null,
    },
    values: { top: shortMillions(target), bottom: shortMillions(current) },
  }
}

function RoadChart({
  chart,
  paceLabel,
  requiredLabel,
  desiredMark,
  ariaLabel,
}: {
  chart: ChartModel
  paceLabel: string | null
  requiredLabel: string | null
  desiredMark: string
  ariaLabel: string
}) {
  const { current, needed, desiredX, labels, values } = chart

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      className="mt-2 h-auto w-full"
      role="img"
      aria-label={ariaLabel}
    >
      {[PLOT.top, (PLOT.top + PLOT.bottom) / 2, PLOT.bottom].map((y) => (
        <line key={y} x1={PLOT.left} y1={y} x2={PLOT.right} y2={y} stroke="var(--committed)" strokeWidth={1} />
      ))}

      {desiredX !== null ? (
        <>
          <line
            x1={desiredX}
            y1={PLOT.top - 10}
            x2={desiredX}
            y2={PLOT.bottom + 14}
            stroke="var(--protect)"
            strokeWidth={1.5}
            strokeDasharray="4 5"
          />
          <ChartText x={desiredX} y={219} anchor="middle">
            {labels.desired}
          </ChartText>
          <ChartText x={desiredX} y={238} anchor="middle" fill="var(--attention)">
            {desiredMark}
          </ChartText>
        </>
      ) : null}

      <ChartText x={PLOT.left} y={219} anchor="start">
        {labels.start}
      </ChartText>
      <ChartText x={PLOT.right} y={219} anchor="end">
        {labels.end}
      </ChartText>

      <ChartText x={PLOT.left - 10} y={PLOT.top + 4} anchor="end">
        {values.top}
      </ChartText>
      <ChartText x={PLOT.left - 10} y={PLOT.bottom + 4} anchor="end">
        {values.bottom}
      </ChartText>

      {current ? (
        <line
          x1={current.x1}
          y1={current.y1}
          x2={current.x2}
          y2={current.y2}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={3}
          strokeLinecap="round"
        />
      ) : null}
      {needed ? (
        <line
          x1={needed.x1}
          y1={needed.y1}
          x2={needed.x2}
          y2={needed.y2}
          fill="none"
          stroke="var(--attention)"
          strokeWidth={2}
          strokeDasharray="5 5"
          strokeLinecap="round"
        />
      ) : null}

      <circle cx={PLOT.left} cy={PLOT.bottom} r={5} fill="var(--accent)" />
      {current ? <circle cx={current.x2} cy={current.y2} r={5} fill="var(--accent)" /> : null}
      {needed ? <circle cx={needed.x2} cy={needed.y2} r={4.5} fill="var(--attention)" /> : null}

      {/* Each pace labelled on its own line, so the two are never read as one. */}
      {current && paceLabel ? (
        <ChartTag
          x={(current.x1 + current.x2) / 2}
          y={(current.y1 + current.y2) / 2}
          fill="var(--accent)"
          label={paceLabel}
        />
      ) : null}
      {needed && requiredLabel ? (
        <ChartTag
          x={(needed.x1 + needed.x2) / 2}
          y={(needed.y1 + needed.y2) / 2 - 18}
          fill="var(--attention)"
          label={requiredLabel}
        />
      ) : null}
    </svg>
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
 * A pace label sitting on top of its own line. The white plate underneath is
 * what keeps it readable where the two lines cross — the chart well is `--sunk`,
 * so plain text on the line itself is not legible.
 */
function ChartTag({ x, y, fill, label }: { x: number; y: number; fill: string; label: string }) {
  const width = Math.max(84, label.length * 7 + 20)
  const clampedX = Math.min(Math.max(x, PLOT.left + width / 2), PLOT.right - width / 2)
  return (
    <>
      <rect x={clampedX - width / 2} y={y - 14} width={width} height={28} rx={8} fill="var(--panel)" />
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

function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
}

/** Whole months from `start` to a `YYYY-MM-DD`; never negative. */
function monthIndexFrom(start: Date, iso: string): number | null {
  const date = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return null
  const months =
    (date.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (date.getUTCMonth() - start.getUTCMonth())
  return Math.max(months, 0)
}

function monthLabel(date: Date): string {
  return `${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`
}
