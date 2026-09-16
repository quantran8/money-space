import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { LineChart } from 'react-native-gifted-charts'

import type { GoalMonthProgress } from '@money-space/core/features/goals/api/goals.repository'
import {
  hasProjectedDate,
  type GoalProjection,
} from '@money-space/core/features/goals/model/goal-projection.types'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'

import { Collapsible, Label, Panel, PanelHeader, StatusChip, Sunk } from '@/components/ui'
import { formatGoalMonth, isRealDate } from '@/features/goals/lib/goal-dates'
import { colors } from '@/theme/tokens'

import type { StatusTone } from '@/components/ui'

/**
 * "Đường tới mục tiêu" — is this pace going to get there in time?
 *
 * ## The figure leads, the chart follows
 *
 * The headline is a number (how far from plan, right now) and a date (when this
 * pace lands) — both computed on the server and read straight off `projection`.
 * `RoadChart` below adds the SHAPE those two cannot carry: whether the gap has
 * been widening or closing. It renders only with ≥2 closed months, so a goal
 * with nothing to compare shows the figures alone.
 *
 * The `vsPlan` figure is derived from the same monthly points the chart plots —
 * the last closed month's `gap`, which core already computes.
 *
 * ## What must not drift
 *
 * A projected date is shown **only** when `hasProjectedDate()` allows it. With
 * no declared pace there is no honest date, and inventing one from past
 * behaviour would be a guess presented as a fact.
 *
 * Being behind is `--attention`, never `--alert`: a savings pace falling short
 * is information, not a fault.
 */
export function GoalRoadSection({
  target,
  remaining,
  projection,
  plannedMonthly,
  months,
  targetDate,
  locale,
}: {
  target: number
  remaining: number
  projection?: GoalProjection
  plannedMonthly?: number | null
  months: GoalMonthProgress[]
  targetDate?: string
  locale: string
}) {
  const { t } = useTranslation()

  const pace = plannedMonthly != null && plannedMonthly > 0 ? plannedMonthly : null
  const hasDate = Boolean(projection && hasProjectedDate(projection))
  const noDate = t('goals.detail.road.noDate')
  const projectedLabel = hasDate
    ? formatGoalMonth(projection?.projectedCompletionDate, locale, noDate)
    : null
  const desiredLabel = isRealDate(targetDate)
    ? formatGoalMonth(targetDate, locale, noDate)
    : null

  const requiredMonthly = projection?.requiredMonthlyContributionForTargetDate
  const gapMonths = projection?.paceGapMonths ?? null

  // How far the household sits from the plan, at the last month that CLOSED.
  // The running month is excluded: it is unfinished, and reporting a partial
  // month as a shortfall is the verdict this product does not deliver.
  const lastClosed = [...months].reverse().find((month) => !month.inProgress && month.gap !== null)
  const gapAtNow = lastClosed?.gap ?? null

  const verdict = paceVerdict({ t, gapMonths, hasDeadline: Boolean(desiredLabel), remaining })

  return (
    <Panel>
      <PanelHeader title={t('goals.detail.road.title')} />

      <View className="mt-5">
        {verdict ? <StatusChip label={verdict.label} tone={verdict.tone} /> : null}

        {/* The gap against plan, when there is a closed month to measure it
            from. This is the chart's headline stated as a figure. */}
        {gapAtNow !== null ? (
          <View className="mt-5">
            <Label>{t('goals.detail.road.vsPlan')}</Label>
            <Text
              className={`mt-1.5 t-metric ${gapAtNow < 0 ? 'text-attention-ink' : 'text-ink'}`}
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {gapAtNow >= 0 ? '+' : '−'}
              {formatVndScale(Math.abs(gapAtNow))}
            </Text>
            <Text className="mt-1 t-caption-sm text-ink3">
              {gapAtNow < 0
                ? t('goals.detail.road.behindWord')
                : t('goals.detail.road.aheadWord')}
              {' · '}
              {t('goals.detail.road.plannedLine')}
            </Text>
          </View>
        ) : (
          <Text className="mt-4 t-body-sm leading-6 text-ink2">
            {pace != null && projectedLabel
              ? `${t('goals.detail.road.perMonth', { amount: formatVndScale(pace) })} → ${projectedLabel}.`
              : t('goals.detail.road.noPaceConclusion')}
          </Text>
        )}

        {/* The shape behind the figure above: what was actually held each month
            against the pace the household declared. */}
        <RoadChart months={months} target={target} pace={pace} />

        {/* The date, and what it would take to move it. Kept apart from the
            figure above: what is held now and what is being aimed at are two
            kinds of number and must never read as one series. */}
        <View className="mt-6">
          <Label>{t('goals.detail.road.atCurrentPace')}</Label>
          <Text
            className={`mt-1.5 t-subtitle text-ink ${projectedLabel ? 'font-mono' : ''}`}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {projectedLabel ?? noDate}
          </Text>
          {requiredMonthly != null && requiredMonthly > 0 && desiredLabel ? (
            <Text className="mt-1.5 t-caption leading-4 text-ink3">
              {t('goals.detail.road.toBeOnTime', { date: desiredLabel })}
              {' · '}
              {t('goals.detail.road.perMonth', { amount: formatVndScale(requiredMonthly) })}
            </Text>
          ) : null}
        </View>

        {/* Every derived number has to be explainable. Folded away because it
            is working, not answer — but always one tap from the figure. */}
        <Collapsible
          className="mt-6"
          summary={<Text className="t-body-sm text-action">{t('goals.detail.road.explain')}</Text>}
          showLabel={t('goals.detail.road.explain')}
          hideLabel={t('goals.detail.road.hide')}
        >
          <Sunk>
            <Text className="t-caption leading-5 text-ink2">
              <Text className="font-medium text-ink">{t('goals.detail.road.calcTitle')}</Text>{' '}
              {pace != null
                ? t('goals.detail.road.calc', {
                    remaining: formatVndScale(remaining),
                    pace: formatVndScale(pace),
                  })
                : t('goals.detail.road.calcNoPace', { remaining: formatVndScale(remaining) })}
            </Text>
            <Text className="mt-2 t-caption leading-5 text-ink2">
              {t('goals.detail.road.calcLines')}
            </Text>
            {projection ? (
              <Text className="mt-2 t-caption leading-5 text-ink2">
                {t(`goals.projection.reason.${projection.reason}`)}
              </Text>
            ) : null}
            <Text className="mt-2 t-caption leading-5 text-ink3">
              {t('goals.detail.road.targetValue')}: {formatVndScale(target)}
            </Text>
          </Sunk>
        </Collapsible>
      </View>
    </Panel>
  )
}

/**
 * The one-line verdict.
 *
 * `paceGapMonths` is positive when the projection lands LATER than the target
 * date. A goal already covered says so and stops — "chậm 0 tháng" on a finished
 * goal is a sentence nobody needs.
 */
function paceVerdict({
  t,
  gapMonths,
  hasDeadline,
  remaining,
}: {
  t: (key: string, params?: Record<string, unknown>) => string
  gapMonths: number | null
  hasDeadline: boolean
  remaining: number
}): { label: string; tone: StatusTone } | null {
  if (remaining <= 0) {
    return { label: t('goals.detail.road.complete'), tone: 'positive' }
  }
  if (!hasDeadline) {
    return { label: t('goals.detail.road.noDeadline'), tone: 'neutral' }
  }
  if (gapMonths === null) return null
  if (gapMonths > 0) {
    return { label: t('goals.detail.road.lateBy', { count: gapMonths }), tone: 'attention' }
  }
  if (gapMonths < 0) {
    return {
      label: t('goals.detail.road.earlyBy', { count: Math.abs(gapMonths) }),
      tone: 'positive',
    }
  }
  return { label: t('goals.detail.road.onTime'), tone: 'positive' }
}

/** The well's plotting height. Two lines need room to separate. */
const CHART_HEIGHT = 148

/** At most this many months are plotted; older ones compress into noise. */
const MAX_POINTS = 14

/**
 * Actual progress against the declared plan.
 *
 * Renders ONLY with ≥2 closed months (§9): one point is not a trend, and a
 * chart drawn to look financial is what the chart rules forbid. The figure
 * above already carries the headline, so this adds the SHAPE or nothing.
 *
 * Actual is `--data-primary`; the plan is `--committed` and dashed — a plan is
 * not a measurement, and the dash is what says so without a legend. The plan
 * line is straight by construction (a declared rate compounds linearly), so it
 * takes no curve, and the actual line is drawn straight too: this library
 * offers only a cardinal spline, which overshoots a local extreme and would
 * draw a month the household never had.
 */
function RoadChart({
  months,
  target,
  pace,
}: {
  months: GoalMonthProgress[]
  target: number
  pace: number | null
}) {
  const { t } = useTranslation()

  // Closed months only: a running month is partial, and plotting it makes the
  // last segment read as a fall.
  const closed = months.filter((month) => !month.inProgress).slice(-MAX_POINTS)
  if (closed.length < 2) return null

  const actual = closed.map((month) => month.endAmount)
  // The plan rises at the declared rate from where the record starts. Without a
  // declared pace there is no plan to draw — inferring one from past behaviour
  // would present a guess as a fact.
  const plan =
    pace != null ? closed.map((_, index) => actual[0] + pace * index) : null

  // The target is in frame so "how far along" stays readable; without it two
  // lines near each other fill the well and say nothing about the distance left.
  const peak = Math.max(...actual, ...(plan ?? []), target, 1)

  const last = actual[actual.length - 1]
  const lastPlanned = plan ? plan[plan.length - 1] : 0

  return (
    <View className="mt-6">
      <View
        accessibilityRole="image"
        // §9: a chart owes a text reading to anyone who cannot see the shape.
        // The no-pace variant exists because a goal with no declared rate has
        // no plan line to describe.
        accessibilityLabel={
          plan != null
            ? t('goals.detail.road.chartAriaCompare', {
                current: formatVndScale(last),
                // The same two words the figure above uses, so the reading and
                // the sighted headline never disagree.
                state:
                  last < lastPlanned
                    ? t('goals.detail.road.behindWord')
                    : t('goals.detail.road.aheadWord'),
                gap: formatVndScale(Math.abs(last - lastPlanned)),
                month: monthTick(closed[closed.length - 1].month),
                target: formatVndScale(target),
              })
            : t('goals.detail.road.chartAriaNoPace', {
                current: formatVndScale(last),
                target: formatVndScale(target),
              })
        }
      >
        <LineChart
          data={actual.map((value) => ({ value }))}
          data2={plan ? plan.map((value) => ({ value })) : undefined}
          height={CHART_HEIGHT}
          maxValue={peak}
          color={colors.dataPrimary}
          color2={colors.committed}
          thickness={2}
          thickness2={1.5}
          strokeDashArray2={[4, 4]}
          hideDataPoints
          adjustToWidth
          initialSpacing={0}
          endSpacing={0}
          hideRules
          hideYAxisText
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={colors.divider}
          isAnimated={false}
          disableScroll
        />
      </View>

      {/* Two labelled ends rather than a tick scale: at this width a full axis
          is overlapping numbers, and the endpoints are what gets compared. */}
      <View className="mt-1.5 flex-row items-center justify-between">
        <Text className="font-mono t-caption-sm text-ink3">
          {monthTick(closed[0].month)}
        </Text>
        <Text className="font-mono t-caption-sm text-ink3">
          {monthTick(closed[closed.length - 1].month)}
        </Text>
      </View>
    </View>
  )
}

/** `08/26` — ASCII, so the mono face is safe. */
function monthTick(month: string): string {
  const [year, monthPart] = month.split('-')
  return year && monthPart ? `${monthPart}/${year.slice(2)}` : month
}
