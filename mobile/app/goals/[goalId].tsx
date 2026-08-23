import { useMemo, useState } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { GoalAllocationRecord } from '@money-space/core/features/goals/api/goals.repository'
import { useGoalAllocations } from '@money-space/core/features/goals/hooks/use-goal-allocations'
import { useGoalMonthlyProgress } from '@money-space/core/features/goals/hooks/use-goal-monthly-progress'
import { useGoalsPage } from '@money-space/core/features/goals/hooks/use-goals-page'
import { useScheduledOutflowImpact } from '@money-space/core/features/goals/hooks/use-scheduled-outflow-impact'
import { hasProjectedDate } from '@money-space/core/features/goals/model/goal-projection.types'
import { goalAmount } from '@money-space/core/features/goals/model/goals-form'
import { formatVndScale, splitVndScale } from '@money-space/core/shared/lib/format-money'
import { useNavigate, useSearchParam } from '@money-space/core/shared/navigation'

import {
  BackLink,
  Button,
  Label,
  Panel,
  ProgressBar,
  Screen,
  Sections,
  Skeleton,
} from '@/components/ui'
import { dateLocale, formatGoalMonth, isRealDate } from '@/features/goals/lib/goal-dates'
import { GoalAllocationSheet } from '@/features/goals/ui/goal-allocation-sheet'
import { GoalAllocationsSection } from '@/features/goals/ui/goal-allocations-section'
import { GoalFormSheet } from '@/features/goals/ui/goal-form-sheet'
import { GoalMonthlyProgressSection } from '@/features/goals/ui/goal-monthly-progress-section'
import { GoalProgressChange } from '@/features/goals/ui/goal-progress-change'
import { GoalRoadSection } from '@/features/goals/ui/goal-road-section'
import { GoalScheduledOutflowsSection } from '@/features/goals/ui/goal-scheduled-outflows-section'

/**
 * One goal, in full.
 *
 * The reading order answers the questions in the order a household asks them:
 *
 *  1. **the number** — what is behind this, against what it needs to be;
 *  2. **what is about to move it** — scheduled bills, if any touch its wallets;
 *  3. **the date** — is this pace going to get there in time;
 *  4. **the rhythm** — are we keeping it up, month to month;
 *  5. **what backs it** — which assets, and how each one contributes.
 *
 * (4) sits before (5) deliberately: "are we keeping it up?" is asked before
 * "what is feeding this?", and the second is only interesting once the first
 * has been answered.
 *
 * Every figure here comes from core. This file arranges them.
 */
export default function GoalDetailScreen() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const goalId = useSearchParam('goalId') ?? undefined
  const locale = dateLocale(i18n.resolvedLanguage)

  const {
    goals,
    isLoading,
    priorityLabels,
    assetOptions,
    addAllocation,
    editAllocation,
    removeAllocation,
    isSavingAllocation,
    form,
    isEditing,
    isSavingGoal,
    submit,
    formOpen,
    openEdit,
    handleFormOpenChange,
  } = useGoalsPage()

  const goal = goals.find((item) => item.id === goalId)
  const { allocations } = useGoalAllocations(goalId)
  // Null unless something is actually scheduled against this goal's wallets.
  const { impact: scheduledOutflowImpact } = useScheduledOutflowImpact(goalId)
  // The goal's own history. The pace section below runs the same query, so this
  // costs nothing extra.
  const { months: progressMonths } = useGoalMonthlyProgress(goalId)

  // `?allocate=1` — set by the create flow, which lands here precisely because
  // a goal has nothing behind it until assets are chosen. Opening the sheet
  // straight away makes "create" and "pick the assets" read as one action.
  const allocateFlag = useSearchParam('allocate')
  const [allocationOpen, setAllocationOpen] = useState(() => allocateFlag === '1')
  const [editingAllocation, setEditingAllocation] = useState<GoalAllocationRecord | undefined>(
    undefined,
  )

  // One live claim per (goal, asset): an asset already counted here cannot be
  // added a second time, so it is not offered.
  const unallocatedAssets = useMemo(
    () => assetOptions.filter((option) => !allocations.some((row) => row.assetId === option.value)),
    [allocations, assetOptions],
  )

  function closeAllocationSheet() {
    setAllocationOpen(false)
    setEditingAllocation(undefined)
  }

  if (isLoading && !goal) {
    return (
      <Screen withoutTabBar>
        <Sections>
          <Skeleton height={36} className="w-40" />
          <Skeleton height={200} className="rounded-panel" />
        </Sections>
      </Screen>
    )
  }

  if (!goal) {
    return (
      <Screen withoutTabBar>
        <BackLink label={t('goals.detail.back')} onPress={() => navigate('/goals')} />
        <Panel className="mt-3">
          <Text className="text-[16px] font-medium text-ink">
            {t('goals.detail.notFound.title')}
          </Text>
          <Text className="mt-1 text-[14px] leading-5 text-ink2">
            {t('goals.detail.notFound.description')}
          </Text>
        </Panel>
      </Screen>
    )
  }

  const current = goalAmount(goal.currentAmount)
  const target = goalAmount(goal.targetAmount)
  const remaining = Math.max(target - current, 0)
  const progress = Math.min(Math.max(goal.progress, 0), 100)
  const savedFigure = splitVndScale(current)
  const projection = goal.projection
  const notSet = t('goals.table.notSet')

  // One decimal, matching every other percentage on the screen.
  const percentLabel = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(progress)

  // Shown ONLY when the projection is honest. A goal with no declared pace has
  // no date, and inventing one would be a guess drawn as a fact.
  const projectedLabel =
    projection && hasProjectedDate(projection)
      ? formatGoalMonth(projection.projectedCompletionDate, locale, notSet)
      : null
  const desiredLabel = formatGoalMonth(goal.targetDate, locale, notSet)

  return (
    <Screen>
      <BackLink label={t('goals.detail.back')} onPress={() => navigate('/goals')} />

      <View className="mb-4 mt-2 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-[19px] font-medium text-ink" numberOfLines={2}>
            {goal.name}
          </Text>
          {/* Priority qualifies the goal, not the figure — so it sits beside
              the name, never on the panel below. */}
          <Text className="mt-0.5 text-[12px] text-ink3">{priorityLabels[goal.priority]}</Text>
        </View>
        <Button variant="secondary" className="px-4" onPress={() => openEdit(goal.id)}>
          {t('common.edit')}
        </Button>
      </View>

      <Sections>
        {/* The current state, and nothing else. The projection has a section of
            its own below: three numbers of three different kinds side by side
            leaves the household sorting out which answers what. */}
        <Panel>
          <Label>{t('goals.detail.picture.saved')}</Label>

          <View className="mt-3 flex-row flex-wrap items-end gap-x-2">
            <Text
              className="text-[44px] font-medium text-ink"
              style={{ fontVariant: ['tabular-nums'], letterSpacing: -1.76, lineHeight: 48 }}
            >
              {savedFigure.amount}
              {savedFigure.unit ? ` ${savedFigure.unit}` : ''}
            </Text>
            <Text
              className="mb-2 text-[12px] text-ink3"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              / {formatVndScale(target)}
            </Text>
          </View>

          {/* Percentage and shortfall read as one line above the bar: the bar
              shows the shape, these two say what it amounts to. */}
          <View className="mt-5 flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <Text className="text-[14px] text-ink2">
              {t('goals.detail.picture.achieved', { percent: percentLabel }).replace(
                /<\/?0>/g,
                '',
              )}
            </Text>
            <Text className="text-[14px] text-ink2">
              {t('goals.detail.picture.remaining', {
                amount: formatVndScale(remaining),
              }).replace(/<\/?1>/g, '')}
            </Text>
          </View>

          <ProgressBar
            className="mt-2"
            percent={progress}
            label={t('goals.detail.picture.progressAria', {
              current: formatVndScale(current),
              target: formatVndScale(target),
            })}
          />

          {/* Assets reprice on their own, so this figure can move with the
              household having done nothing. Saying why is what keeps it
              trustworthy. */}
          <GoalProgressChange goalId={goal.id} />

          {/* The target and when this pace lands on it — under the figure
              stack, not beside it, so the two kinds of number are never read
              as one series. */}
          <View className="mt-6 border-t border-hair pt-4">
            <Label>{t('goals.detail.picture.targetLabel')}</Label>
            <Text
              className="mt-1.5 text-[26px] font-medium text-ink"
              style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.78 }}
            >
              {formatVndScale(target)}
            </Text>
            <Text className="mt-1 text-[12px] text-ink3">
              {projectedLabel
                ? t('goals.detail.picture.projectedOn', { date: projectedLabel })
                : isRealDate(goal.targetDate)
                  ? t('goals.detail.picture.wantByPlain', { date: desiredLabel })
                  : t('goals.detail.picture.noDeadline')}
            </Text>
          </View>
        </Panel>

        {/* Directly under the figures it qualifies: the household reads the
            number, and if a bill is going to move it, the explanation is the
            very next thing rather than something to discover further down.
            Renders nothing when no outflow touches this goal's wallets. */}
        <GoalScheduledOutflowsSection impact={scheduledOutflowImpact} target={target} />

        <GoalRoadSection
          target={target}
          remaining={remaining}
          projection={projection}
          plannedMonthly={goal.plannedMonthlyContribution}
          months={progressMonths}
          targetDate={goal.targetDate}
          locale={locale}
        />

        <GoalMonthlyProgressSection goalId={goal.id} />

        <GoalAllocationsSection
          allocations={allocations}
          assetOptions={assetOptions}
          isBusy={isSavingAllocation}
          canAdd={unallocatedAssets.length > 0 || Boolean(editingAllocation)}
          onAdd={() => {
            setEditingAllocation(undefined)
            setAllocationOpen(true)
          }}
          onEdit={(allocation) => {
            setEditingAllocation(allocation)
            setAllocationOpen(true)
          }}
          onRemove={(allocationId) => void removeAllocation(goal.id, allocationId)}
        />
      </Sections>

      <GoalAllocationSheet
        // Remount per row so the sheet seeds its fields from `editing` without
        // an effect syncing props into state.
        key={editingAllocation?.id ?? 'new'}
        open={allocationOpen}
        onClose={closeAllocationSheet}
        goalName={goal.name}
        // While editing, the asset is fixed — only its share changes.
        assetOptions={
          editingAllocation
            ? assetOptions.filter((option) => option.value === editingAllocation.assetId)
            : unallocatedAssets
        }
        editing={editingAllocation}
        isSubmitting={isSavingAllocation}
        onSubmit={(payload) =>
          editingAllocation
            ? editAllocation(goal.id, editingAllocation.id, {
                kind: payload.kind,
                allocatedAmount: payload.allocatedAmount,
                percent: payload.percent,
                monthlyContribution: payload.monthlyContribution,
              })
            : addAllocation(goal.id, payload)
        }
      />

      <GoalFormSheet
        open={formOpen}
        onClose={() => handleFormOpenChange(false)}
        form={form}
        assetOptions={assetOptions}
        isEditing={isEditing}
        isSubmitting={isSavingGoal}
        onSubmit={submit}
      />
    </Screen>
  )
}
