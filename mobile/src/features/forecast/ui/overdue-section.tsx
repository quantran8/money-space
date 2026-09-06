import { Pressable, Text, View } from 'react-native'
import { TriangleAlert } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'

import type { OverdueSummary } from '@money-space/core/features/forecast/model/forecast-overdue'
import { formatVndCellSigned } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

import { ActionSheet, Label, Panel, PanelHeader } from '@/components/ui'
import { CategoryDisc } from '@/features/events/ui/components/category-disc'
import { formatDayMonth } from '@/features/forecast/lib/forecast-dates'
import { TOUCH_TARGET, colors } from '@/theme/tokens'

import type { ForecastCategoryVisual } from '@/features/forecast/ui/forecast-timeline'

/**
 * Khoản quá hạn — its own card, on Home directly under the hero and on the
 * Upcoming screen above the timeline.
 *
 * These are still owed, still inside `startingLiquidBalance` and everything
 * projected from it — the arithmetic treats them like any upcoming item. The
 * READING is what differs: this is the only block on the screen waiting on a
 * person, so it sits above the forecast that already counts it. The household
 * sees what is waiting before it reads figures that assume it settled.
 *
 * Renders nothing when nothing is waiting, which is why it can hold that
 * position without costing a permanent card.
 *
 * Alert tone, and only here (§5.2, §25): a date that has passed with no
 * confirmation is a fact about the calendar, not a judgement — the block names
 * what is waiting and what it comes to, and never says what anyone should do.
 */
export function OverdueSection({
  overdue,
  onComplete,
  onEdit,
  onDelete,
  pendingId,
  categoryVisualByEventId = {},
}: {
  overdue: OverdueSummary
  /** Marks one occurrence resolved. The ONLY way an item leaves this list (§18). */
  onComplete?: (sourceEventId: string, occurrenceDate: string) => void
  /**
   * Sửa/xoá khoản gốc — cùng menu ⋯ như hàng trên dòng thời gian, vì một khoản
   * quá hạn thường sai ngày hoặc sai số chứ không phải đã trả (§18).
   */
  onEdit?: (sourceEventId: string) => void
  onDelete?: (sourceEventId: string) => void
  /** The row currently being confirmed, so only ITS button shows a spinner. */
  pendingId?: string | null
  /** Event id → the disc its category wears, the same map the timeline reads. */
  categoryVisualByEventId?: Record<string, ForecastCategoryVisual | undefined>
}) {
  const { t } = useTranslation()

  if (overdue.totalCount === 0) return null

  return (
    <Panel>
      <PanelHeader title={t('home.upcoming.overdue.title')} />

      {/* The summary line, stated once at the top: how many, how old, and that
          the figures below already count them. Everything under it is the same
          facts per item, so this is the only place the totals appear (§2.10). */}
      <View className="mt-5 flex-row items-start gap-3 rounded-control bg-attention-soft p-4">
        <TriangleAlert size={20} color={colors.alertInk} strokeWidth={1.7} />
        <View className="min-w-0 flex-1">
          <Text className="t-body-sm font-medium text-alert-ink">
            {overdue.oldestDays === undefined
              ? t('home.upcoming.overdue.count', { count: overdue.totalCount })
              : t('home.upcoming.overdue.summary', {
                  count: overdue.totalCount,
                  days: overdue.oldestDays,
                })}
          </Text>
          <Text className="mt-1 t-caption leading-5 text-ink2">
            {t('home.upcoming.overdue.note')}
          </Text>
        </View>
      </View>

      <View className="mt-5">
        <Label>{t('home.upcoming.overdue.listLabel')}</Label>

        <View className="mt-2">
          {overdue.rows.map((row) => (
            <OverdueRowItem
              key={row.key}
              row={row}
              onComplete={onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              pending={pendingId === row.sourceEventId}
              categoryVisual={categoryVisualByEventId[row.sourceEventId]}
            />
          ))}
        </View>

        {overdue.totalCount > overdue.rows.length ? (
          <Text className="mt-3 t-caption text-ink2">
            {t('home.upcoming.overdue.more', {
              count: overdue.totalCount - overdue.rows.length,
            })}
          </Text>
        ) : null}
      </View>
    </Panel>
  )
}

/**
 * One waiting item: when it fell due, what it is, how late it is, what it comes
 * to, and the button that resolves it.
 *
 * The web lays this out as a five-column grid. On a phone it stacks: identity
 * and amount on one line, age under it, and the action full-width below —
 * §8 forbids a core flow scrolling sideways, and "Đã xong" has to clear 44pt.
 */
function OverdueRowItem({
  row,
  onComplete,
  onEdit,
  onDelete,
  pending,
  categoryVisual,
}: {
  row: OverdueSummary['rows'][number]
  onComplete?: (sourceEventId: string, occurrenceDate: string) => void
  onEdit?: (sourceEventId: string) => void
  onDelete?: (sourceEventId: string) => void
  pending: boolean
  categoryVisual?: ForecastCategoryVisual
}) {
  const { t } = useTranslation()

  // Generated from its debt and regenerated on every schedule change, so a hand
  // edit here would be undone. Completing it stays available — recording a
  // payment is not an edit of the plan.
  const isDebtDerived = Boolean(row.debtId)

  const menuItems = [
    ...(onEdit && !isDebtDerived
      ? [
          {
            key: 'edit',
            label: t('upcoming.rowActions.edit'),
            onPress: () => onEdit(row.sourceEventId),
          },
        ]
      : []),
    ...(onDelete && !isDebtDerived
      ? [
          {
            key: 'delete',
            label: t('upcoming.rowActions.delete'),
            onPress: () => onDelete(row.sourceEventId),
            destructive: true,
          },
        ]
      : []),
  ]

  return (
    <View className="border-t border-divider py-3 first:border-t-0">
      {/* The disc leads the identity block, not the whole row: "Đã xong" is
          full-width underneath, and indenting that behind an icon would cost
          the 44pt target its width for nothing. */}
      <View className="flex-row items-start gap-3">
        <View className="pt-0.5">
          <CategoryDisc visual={categoryVisual} size={32} />
        </View>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-baseline gap-3">
            {/* When it FELL DUE, not the day the forecast lists it under. Absent
                when the source event is not loaded — better no date than today's. */}
            {row.dueDate ? (
              <Text className="font-mono t-caption-sm text-ink3">
                {formatDayMonth(row.dueDate)}
              </Text>
            ) : null}
            <Text className="flex-1 t-body-sm font-medium text-ink" numberOfLines={1}>
              {row.name}
            </Text>
            <Text
              className={cn(
                't-body-sm font-medium',
                row.signedAmount > 0 ? 'text-positive-ink' : 'text-alert-ink',
              )}
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatVndCellSigned(row.signedAmount)}{' '}
              {/* §10.4 — the unit is stated beside the figure, never baked in. */}
              <Text className="font-mono t-caption-sm text-ink3">{t('units.million')}</Text>
            </Text>
            {menuItems.length > 0 ? (
              <ActionSheet
                title={row.name}
                items={menuItems}
                accessibilityLabel={t('upcoming.rowActions.label')}
              />
            ) : null}
          </View>

          {row.daysOverdue === undefined ? null : (
            <View className="mt-1 flex-row items-center gap-2">
              <View className="size-1.5 rounded-full bg-alert" />
              <Text className="t-caption text-ink2">
                {t('home.upcoming.overdue.age', { count: row.daysOverdue })}
              </Text>
            </View>
          )}
        </View>
      </View>

      {onComplete ? (
        <Pressable
          // `row.date` — day 0 — is the idempotency key the API expects, NOT
          // `row.dueDate`, which is only what we show (§18).
          onPress={() => onComplete(row.sourceEventId, row.date)}
          disabled={pending}
          accessibilityRole="button"
          style={{ minHeight: TOUCH_TARGET }}
          className={cn(
            'mt-3 items-center justify-center rounded-control bg-action px-4',
            pending && 'opacity-60',
          )}
        >
          <Text className="t-body font-medium text-action-inverse">
            {pending ? t('home.upcoming.overdue.marking') : t('home.upcoming.overdue.markDone')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}
