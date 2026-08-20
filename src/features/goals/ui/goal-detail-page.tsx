import { ChevronLeft, Pencil, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Panel, Sunk } from '@/components/ui/panel'
import type { GoalAllocationRecord } from '@/features/goals/api/goals.repository'
import { useGoalAllocations } from '@/features/goals/hooks/use-goal-allocations'
import { useGoalsPage } from '@/features/goals/hooks/use-goals-page'
import { goalAmount } from '@/features/goals/model/goals-form'
import { GoalAllocationDialog } from '@/features/goals/ui/components/goal-allocation-dialog'
import { GoalAllocationsSection } from '@/features/goals/ui/components/goal-allocations-section'
import { GoalMonthlyProgressSection } from '@/features/goals/ui/components/goal-monthly-progress-section'
import { GoalProgressChange } from '@/features/goals/ui/components/goal-progress-change'
import { GoalRoadSection } from '@/features/goals/ui/components/goal-road-section'
import { GoalFormDialog } from '@/features/goals/ui/components/goal-form-dialog'
import { formatVndScale, splitVndScale } from '@/shared/lib/format-money'

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
        <Sunk className="h-52 animate-pulse rounded-panel" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="space-y-4 pb-3">
        <BackLink onClick={() => navigate('/goals')} label={t('goals.detail.back')} />
        <Panel className="py-10 text-center">
          <h1 className="section-title text-[16px]">{t('goals.detail.notFound.title')}</h1>
          <p className="mt-1 text-[13px] text-ink2">{t('goals.detail.notFound.description')}</p>
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

  return (
    <div className="space-y-4 pb-3">
      <header className="px-1 py-1 sm:px-0">
        <BackLink onClick={() => navigate('/goals')} label={t('goals.detail.back')} />

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="page-title min-w-0 truncate">
            {goal.name}
          </h1>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Button
              variant="secondary"
              className="h-10 px-4 text-[13px]"
              onClick={() => openEdit(goal.id)}
            >
              <Pencil className="size-4" strokeWidth={1.75} />
              {t('common.edit')}
            </Button>
            <Button
              className="h-10 px-4 text-[13px]"
              onClick={() => {
                setEditingAllocation(undefined)
                setAllocationOpen(true)
              }}
            >
              <Plus className="size-4" strokeWidth={1.75} />
              {t('goals.allocations.add')}
            </Button>
          </div>
        </div>
      </header>

      {/* The current state, and nothing else. The hero used to carry the
          projection too, which put three numbers of three different kinds
          side by side and left the household to sort out which answered what.
          The forecast now has a section of its own below. */}
      <Panel>
        <div className="max-w-[780px]">
          <p className="text-[12px] text-ink3">{priorityLabels[goal.priority]}</p>

          <div className="mt-5">
            <p className="text-[12px] text-ink3">{t('goals.detail.picture.saved')}</p>
            <div className="mt-2 flex items-end gap-2.5">
              <span className="money-number text-[44px] leading-none sm:text-[60px]">
                {savedFigure.amount}
              </span>
              <span className="num mb-1.5 text-[14px] text-ink2">/ {formatVndScale(target)}</span>
            </div>
          </div>

          <div className="mt-7">
            <div
              className="h-2 overflow-hidden rounded-full bg-committed"
              role="progressbar"
              aria-label={t('goals.detail.picture.progressAria', {
                current: formatVndScale(current),
                target: formatVndScale(target),
              })}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <div
                className="seg h-full min-w-[4px] rounded-full bg-accent"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 text-[12px] text-ink2">
              <span>
                <Trans
                  i18nKey="goals.detail.picture.remaining"
                  values={{ amount: formatVndScale(remaining) }}
                  components={[<strong key="amount" className="num font-medium text-ink" />]}
                />
              </span>
              <span>
                {goal.targetDate && goal.targetDate !== 'No deadline' ? (
                  <Trans
                    i18nKey="goals.detail.picture.wantBy"
                    values={{ date: desiredDate }}
                    components={[<strong key="date" className="num font-medium text-ink" />]}
                  />
                ) : (
                  t('goals.detail.picture.noDeadline')
                )}
              </span>
            </div>
          </div>

          {/* Assets reprice on their own, so this figure can move with the
              household having done nothing. Saying why is what keeps it
              trustworthy — see the component. */}
          <GoalProgressChange goalId={goal.id} />
        </div>
      </Panel>

      {/* Is this pace going to get us there in time? — as a chart and a
          sentence, because that question is a comparison. */}
      <GoalRoadSection
        current={current}
        target={target}
        remaining={remaining}
        projection={projection}
        plannedMonthly={plannedMonthly}
        targetDate={goal.targetDate}
        formatDate={(value) => formatGoalDate(value, locale, notSet)}
      />

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

      {/* Month by month: what actually went in, against the declared pace. */}
      <GoalMonthlyProgressSection goalId={goal.id} />

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
      className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-control px-2 text-[13px] font-medium text-accent hover:bg-accent-soft"
      onClick={onClick}
    >
      <ChevronLeft className="size-4" strokeWidth={1.75} />
      {label}
    </button>
  )
}

