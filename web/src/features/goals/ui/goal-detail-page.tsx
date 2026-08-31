import { ChevronLeft, Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Panel, Sunk } from '@/components/ui/panel'
import { Progress } from '@/components/ui/progress'
import type { GoalAllocationRecord } from '@money-space/core/features/goals/api/goals.repository'
import { useGoalAllocations } from '@money-space/core/features/goals/hooks/use-goal-allocations'
import { useGoalMonthlyProgress } from '@money-space/core/features/goals/hooks/use-goal-monthly-progress'
import { useGoalsPage } from '@money-space/core/features/goals/hooks/use-goals-page'
import { goalAmount } from '@money-space/core/features/goals/model/goals-form'
import { hasProjectedDate } from '@money-space/core/features/goals/model/goal-projection.types'
import { GoalAllocationDialog } from '@/features/goals/ui/components/goal-allocation-dialog'
import { GoalAllocationsSection } from '@/features/goals/ui/components/goal-allocations-section'
import { GoalMonthlyProgressSection } from '@/features/goals/ui/components/goal-monthly-progress-section'
import { GoalScheduledOutflowsSection } from '@/features/goals/ui/components/goal-scheduled-outflows-section'
import { useScheduledOutflowImpact } from '@money-space/core/features/goals/hooks/use-scheduled-outflow-impact'
import { GoalProgressChange } from '@/features/goals/ui/components/goal-progress-change'
import { GoalRoadSection } from '@/features/goals/ui/components/goal-road-section'
import { GoalFormDialog } from '@/features/goals/ui/components/goal-form-dialog'
import { formatVndScale, splitVndScale } from '@money-space/core/shared/lib/format-money'

/** Goal dates are month-precision; `'No deadline'` is the legacy empty marker. */
function formatGoalDate(value: string | undefined, locale: string, fallback: string) {
  if (!value || value === 'No deadline') return fallback
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat(locale, {
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function GoalDetailPage() {
  const { goalId } = useParams<{ goalId: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
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
  // What money already scheduled to leave this goal's wallets will cost it.
  // Null unless something is actually scheduled against them.
  const { impact: scheduledOutflowImpact } = useScheduledOutflowImpact(goalId)
  // The goal's own history — the ACTUAL line on the road chart. The same query
  // backs the pace section below, so this costs nothing extra.
  const { months: progressMonths } = useGoalMonthlyProgress(goalId)
  // `?allocate=1` — set by the create flow, which lands here precisely because
  // an asset-backed goal has nothing behind it until assets are chosen. Opening
  // the dialog straight away makes "create" and "pick the assets" read as one
  // action instead of two, the second of which the household has to find.
  const [searchParams, setSearchParams] = useSearchParams()
  const [allocationOpen, setAllocationOpen] = useState(
    () => searchParams.get('allocate') === '1',
  )
  const [editingAllocation, setEditingAllocation] = useState<
    GoalAllocationRecord | undefined
  >(undefined)

  function handleAllocationOpenChange(open: boolean) {
    setAllocationOpen(open)
    if (!open) setEditingAllocation(undefined)
    // Drop the flag once handled, so a refresh or a back-navigation does not
    // reopen a dialog the household already dismissed.
    if (!open && searchParams.has('allocate')) {
      const next = new URLSearchParams(searchParams)
      next.delete('allocate')
      setSearchParams(next, { replace: true })
    }
  }
  // One live claim per (goal, asset) — an asset already counted here cannot be
  // added a second time, so it is not offered.
  const unallocatedAssets = useMemo(
    () =>
      assetOptions.filter(
        (option) => !allocations.some((row) => row.assetId === option.value),
      ),
    [allocations, assetOptions],
  )
  if (isLoading && !goal) {
    return (
      <div className="space-y-4 pb-3">
        <Sunk className="h-9 w-40 animate-pulse" />
        <Sunk className="h-52 animate-pulse rounded-card" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="space-y-4 pb-3">
        <BackLink onClick={() => navigate('/goals')} label={t('goals.detail.back')} />
        <Panel className="py-8 text-center">
          <h1 className="t-title">{t('goals.detail.notFound.title')}</h1>
          <p className="mt-1 t-body-sm text-ink2">{t('goals.detail.notFound.description')}</p>
        </Panel>
      </div>
    )
  }

  const current = goalAmount(goal.currentAmount)
  const target = goalAmount(goal.targetAmount)
  const remaining = Math.max(target - current, 0)
  const progress = Math.min(Math.max(goal.progress, 0), 100)
  const savedFigure = splitVndScale(current)
  const projection = goal.projection
  const notSet = t('goals.table.notSet')
  const desiredDate = formatGoalDate(goal.targetDate, locale, notSet)
  const plannedMonthly = goal.plannedMonthlyContribution
  // One decimal, matching every other percentage on the screen.
  const percentLabel = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(progress)
  // Only shown when the projection is honest — a goal with no declared pace has
  // no date, and inventing one would be a guess drawn as a fact.
  const projectedLabel =
    projection && hasProjectedDate(projection) && projection.projectedCompletionDate
      ? formatGoalDate(projection.projectedCompletionDate, locale, notSet)
      : null

  return (
    <div className="space-y-4 pb-3">
      <header className="px-1 py-1 sm:px-0">
        <BackLink onClick={() => navigate('/goals')} label={t('goals.detail.back')} />

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          {/* Priority sits beside the name, not on the panel below: it
              qualifies the goal, not the figure. */}
          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="t-page-tracking min-w-0 truncate t-subhead">{goal.name}</h1>
            <span className="shrink-0 t-caption text-ink3">{priorityLabels[goal.priority]}</span>
          </div>

          <Button
            variant="secondary"
            className="s-tap h-9 shrink-0 px-4"
            onClick={() => openEdit(goal.id)}
          >
            <Pencil className="size-4" strokeWidth={1.75} />
            {t('common.edit')}
          </Button>
        </div>
      </header>

      {/* The current state, and nothing else. The hero used to carry the
          projection too, which put three numbers of three different kinds
          side by side and left the household to sort out which answered what.
          The forecast now has a section of its own below. */}
      <Panel>
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0">
            <p className="label-vi">{t('goals.detail.picture.saved')}</p>

            <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="money-number t-hero leading-[.9]">
                {savedFigure.amount}
              </span>
              <span className="num mb-1 t-caption text-ink3">/ {formatVndScale(target)}</span>
            </div>

            <div className="mt-6">
              {/* Percentage and shortfall read as one line above the bar: the
                  bar shows the shape, these two say what it amounts to. */}
              <div className="mb-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 t-body-sm">
                <span className="text-ink2">
                  <Trans
                    i18nKey="goals.detail.picture.achieved"
                    values={{ percent: percentLabel }}
                    components={[<strong key="percent" className="num font-medium text-data-ink" />]}
                  />
                </span>
                <span className="text-ink2">
                  <Trans
                    i18nKey="goals.detail.picture.remaining"
                    values={{ amount: formatVndScale(remaining) }}
                    components={[<strong key="amount" className="num font-medium text-ink" />]}
                  />
                </span>
              </div>

              <Progress
                className="h-6"
                value={progress}
                aria-label={t('goals.detail.picture.progressAria', {
                  current: formatVndScale(current),
                  target: formatVndScale(target),
                })}
              />
            </div>

            {/* Assets reprice on their own, so this figure can move with the
                household having done nothing. Saying why is what keeps it
                trustworthy — see the component. */}
            <GoalProgressChange goalId={goal.id} />
          </div>

          {/* The target and when this pace lands on it. Kept out of the figure
              stack on the left so the two kinds of number — what is held now,
              what is being aimed at — are never read as one series. */}
          <div className="flex flex-col justify-center lg:items-end">
            <p className="label-vi">{t('goals.detail.picture.targetLabel')}</p>
            <div className="money-number mt-2 t-metric">{formatVndScale(target)}</div>
            <p className="mt-1 t-caption text-ink3 lg:text-right">
              {projectedLabel
                ? t('goals.detail.picture.projectedOn', { date: projectedLabel })
                : goal.targetDate && goal.targetDate !== 'No deadline'
                  ? t('goals.detail.picture.wantByPlain', { date: desiredDate })
                  : t('goals.detail.picture.noDeadline')}
            </p>
          </div>
        </div>
      </Panel>

      {/* Directly under the figures it qualifies: the household reads "đang có
          303,6tr", and if a bill is going to move that, the explanation is the
          very next thing rather than something to discover further down. Renders
          nothing when no outflow touches this goal's wallets. */}
      <GoalScheduledOutflowsSection impact={scheduledOutflowImpact} target={target} />

      {/* Is this pace going to get us there in time? — as a chart and a
          sentence, because that question is a comparison. */}
      <GoalRoadSection
        current={current}
        target={target}
        remaining={remaining}
        projection={projection}
        plannedMonthly={plannedMonthly}
        months={progressMonths}
        targetDate={goal.targetDate}
        formatDate={(value) => formatGoalDate(value, locale, notSet)}
      />

      {/* Month by month: what actually went in, against the declared pace.
          Sits BEFORE the sources it summarises — the household asks "are we
          keeping it up?" before "what is feeding this?", and the answer to the
          second is only interesting once the first has been read. */}
      <GoalMonthlyProgressSection goalId={goal.id} />

      <GoalAllocationsSection
        allocations={allocations}
        assetOptions={assetOptions}
        isBusy={isSavingAllocation}
        canAdd={unallocatedAssets.length > 0}
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

      <GoalAllocationDialog
        // Remount per row so the dialog seeds its fields from `editing` without
        // an effect syncing props into state.
        key={editingAllocation?.id ?? 'new'}
        open={allocationOpen}
        onOpenChange={handleAllocationOpenChange}
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
              })
            : addAllocation(goal.id, payload)
        }
      />

      <GoalFormDialog
        key={formOpen ? 'goal-form-open' : 'goal-form-closed'}
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        form={form}
        assetOptions={assetOptions}
        isEditing={isEditing}
        isSubmitting={isSavingGoal}
        onSubmit={submit}
      />
    </div>
  )
}

function BackLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-control px-2 t-body-sm font-medium text-action hover:bg-accent-soft"
      onClick={onClick}
    >
      <ChevronLeft className="size-4" strokeWidth={1.75} />
      {label}
    </button>
  )
}
