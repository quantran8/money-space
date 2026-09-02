import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import {
  buildDeltaSeries,
  buildOverdue,
  buildTimelineRows,
  type OverdueSummary,
  type TimelineRow,
} from '@money-space/core/features/dashboard/model/home-derivations'
import type { EventsSummaryResponse } from '@money-space/core/features/events/api/events.repository'
import { canProjectBalance } from '@money-space/core/features/forecast/model/forecast-presentation'
import type { ForecastResult } from '@money-space/core/features/forecast/model/forecast.types'
import {
  formatVndCell,
  formatVndCellSigned,
  formatVndScale,
} from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

import {
  Button,
  GroupedRow,
  Label,
  Money,
  Panel,
  PanelHeader,
  RowMetaMono,
  Sunk,
} from '@/components/ui'
import { CashflowDeltaChart } from '@/features/dashboard/ui/cashflow-delta-chart'
import { formatDayMonth } from '@/features/dashboard/lib/home-dates'
import { TOUCH_TARGET } from '@/theme/tokens'

/**
 * The chart earns its place only once the sequence stops being readable as a
 * list (§9, §2.8). Below this many events the rows below already show the
 * shape, and a five-point line is decoration.
 */
const MIN_EVENTS_FOR_CHART = 6

/**
 * Home section 2 — 30 ngày tới (§12.2).
 *
 * One section, not two: the summary and the events are the same function, so
 * there is deliberately no separate "những khoản sắp tới" block (§2.7).
 *
 * The lowest projected balance leads because it is the one number that says
 * whether the next month works. The web puts it in a left column with a
 * four-column table beside it; on a phone the table becomes grouped rows and
 * the low point sits above them, because §8 forbids a core flow scrolling
 * sideways and the `Còn lại` running balance — the column the section exists
 * for — is the first thing a sideways scroll would hide.
 */
export function UpcomingSection({
  forecast,
  eventsSummary,
  cashflowEvents = [],
  onCompleteOverdue,
  completingEventId,
  onViewTimeline,
  onAddSource,
}: {
  forecast: ForecastResult
  /** Thu/chi already RECORDED this month. Omitted → the block is skipped. */
  eventsSummary?: EventsSummaryResponse
  /** Source events, joined for an overdue row's real due date. */
  cashflowEvents?: { id: string; expectedDate: string }[]
  /** Marks one overdue occurrence resolved. The ONLY way it leaves the list. */
  onCompleteOverdue?: (sourceEventId: string, occurrenceDate: string) => void
  completingEventId?: string | null
  onViewTimeline: () => void
  onAddSource: () => void
}) {
  const { t } = useTranslation()

  const { rows, totalCount } = buildTimelineRows(forecast)
  const { points, lowestIndex } = buildDeltaSeries(forecast)
  const overdue = buildOverdue(forecast, cashflowEvents)

  const lowest = forecast.lowestProjectedBalance
  const dip = forecast.startingLiquidBalance - lowest
  // No wallet means no balance for a low point to be OF. The outflows alone
  // would render as a red deficit against money never claimed.
  const canProject = canProjectBalance(forecast.usableNowAssetCount)

  const showChart = totalCount >= MIN_EVENTS_FOR_CHART && points.length > 1

  return (
    <Panel>
      <PanelHeader
        title={t('home.cashflow.title')}
        right={
          <Pressable
            onPress={onViewTimeline}
            accessibilityRole="button"
            style={{ minHeight: TOUCH_TARGET }}
            className="justify-center active:opacity-70"
          >
            <Text className="t-body-sm font-medium text-action">
              {t('home.upcoming.viewTimeline')}
            </Text>
          </Pressable>
        }
      />

      {/* First, because it is the only thing here waiting on somebody.
          Everything below is a projection; this is a fact about right now, and
          it is already inside those projections (§18). */}
      <OverdueBlock
        overdue={overdue}
        onComplete={onCompleteOverdue}
        onViewAll={onViewTimeline}
        pendingId={completingEventId}
      />

      {/* What already happened, before what is projected — the section then
          reads in the order the household lives it. */}
      <RecordedThisMonth summary={eventsSummary} asOfDate={forecast.asOfDate} />

      <View className="mt-7">
        <View className="flex-row flex-wrap items-baseline justify-between gap-2">
          <Text className="t-body-sm font-medium text-ink">{t('home.upcoming.title')}</Text>
          <Text className="font-mono t-caption-sm text-ink3">
            {t('home.upcoming.meta', {
              range: `${formatDayMonth(forecast.asOfDate)} — ${formatDayMonth(forecast.horizonEndDate)}`,
              count: totalCount,
            })}
          </Text>
        </View>

        <View className="mt-5">
          <Label>{t('home.upcoming.lowestLabel')}</Label>

          {/* MAY BE NEGATIVE — never clamped when it can be stated at all. With
              no wallet there is nothing to state, and "—" reads as zero rather
              than as "not computable" (§23), so it says so in words. */}
          {canProject ? (
            <Money className={cn('mt-2', lowest < 0 && 'text-alert-ink')} step="metric">
              {formatVndScale(lowest)}
            </Money>
          ) : (
            <Text className="mt-2 t-title text-ink2">
              {t('home.upcoming.lowestUnavailable')}
            </Text>
          )}

          <Text className="mt-2 t-body-sm leading-5 text-ink2">
            {!canProject
              ? t('home.upcoming.lowestNoSourceShort')
              : dip > 0
                ? `${t('home.upcoming.lowestNoteDipBefore', {
                    date: formatDayMonth(forecast.lowestProjectedBalanceDate),
                  })} ${formatVndScale(dip)}.`
                : t('home.upcoming.lowestNoteNoDip', {
                    date: formatDayMonth(forecast.lowestProjectedBalanceDate),
                  })}
          </Text>

          {/* The one thing that unblocks the figure above, stated as an action
              rather than as an instruction buried in a sentence (§2.10). */}
          {!canProject ? (
            <Sunk className="mt-4">
              <Text className="t-body-sm leading-5 text-ink2">
                {t('home.upcoming.lowestNoSourceHint')}
              </Text>
              <Button className="mt-3 self-start px-5" variant="secondary" onPress={onAddSource}>
                {t('home.upcoming.addSource')}
              </Button>
            </Sunk>
          ) : null}

          {showChart ? (
            <CashflowDeltaChart
              points={points}
              lowestIndex={lowestIndex}
              label={t('home.upcoming.chartLabel')}
              ariaLabel={t('home.upcoming.chartAria', {
                lowest: formatVndScale(lowest),
                date: formatDayMonth(forecast.lowestProjectedBalanceDate),
                ending: formatVndScale(forecast.endingProjectedBalance),
              })}
            />
          ) : null}
        </View>

        <View className="mt-5">
          {rows.length === 0 ? (
            <Text className="py-2 t-body-sm text-ink2">{t('home.upcoming.empty')}</Text>
          ) : (
            <View className="gap-0.5">
              {rows.map((row) => (
                <TimelineEventRow key={row.key} row={row} />
              ))}
            </View>
          )}

          {/* A column of dashes with no explanation reads as missing data
              rather than as something the household can fix. */}
          {!canProject && rows.length > 0 ? (
            <Text className="mt-3 t-caption leading-5 text-ink3">
              {t('home.upcoming.remainingUnavailable')}
            </Text>
          ) : null}

          {/* Only when the list is actually truncated — "Xem timeline" already
              sits in the header, and the same destination twice is noise. */}
          {totalCount > rows.length ? (
            <Pressable
              onPress={onViewTimeline}
              accessibilityRole="button"
              style={{ minHeight: TOUCH_TARGET }}
              className="justify-center active:opacity-70"
            >
              <Text className="t-body-sm font-medium text-action">
                {t('home.upcoming.more', { count: totalCount - rows.length })}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Panel>
  )
}

/**
 * One event in the sequence.
 *
 * The web's four columns — ngày, khoản, số tiền, còn lại — fold into a grouped
 * row (§8): date and the confirmation marker as the row's meta, the amount as
 * its value, and the running balance underneath as `valueMeta`. That last one
 * is the whole point of the section (§2.7): it turns a list of events into a
 * sequence, so the household reads "where does this leave us" without adding
 * anything up.
 *
 * An occurrence the forecast does not bank shows a dot rather than a figure —
 * folding it in silently would claim more certainty than the data has (§2.16).
 */
function TimelineEventRow({ row }: { row: TimelineRow }) {
  const { t } = useTranslation()

  return (
    <GroupedRow
      title={row.name}
      meta={
        row.unconfirmed ? (
          // The date is ASCII and belongs in mono; the marker is Vietnamese
          // and must not be (§5) — so they are two texts, not one string.
          <View className="flex-row items-center gap-1.5">
            <RowMetaMono>{formatDayMonth(row.date)}</RowMetaMono>
            <Text className="t-caption-sm text-attention-ink">
              {t('home.upcoming.needsConfirm')}
            </Text>
          </View>
        ) : (
          <RowMetaMono>{formatDayMonth(row.date)}</RowMetaMono>
        )
      }
      // Every row states `tr` and the figures stay in triệu throughout, so the
      // column of amounts still compares down the page the way the web's
      // `Số tiền, tr` header made it (§10.4). A row that switched to tỷ would
      // break exactly that comparison.
      value={`${formatVndCellSigned(row.signedAmount)} ${t('units.million')}`}
      valueMeta={
        row.runningBalance === undefined
          ? undefined
          : t('home.upcoming.remainingShort', {
              value: `${formatVndCell(row.runningBalance)} ${t('units.million')}`,
            })
      }
    />
  )
}

/**
 * The month so far: what has ACTUALLY been recorded, as context for the
 * forecast below it.
 *
 * Deliberately quiet. This is the past, and the section's primary answer is
 * "thấp nhất dự kiến" — giving the recorded figures hero weight puts two big
 * numbers above the one number the section exists for.
 *
 * There is no "ròng" figure: vào minus ra is the same fact a third time, and
 * the net result the household acts on is the projected low point below.
 *
 * Renders nothing when the summary is unavailable. Two zeroes would state that
 * nothing moved this month, which is a different claim from not knowing (§23).
 */
function RecordedThisMonth({
  summary,
  asOfDate,
}: {
  summary?: EventsSummaryResponse
  asOfDate: string
}) {
  const { t } = useTranslation()

  if (!summary) return null

  return (
    <Sunk className="mt-6">
      <Label>{t('home.cashflow.recordedEyebrow')}</Label>
      <Text className="mt-1.5 t-body-sm text-ink2">
        {t('home.cashflow.recordedNote', { date: formatDayMonth(asOfDate) })}
      </Text>

      <View className="mt-3.5 flex-row gap-8">
        {/* `formatVndCellSigned` owns the sign, including the real U+2212
            minus (§10.4) — `totalOutcome` arrives positive, so negate it. */}
        <RecordedFigure label={t('home.cashflow.in')} value={summary.totalIncome} />
        <RecordedFigure label={t('home.cashflow.out')} value={-summary.totalOutcome} />
      </View>
    </Sunk>
  )
}

function RecordedFigure({ label, value }: { label: string; value: number }) {
  const { t } = useTranslation()

  return (
    <View>
      <Text className="t-caption text-ink3">{label}</Text>
      <View className="mt-0.5 flex-row items-baseline gap-1">
        <Text
          className="t-subtitle text-ink"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatVndCellSigned(value)}
        </Text>
        {/* §10.4 — the unit is stated beside the figure, not baked into it. */}
        <Text className="font-mono t-caption-sm text-ink3">{t('units.million')}</Text>
      </View>
    </View>
  )
}

/**
 * Overdue items, inside §12.2 rather than as a section of their own.
 *
 * They belong here because they are the same sequence: an item that came due
 * before today has not gone anywhere — it is still owed, still inside
 * `startingLiquidBalance` and everything projected from it. A separate panel
 * would imply a second, parallel pot of money.
 *
 * What the product never does is resolve one automatically. Marking an item
 * done is always a button somebody presses (§18), which is exactly why this
 * block has to exist: without it the low point above reads as settled when part
 * of it is still waiting on the household.
 *
 * Amber, never red (§5.2). Nothing here is a shortfall, and a household can
 * have perfectly good reasons an item is still open — the block states what is
 * waiting and what it comes to, and never says what anyone should do.
 */
function OverdueBlock({
  overdue,
  onComplete,
  onViewAll,
  pendingId,
}: {
  overdue: OverdueSummary
  onComplete?: (sourceEventId: string, occurrenceDate: string) => void
  onViewAll: () => void
  pendingId?: string | null
}) {
  const { t } = useTranslation()

  if (overdue.totalCount === 0) return null

  return (
    <View className="mt-6 rounded-control bg-attention-soft p-4">
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="t-body-sm font-medium text-attention-ink">
          {t('home.upcoming.overdue.title')}
        </Text>
        <Pressable
          onPress={onViewAll}
          accessibilityRole="button"
          style={{ minHeight: TOUCH_TARGET }}
          className="justify-center active:opacity-70"
        >
          <Text className="t-body-sm font-medium text-attention-ink">
            {t('home.upcoming.overdue.viewAll')}
          </Text>
        </Pressable>
      </View>

      <Text className="t-body-sm font-medium text-attention-ink">
        {overdue.oldestDays === undefined
          ? t('home.upcoming.overdue.count', { count: overdue.totalCount })
          : t('home.upcoming.overdue.summary', {
              count: overdue.totalCount,
              days: overdue.oldestDays,
            })}
      </Text>

      <Text className="mt-2 t-caption leading-5 text-ink2">
        {t('home.upcoming.overdue.note')}
      </Text>

      <View className="mt-3 gap-2">
        {overdue.rows.map((row) => (
          <View key={row.key}>
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <Text className="t-body-sm font-medium text-ink" numberOfLines={2}>
                  {row.name}
                </Text>
                {/* When it FELL DUE, not the day it is listed under. Absent
                    when the source event is not loaded — better no date than
                    today's, which would read as "due today". */}
                {row.dueDate ? (
                  <Text className="mt-0.5 font-mono t-caption-sm text-attention-ink">
                    {formatDayMonth(row.dueDate)}
                  </Text>
                ) : null}
              </View>

              <Text
                className="t-body-sm font-medium text-ink"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatVndCellSigned(row.signedAmount)} {t('units.million')}
              </Text>
            </View>

            {onComplete ? (
              <Pressable
                // `row.date` — day 0 — is the idempotency key the API expects,
                // NOT `row.dueDate`, which is only what is shown (§18).
                onPress={
                  pendingId === row.sourceEventId
                    ? undefined
                    : () => onComplete(row.sourceEventId, row.date)
                }
                accessibilityRole="button"
                accessibilityState={{ busy: pendingId === row.sourceEventId }}
                style={{ minHeight: TOUCH_TARGET }}
                className="mt-1 justify-center self-start active:opacity-70"
              >
                <Text className="t-body-sm font-medium text-attention-ink">
                  {pendingId === row.sourceEventId
                    ? t('home.upcoming.overdue.marking')
                    : t('home.upcoming.overdue.markDone')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      {overdue.totalCount > overdue.rows.length ? (
        <Text className="mt-2 t-caption text-ink2">
          {t('home.upcoming.overdue.more', {
            count: overdue.totalCount - overdue.rows.length,
          })}
        </Text>
      ) : null}
    </View>
  )
}
