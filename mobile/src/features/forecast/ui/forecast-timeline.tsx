import { useMemo } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import {
  balanceTone,
  canProjectBalance,
  occurrenceMarkers,
  runningBalancesForDay,
} from '@money-space/core/features/forecast/model/forecast-presentation'
import type {
  ForecastDay,
  ForecastOccurrence,
} from '@money-space/core/features/forecast/model/forecast.types'
import { formatMoney } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

import {
  ActionSheet,
  EmptyState,
  Label,
  Panel,
  PanelHeader,
  Skeleton,
} from '@/components/ui'
import { formatDayMonth, monthKey, monthParts } from '@/features/forecast/lib/forecast-dates'
import { TOUCH_TARGET } from '@/theme/tokens'

import type { ActionSheetItem } from '@/components/ui'

export type ForecastTimelineProps = {
  days: ForecastDay[]
  /** Keyed by `sourceEventId`. Rendered only where an owner carries meaning. */
  ownerNameByEventId?: Record<string, string | undefined>
  isLoading?: boolean
  isEmpty?: boolean
  /** Gates the running-balance line — see `canProjectBalance`. */
  usableNowAssetCount?: number
  /** Opens the create sheet from the empty state. */
  onAdd?: () => void
  /**
   * Row actions. Every one keys off `sourceEventId` — occurrences are virtual,
   * not rows, and PATCHing an `occurrenceKey` 404s (§18). `occurrenceDate` goes
   * with `complete` because it is the idempotency key.
   */
  onComplete?: (occurrence: ForecastOccurrence) => void
  onPostpone?: (occurrence: ForecastOccurrence) => void
  onCancel?: (occurrence: ForecastOccurrence) => void
  onEdit?: (sourceEventId: string) => void
  onDelete?: (sourceEventId: string) => void
}

type TimelineRow = {
  occurrence: ForecastOccurrence
  runningBalance?: number
}

/**
 * The forecast as a sequence (§7: a forecast is a sequence, not a collection).
 *
 * The web renders five columns in a real table. A table does not survive the
 * move to a phone — §8 forbids horizontal scroll on a core flow, and `Còn lại`
 * is the column this screen exists for, so a sideways scroll is exactly what
 * would hide it. Each occurrence therefore becomes a grouped row: date and name
 * left, amount right, and the running balance on its own line under the amount
 * where a column of them still lines up.
 *
 * ## The running balance
 *
 * A running-balance line is what turns a list into a sequence. The API gives a
 * per-DAY closing balance, so `runningBalancesForDay` (core) walks each day's
 * counted occurrences in order to get a per-ROW figure. Two reasons a row can
 * state none, and they mean the same thing to the reader — *this number cannot
 * be stated*:
 *
 *  - per-row: the amount is shown but excluded from the balance
 *    (`countedInBalance` false — an estimated inflow, a planned outflow, a
 *    postponed item);
 *  - household-wide: there is no wallet for a balance to be OF
 *    (`canProjectBalance` false).
 *
 * Either way the row shows `—`, never a fabricated 0. The section-level notice
 * for the second case lives in `ForecastSummary`; a short line under the header
 * repeats the scope here, because the dashes appear here.
 *
 * ## No pagination
 *
 * The web pages at 10 rows. A phone scrolls, and a pager under a 90-day
 * forecast would make the household tap through the very sequence the screen is
 * meant to read continuously. Month headings carry the position instead.
 */
export function ForecastTimeline({
  days,
  ownerNameByEventId = {},
  isLoading = false,
  isEmpty = false,
  usableNowAssetCount,
  onAdd,
  onComplete,
  onPostpone,
  onCancel,
  onEdit,
  onDelete,
}: ForecastTimelineProps) {
  const { t } = useTranslation()
  const hasLiquidSource = canProjectBalance(usableNowAssetCount)

  const rows = useMemo(
    () => flattenTimeline(days, hasLiquidSource),
    [days, hasLiquidSource],
  )

  // The timeline is already chronological, so the first time a month is seen
  // fixes its position — no re-sorting, which would fight the overdue-clamped
  // ordering upstream.
  const groups = useMemo(() => {
    const out: { key: string; rows: TimelineRow[] }[] = []
    const indexByKey = new Map<string, number>()
    for (const row of rows) {
      // Grouped by the date the money actually MOVES — the same date the
      // running balance uses — so an overdue item counted today sits under
      // today's month.
      const key = monthKey(row.occurrence.date)
      const at = indexByKey.get(key)
      if (at === undefined) {
        indexByKey.set(key, out.length)
        out.push({ key, rows: [row] })
      } else {
        out[at].rows.push(row)
      }
    }
    return out
  }, [rows])

  if (isLoading) {
    return (
      <Panel>
        <PanelHeader title={t('upcoming.timeline.title')} />
        <View className="mt-5 gap-2">
          <Skeleton height={56} className="rounded-sunk" />
          <Skeleton height={56} className="rounded-sunk" />
          <Skeleton height={56} className="rounded-sunk" />
        </View>
      </Panel>
    )
  }

  if (isEmpty) {
    return (
      <Panel>
        <PanelHeader title={t('upcoming.timeline.title')} />
        <EmptyState
          className="mt-5"
          message={t('upcoming.timeline.empty')}
          action={onAdd ? t('upcoming.form.title') : undefined}
          onAction={onAdd}
        />
      </Panel>
    )
  }

  return (
    <Panel>
      <PanelHeader
        title={t('upcoming.timeline.title')}
        right={
          <Text className="text-[12px] text-ink3">
            {t('upcoming.timeline.count', { count: rows.length })}
          </Text>
        }
      />

      {/* Dependency-missing, said once where the dashes are. Not a caveat box:
          `ForecastSummary` already carries the notice and the action, and
          repeating a fact to fill space is exactly what §9 forbids. */}
      {!hasLiquidSource ? (
        <Text className="mt-3 text-[12px] leading-4 text-ink3">
          {t('home.upcoming.remainingUnavailable')}
        </Text>
      ) : null}

      <View className="mt-4">
        {groups.map((group) => (
          <View key={group.key}>
            <Label className="mb-1 mt-3">
              {t('upcoming.timeline.monthGroup', monthParts(group.key))}
            </Label>
            {group.rows.map(({ occurrence, runningBalance }) => (
              <OccurrenceRow
                key={occurrence.occurrenceKey}
                occurrence={occurrence}
                runningBalance={runningBalance}
                ownerName={ownerNameByEventId[occurrence.sourceEventId]}
                onComplete={onComplete}
                onPostpone={onPostpone}
                onCancel={onCancel}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </View>
        ))}
      </View>
    </Panel>
  )
}

function OccurrenceRow({
  occurrence,
  runningBalance,
  ownerName,
  onComplete,
  onPostpone,
  onCancel,
  onEdit,
  onDelete,
}: {
  occurrence: ForecastOccurrence
  runningBalance?: number
  ownerName?: string
  onComplete?: (occurrence: ForecastOccurrence) => void
  onPostpone?: (occurrence: ForecastOccurrence) => void
  onCancel?: (occurrence: ForecastOccurrence) => void
  onEdit?: (sourceEventId: string) => void
  onDelete?: (sourceEventId: string) => void
}) {
  const { t } = useTranslation()
  const isIncoming = occurrence.direction === 'incoming'

  // `confirmed` and `required` are the defaults — chipping every ordinary row
  // spends the marker budget on rows nobody must act on, leaving nothing to
  // signal with (§5, never a badge for a normal state).
  const markers = occurrenceMarkers(occurrence).filter(
    (marker) => marker !== 'confirmed' && marker !== 'required',
  )

  const actions: ActionSheetItem[] = []
  if (onComplete) {
    actions.push({
      key: 'complete',
      label: t('upcoming.rowActions.complete'),
      onPress: () => onComplete(occurrence),
    })
  }
  if (onEdit) {
    actions.push({
      key: 'edit',
      label: t('upcoming.rowActions.edit'),
      onPress: () => onEdit(occurrence.sourceEventId),
    })
  }
  if (onPostpone) {
    actions.push({
      key: 'postpone',
      label: t('upcoming.rowActions.postpone'),
      onPress: () => onPostpone(occurrence),
    })
  }
  // Cancel and delete last, in that order: §22.11 keeps the irreversible action
  // at the end of the flow, never first under a thumb already moving. Cancel
  // closes the event and keeps the record; delete removes it.
  if (onCancel) {
    actions.push({
      key: 'cancel',
      label: t('upcoming.rowActions.cancelEvent'),
      onPress: () => onCancel(occurrence),
      destructive: true,
    })
  }
  if (onDelete) {
    actions.push({
      key: 'delete',
      label: t('upcoming.rowActions.delete'),
      onPress: () => onDelete(occurrence.sourceEventId),
      destructive: true,
    })
  }

  const openMenu = actions.length > 0

  /**
   * An occurrence the balance does not count still renders, at reduced weight,
   * so the household sees it without it appearing to move the number beside it.
   * Dimmed and not hidden: an estimated inflow that vanished would read as the
   * app having lost it.
   *
   * The action menu is deliberately outside this — a postponed or estimated
   * item is exactly the one somebody needs to go confirm, so its controls must
   * stay at full contrast.
   */
  const contentOpacity = occurrence.countedInBalance ? 1 : 0.6

  const body = (
    <View className="flex-row items-start gap-3">
      <View className="min-w-0 flex-1" style={{ opacity: contentOpacity }}>
        <View className="flex-row items-center gap-2">
          {/* An overdue occurrence is pulled onto today so it still weighs on
              today's cash, but the date says WHEN THE EVENT HAPPENS — so it
              shows the real one. The clamp stays in `occurrence.date`, which is
              what the running balance and the month grouping use, and the
              `overdue` marker is what says it is being counted now. */}
          <Text className="font-mono text-[11px] text-ink3">
            {formatDayMonth(occurrence.originalDate ?? occurrence.date)}
          </Text>
          {ownerName ? (
            <Text className="shrink text-[11px] text-ink3" numberOfLines={1}>
              {ownerName}
            </Text>
          ) : null}
        </View>

        <Text className="mt-0.5 text-[14px] leading-5 text-ink" numberOfLines={2}>
          {occurrence.name}
        </Text>

        {markers.length > 0 ? (
          <View className="mt-1 flex-row flex-wrap gap-1">
            {markers.map((marker) => (
              <Text
                key={marker}
                className="rounded-full bg-attention-soft px-2 py-0.5 text-[10px] font-medium text-attention"
              >
                {t(`upcoming.markers.${marker}`)}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      <View className="items-end" style={{ opacity: contentOpacity }}>
        {/* Incoming carries the interactive colour, outgoing stays ink: the
            direction is already in the sign, and colouring every bill red would
            make a routine month look like an emergency. */}
        <Text
          className={cn(
            'text-[14px] font-medium',
            isIncoming ? 'text-interactive' : 'text-ink',
          )}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {`${isIncoming ? '+' : '−'}${formatMoney(occurrence.amount)}`}
        </Text>
        {/* "—" and never a fabricated 0. Red only for an actual shortfall —
            `balanceTone` is binary and owns that rule. */}
        <Text
          className={cn(
            'mt-0.5 text-[11px]',
            runningBalance !== undefined && balanceTone(runningBalance) === 'shortfall'
              ? 'text-alert'
              : 'text-ink3',
          )}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {runningBalance === undefined
            ? '—'
            : t('home.upcoming.remainingShort', { value: formatMoney(runningBalance) })}
        </Text>
      </View>

      {openMenu ? (
        <ActionSheet
          title={occurrence.name}
          accessibilityLabel={t('upcoming.rowActions.label')}
          items={actions}
        />
      ) : null}
    </View>
  )

  // Not a Pressable row: an occurrence is virtual and has no detail page to
  // navigate to, so the whole row would be a 44pt target that does nothing. The
  // `ActionSheet` beside the amount is the affordance, and it clears 44pt on
  // its own.
  return <View style={{ minHeight: TOUCH_TARGET }} className="justify-center py-2.5">{body}</View>
}

function flattenTimeline(days: ForecastDay[], hasLiquidSource: boolean): TimelineRow[] {
  return days.flatMap((day) => {
    const balances = runningBalancesForDay(day)
    return day.occurrences.map((occurrence) => ({
      occurrence,
      runningBalance:
        occurrence.countedInBalance && hasLiquidSource
          ? balances.get(occurrence.occurrenceKey)
          : undefined,
    }))
  })
}
