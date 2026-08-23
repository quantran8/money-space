import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { GoalMonthProgress } from '@money-space/core/features/goals/api/goals.repository'
import {
  hasProjectedDate,
  type GoalProjection,
} from '@money-space/core/features/goals/model/goal-projection.types'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'

import { Collapsible, Label, Panel, PanelHeader, StatusChip, Sunk } from '@/components/ui'
import { formatGoalMonth, isRealDate } from '@/features/goals/lib/goal-dates'

import type { StatusTone } from '@/components/ui'

/**
 * "Đường tới mục tiêu" — is this pace going to get there in time?
 *
 * ## What was left behind, and why
 *
 * The web draws two lines on an SVG chart: the goal's actual frozen history
 * against a plan line rising at the declared pace, with the gap between them at
 * the current month called out. That chart is 400 lines of geometry, and on a
 * 375pt screen it is a thumbnail — the two lines converge into one smudge well
 * before the axis labels become unreadable.
 *
 * The chart's headline was never the shape, though. It was one number (how far
 * from plan, right now) and one date (when this pace lands). Both are computed
 * on the server and handed over in `projection`, so both survive the move
 * intact; only the drawing is gone. §9 of the chart rules says as much: render
 * a chart when it answers better than a list, and here it does not.
 *
 * The `vsPlan` figure is the one thing the chart supplied that the projection
 * does not, so it is derived from the same monthly points the chart used — the
 * last closed month's `gap`, which core already computes.
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
              className={`mt-1.5 text-[30px] font-medium ${gapAtNow < 0 ? 'text-attention' : 'text-ink'}`}
              style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.9 }}
            >
              {gapAtNow >= 0 ? '+' : '−'}
              {formatVndScale(Math.abs(gapAtNow))}
            </Text>
            <Text className="mt-1 text-[11px] text-ink3">
              {gapAtNow < 0
                ? t('goals.detail.road.behindWord')
                : t('goals.detail.road.aheadWord')}
              {' · '}
              {t('goals.detail.road.plannedLine')}
            </Text>
          </View>
        ) : (
          <Text className="mt-4 text-[14px] leading-6 text-ink2">
            {pace != null && projectedLabel
              ? `${t('goals.detail.road.perMonth', { amount: formatVndScale(pace) })} → ${projectedLabel}.`
              : t('goals.detail.road.noPaceConclusion')}
          </Text>
        )}

        {/* The date, and what it would take to move it. Kept apart from the
            figure above: what is held now and what is being aimed at are two
            kinds of number and must never read as one series. */}
        <View className="mt-6">
          <Label>{t('goals.detail.road.atCurrentPace')}</Label>
          <Text
            className={`mt-1.5 text-[20px] font-medium text-ink ${projectedLabel ? 'font-mono' : ''}`}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {projectedLabel ?? noDate}
          </Text>
          {requiredMonthly != null && requiredMonthly > 0 && desiredLabel ? (
            <Text className="mt-1.5 text-[12px] leading-4 text-ink3">
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
          summary={<Text className="text-[14px] text-interactive">{t('goals.detail.road.explain')}</Text>}
          showLabel={t('goals.detail.road.explain')}
          hideLabel={t('goals.detail.road.hide')}
        >
          <Sunk>
            <Text className="text-[12px] leading-5 text-ink2">
              <Text className="font-medium text-ink">{t('goals.detail.road.calcTitle')}</Text>{' '}
              {pace != null
                ? t('goals.detail.road.calc', {
                    remaining: formatVndScale(remaining),
                    pace: formatVndScale(pace),
                  })
                : t('goals.detail.road.calcNoPace', { remaining: formatVndScale(remaining) })}
            </Text>
            <Text className="mt-2 text-[12px] leading-5 text-ink2">
              {t('goals.detail.road.calcLines')}
            </Text>
            {projection ? (
              <Text className="mt-2 text-[12px] leading-5 text-ink2">
                {t(`goals.projection.reason.${projection.reason}`)}
              </Text>
            ) : null}
            <Text className="mt-2 text-[12px] leading-5 text-ink3">
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
    return { label: t('goals.detail.road.complete'), tone: 'interactive' }
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
      tone: 'interactive',
    }
  }
  return { label: t('goals.detail.road.onTime'), tone: 'interactive' }
}
