import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { hasProjectedDate } from '@money-space/core/features/goals/model/goal-projection.types'
import type { GoalItem } from '@money-space/core/features/goals/model/goals'
import {
  formatAmount,
  goalAmount,
  priorityRank,
} from '@money-space/core/features/goals/model/goals-form'

import {
  ActionSheet,
  EmptyState,
  Panel,
  PanelHeader,
  ProgressBar,
  Skeleton,
} from '@/components/ui'
import { dateLocale, formatGoalMonth, isRealDate } from '@/features/goals/lib/goal-dates'
import { GoalPriorityMark } from '@/features/goals/ui/goal-priority-mark'
import { TOUCH_TARGET } from '@/theme/tokens'

import type { ActionSheetItem } from '@/components/ui'

/**
 * Every goal, as grouped rows.
 *
 * The web shows a four-column table here. A table does not survive the move to
 * a phone (§8: no horizontal scroll on a core flow), and the columns were never
 * the point — the reader is asking one goal at a time "how far along, and when
 * does it land", not comparing four figures across five rows.
 *
 * So each goal becomes one card: the fraction and the bar, then the two dates
 * as a small stack. Money never truncates, which is why the fraction sits on
 * its own line rather than being squeezed beside the name.
 *
 * The search box is gone. It earns its place over a long table on a desktop;
 * on a phone a household has a handful of goals, and a field that pushes the
 * first goal below the fold to filter three items is a cost with no return.
 */
export function GoalsListSection({
  goals,
  primaryGoalId,
  isLoading = false,
  onCreate,
  onOpen,
  onEdit,
  onDelete,
}: {
  goals: GoalItem[]
  primaryGoalId?: string
  isLoading?: boolean
  onCreate: () => void
  onOpen: (goalId: string) => void
  onEdit: (goalId: string) => void
  onDelete: (goalId: string) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = dateLocale(i18n.resolvedLanguage)

  // Highest priority first, then furthest along — the same order the web uses,
  // so a household that reads both is not relearning the list.
  const ordered = [...goals].sort(
    (a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.progress - a.progress,
  )

  return (
    <Panel>
      <PanelHeader
        title={t('goals.demo.listTitle')}
        right={
          goals.length > 0 ? (
            <Text className="t-caption text-ink3">
              {t('goals.countLabel', { count: goals.length })}
            </Text>
          ) : undefined
        }
      />

      {isLoading ? (
        <View className="mt-6 gap-2">
          <Skeleton height={104} className="rounded-control" />
          <Skeleton height={104} className="rounded-control" />
        </View>
      ) : goals.length === 0 ? (
        <EmptyState
          className="mt-6"
          message={t('goals.list.empty')}
          action={t('goals.form.submit')}
          onAction={onCreate}
        />
      ) : (
        <View className="mt-5 gap-1">
          {ordered.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              locale={locale}
              isPrimary={goal.id === primaryGoalId}
              onOpen={() => onOpen(goal.id)}
              onEdit={() => onEdit(goal.id)}
              onDelete={() => onDelete(goal.id)}
            />
          ))}
        </View>
      )}
    </Panel>
  )
}

function GoalCard({
  goal,
  locale,
  isPrimary,
  onOpen,
  onEdit,
  onDelete,
}: {
  goal: GoalItem
  locale: string
  isPrimary: boolean
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()

  const current = goalAmount(goal.currentAmount)
  const target = goalAmount(goal.targetAmount)
  const progress = Math.min(Math.max(goal.progress, 0), 100)
  const projection = goal.projection
  const notSet = t('goals.table.notSet')

  const desiredDate = formatGoalMonth(goal.targetDate, locale, notSet)
  // Only when the projection is honest. With no declared pace there is no date
  // to show, and inventing one from past behaviour would be a guess drawn as a
  // fact — `hasProjectedDate` is the single check for that.
  const projectedDate =
    projection && hasProjectedDate(projection)
      ? formatGoalMonth(projection.projectedCompletionDate, locale, notSet)
      : t('goals.demo.unknownProjection')

  const monthly =
    goal.plannedMonthlyContribution != null && goal.plannedMonthlyContribution > 0
      ? formatAmount(goal.plannedMonthlyContribution)
      : t('goals.projection.noPace')

  // Positive = landing LATER than the desired date. Attention, never alert:
  // a savings pace falling short is information, not a fault.
  const gapMonths = projection?.paceGapMonths ?? null
  const late = gapMonths != null && gapMonths > 0
  const paceLabel =
    gapMonths == null || gapMonths === 0
      ? null
      : late
        ? t('goals.table.lateBy', { count: gapMonths })
        : t('goals.table.earlyBy', { count: Math.abs(gapMonths) })

  const actions: ActionSheetItem[] = [
    { key: 'view', label: t('goals.list.viewDetail'), onPress: onOpen },
    { key: 'edit', label: t('common.edit'), onPress: onEdit },
    { key: 'delete', label: t('common.delete'), onPress: onDelete, destructive: true },
  ]

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={goal.name}
      style={{ minHeight: TOUCH_TARGET }}
      className="rounded-control px-3 py-3.5 active:bg-wash"
    >
      <View className="flex-row items-start gap-2">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            {/* The rank, before the name: a scan down the list finds the goals
                that pull funding forward without reading a single one. */}
            <GoalPriorityMark priority={goal.priority} size="compact" />
            <Text className="flex-1 t-body font-medium text-ink" numberOfLines={1}>
              {goal.name}
            </Text>
            {isPrimary ? (
              <Text className="shrink-0 rounded-full bg-action-soft px-2 py-0.5 t-caption-sm font-medium text-action">
                {t('home.mainGoal.badge')}
              </Text>
            ) : null}
          </View>

          {/* The fraction gets its own line: at 375pt a name and two money
              values on one row is how money ends up truncated (§6). */}
          <Text
            className="mt-2 t-body-sm font-medium text-ink"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatAmount(current)} / {formatAmount(target)}
          </Text>
        </View>

        <ActionSheet
          title={goal.name}
          accessibilityLabel={t('goals.actions.menuFor', { name: goal.name })}
          items={actions}
        />
      </View>

      {/* §12.3: the fraction and the bar already say the ratio. A percentage
          beside them would be a third way of saying one thing. */}
      <ProgressBar
        className="mt-2.5"
        percent={progress}
        label={t('goals.detail.picture.progressAria', {
          current: formatAmount(current),
          target: formatAmount(target),
        })}
      />

      <View className="mt-3.5 gap-1">
        <PlanRow label={t('goals.table.desired')} value={desiredDate} mono />
        <PlanRow
          label={t('goals.table.projected')}
          value={projectedDate}
          note={paceLabel}
          tone={late ? 'attention' : 'default'}
          mono={isRealDate(projection?.projectedCompletionDate)}
        />
        <PlanRow label={t('goals.table.monthly')} value={monthly} />
      </View>
    </Pressable>
  )
}

/**
 * One label/value pair from what the web renders as a `<dl>`.
 *
 * `mono` is set only when the value is a real ASCII date. "Chưa đặt" and "Chưa
 * tính được" are Vietnamese and must never reach IBM Plex Mono (§5).
 */
function PlanRow({
  label,
  value,
  note,
  tone = 'default',
  mono = false,
}: {
  label: string
  value: string
  note?: string | null
  tone?: 'default' | 'attention'
  mono?: boolean
}) {
  return (
    <View className="flex-row items-baseline gap-3">
      <Text className="w-[86px] shrink-0 t-caption text-ink3">{label}</Text>
      <Text
        className={`t-caption font-medium ${tone === 'attention' ? 'text-attention-ink' : 'text-ink'} ${mono ? 'font-mono' : ''}`}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
      {note ? (
        <Text
          className={`t-caption-sm ${tone === 'attention' ? 'text-attention-ink' : 'text-ink3'}`}
        >
          {note}
        </Text>
      ) : null}
    </View>
  )
}
