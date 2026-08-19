import { ChevronLeft, Pencil, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { MetricCell } from '@/components/ui/metric-cell'
import { Panel, PanelHeader, PanelSplit, Sunk } from '@/components/ui/panel'
import type { GoalAllocationRecord } from '@/features/goals/api/goals.repository'
import { useGoalAllocations } from '@/features/goals/hooks/use-goal-allocations'
import { useGoalsPage } from '@/features/goals/hooks/use-goals-page'
import { hasProjectedDate } from '@/features/goals/model/goal-projection.types'
import { goalAmount } from '@/features/goals/model/goals-form'
import { GoalAllocationDialog } from '@/features/goals/ui/components/goal-allocation-dialog'
import { GoalAllocationsSection } from '@/features/goals/ui/components/goal-allocations-section'
import { GoalMonthlyProgressSection } from '@/features/goals/ui/components/goal-monthly-progress-section'
import { GoalProgressChange } from '@/features/goals/ui/components/goal-progress-change'
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
  const [explainOpen, setExplainOpen] = useState(false)
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
  const projectedDate =
    projection && hasProjectedDate(projection)
      ? formatGoalDate(projection.projectedCompletionDate ?? undefined, locale, notSet)
      : t('goals.demo.unknownProjection')
  const requiredMonthly = projection?.requiredMonthlyContributionForTargetDate
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

      {/* The answer: how much is set aside, and what that means for the date. */}
      <Panel>
        <PanelSplit className="mt-0">
          <div>
            <p className="label">{t('goals.detail.picture.saved')}</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="money-number text-[44px] leading-none sm:text-[64px]">
                {savedFigure.amount}
              </span>
              <span className="mb-1 text-[14px] text-ink2">/ {formatVndScale(target)}</span>
            </div>

            <div
              className="mt-6 h-1.5 overflow-hidden rounded-full bg-committed"
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

            {/* Assets reprice on their own, so this figure can move with the
                household having done nothing. Saying why is what keeps it
                trustworthy — see the component. */}
            <GoalProgressChange goalId={goal.id} />
          </div>

          <dl className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <PictureMetric label={t('goals.detail.picture.desiredDate')} value={desiredDate} />
            <PictureMetric label={t('goals.detail.picture.atCurrentPace')} value={projectedDate} />
            <PictureMetric
              label={t('goals.detail.picture.requiredMonthly')}
              value={
                requiredMonthly != null && requiredMonthly > 0
                  ? t('goals.detail.picture.perMonth', { amount: formatVndScale(requiredMonthly) })
                  : notSet
              }
            />
          </dl>
        </PanelSplit>
      </Panel>

      <Panel>
        <PanelHeader
          title={t('goals.detail.plan.title')}
          action={
            <button
              type="button"
              className="min-h-11 text-[13px] font-medium text-accent"
              onClick={() => setExplainOpen((open) => !open)}
              aria-expanded={explainOpen}
            >
              {explainOpen ? t('goals.detail.plan.hide') : t('goals.detail.plan.explain')}
            </button>
          }
        />

        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          <MetricCell
            label={t('goals.detail.plan.monthly')}
            value={
              plannedMonthly != null && plannedMonthly > 0
                ? formatVndScale(plannedMonthly)
                : t('goals.projection.noPace')
            }
          />
          <MetricCell label={t('goals.detail.plan.remaining')} value={formatVndScale(remaining)} />
          <MetricCell label={t('goals.detail.plan.priority')} value={priorityLabels[goal.priority]} />
        </div>

        {/* Every projected number has to be explainable (design.md §16). */}
        {explainOpen ? (
          <Sunk className="mt-4 px-4 py-4 text-[13px] leading-6 text-ink2">
            {projection ? (
              <>
                <p>{t(`goals.projection.reason.${projection.reason}`)}</p>
                {hasProjectedDate(projection) ? (
                  <dl className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-[180px_1fr]">
                    <dt>{t('goals.detail.plan.monthly')}</dt>
                    <dd className="num font-medium text-ink">
                      {formatVndScale(projection.plannedMonthlyContribution ?? 0)}
                    </dd>
                    <dt>{t('goals.detail.plan.remaining')}</dt>
                    <dd className="num font-medium text-ink">
                      {formatVndScale(projection.remainingAmount)}
                    </dd>
                    {projection.estimatedMonthsToGoal != null ? (
                      <>
                        <dt>{t('goals.detail.plan.estimatedMonths')}</dt>
                        <dd className="num font-medium text-ink">
                          {t('goals.projection.months', {
                            count: projection.estimatedMonthsToGoal,
                          })}
                        </dd>
                      </>
                    ) : null}
                  </dl>
                ) : null}
              </>
            ) : (
              <p>{t('goals.detail.plan.explainUnavailable')}</p>
            )}
          </Sunk>
        ) : null}
      </Panel>

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

/**
 * §10.2: the secondary metric step is 22px. 20px is not on the scale, and this
 * block sits beside the hero — a size nobody else uses reads as a mistake.
 */
function PictureMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] text-ink2">{label}</dt>
      <dd className="num mt-1 text-[22px] font-medium">{value}</dd>
    </div>
  )
}


