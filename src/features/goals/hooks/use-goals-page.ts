import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useQueryClient } from '@tanstack/react-query'

import { useAssets } from '@/features/assets/hooks/use-assets'
import { computeCurrentValue } from '@/features/assets/model/assets'
import { useEvents } from '@/features/events/hooks/use-events'
import { useGoals } from '@/features/goals/hooks/use-goals'
import { parseAmount, type GoalPriority } from '@/features/goals/model/goals'
import { queryKeys } from '@/shared/api/query-keys'
import {
  allocationColors,
  amountToRaw,
  buildGoalSchema,
  defaultGoalFormValues,
  formatAmount,
  goalAmount,
  priorityRank,
  suggestedPace,
  type GoalAllocationSlice,
  type GoalForm,
  type GoalStats,
  type RecentUpdate,
} from '@/features/goals/model/goals-form'
import { getErrorMessage } from '@/shared/lib/get-error-message'

export function useGoalsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { goals, activeHouseholdId, createGoal, updateGoal, deleteGoal, isLoading } = useGoals()
  const { assets, asOf } = useAssets()
  // Each contribution debits a wallet — its `fromAssetId` must be a spendable
  // cash / bank_account asset (chosen per contribution, not stored on the goal).
  // Same filter the asset-sale wallet picker uses (see use-asset-sale).
  const walletOptions = useMemo(
    () =>
      assets
        .filter((asset) => asset.type === 'cash' || asset.type === 'bank_account')
        .map((asset) => {
          const balance = computeCurrentValue(asset, asOf) ?? 0
          return {
            value: asset.id,
            label: `${asset.name} · ${formatAmount(balance)}`,
            name: asset.name,
            balance,
          }
        }),
    [asOf, assets],
  )
  // Contributions are recorded as `goal_contribution` money events; the goal's
  // currentAmount/progress is derived server-side from their sum (there is no
  // stored current_amount column). `createEvent` already invalidates events,
  // dashboard, debts and assets — we additionally refetch goals below so the
  // progress bar reflects the new contribution.
  const { createEvent } = useEvents()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [contributions, setContributions] = useState<Record<string, string>>({})
  // Per-goal chosen source wallet for the quick-add contribution row. Defaults to
  // the first wallet (below) so the required picker starts pre-filled.
  const [contributionSources, setContributionSources] = useState<Record<string, string>>({})
  const [recent, setRecent] = useState<RecentUpdate[]>([])
  const isEditing = editingId !== null
  const isSavingGoal = createGoal.isPending || updateGoal.isPending

  const stats = useMemo<GoalStats>(() => {
    const saved = goals.reduce((sum, goal) => sum + goalAmount(goal.currentAmount), 0)
    const target = goals.reduce((sum, goal) => sum + goalAmount(goal.targetAmount), 0)
    const avg = goals.length
      ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)
      : 0
    return { saved, target, avg }
  }, [goals])

  // Primary goal: highest priority, then furthest along.
  const primaryGoal = useMemo(() => {
    if (goals.length === 0) return undefined
    return [...goals].sort(
      (a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.progress - a.progress,
    )[0]
  }, [goals])

  // Share of total saved held by each goal, for the allocation panel.
  const allocation = useMemo<GoalAllocationSlice[]>(() => {
    if (stats.saved <= 0) return []
    return goals.map((goal, index) => ({
      id: goal.id,
      name: goal.name,
      percent: Math.round((goalAmount(goal.currentAmount) / stats.saved) * 100),
      color: allocationColors[index % allocationColors.length],
    }))
  }, [goals, stats.saved])

  // Rebuilt when the mode flips: `current` is create-only (the API rejects it on
  // PATCH), so the schema must stop validating it once we are editing.
  const goalSchema = useMemo(() => buildGoalSchema(t, isEditing), [t, isEditing])

  const priorityLabels: Record<GoalPriority, string> = {
    high: t('options.priority.high'),
    medium: t('options.priority.medium'),
    low: t('options.priority.low'),
  }

  const form = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: defaultGoalFormValues,
    mode: 'onChange',
  })

  const { reset, handleSubmit } = form

  const editingGoal = editingId ? goals.find((goal) => goal.id === editingId) : undefined
  const deletingGoal = deleteId ? goals.find((goal) => goal.id === deleteId) : undefined

  useEffect(() => {
    if (!formOpen) return
    if (editingGoal) {
      reset({
        name: editingGoal.name,
        target: amountToRaw(goalAmount(editingGoal.targetAmount)),
        // Shown read-only while editing (the API ignores it on PATCH), but kept
        // in form state so the summary can report progress without a second read.
        current: amountToRaw(goalAmount(editingGoal.currentAmount)),
        plannedMonthly: amountToRaw(editingGoal.plannedMonthlyContribution ?? undefined),
        priority: editingGoal.priority,
        targetDate: editingGoal.targetDate === 'No deadline' ? '' : (editingGoal.targetDate ?? ''),
        note: editingGoal.note,
      })
    } else {
      reset(defaultGoalFormValues)
    }
  }, [formOpen, editingGoal, reset])

  // Resolve the first wallet as a display default without synchronously writing
  // derived state from an effect. Explicit user choices still win per goal.
  const resolvedContributionSources = useMemo(() => {
    const fallback = walletOptions[0]?.value
    return Object.fromEntries(
      goals.map((goal) => [goal.id, contributionSources[goal.id] ?? fallback ?? '']),
    )
  }, [contributionSources, goals, walletOptions])

  function openCreate() {
    setEditingId(null)
    setFormOpen(true)
  }

  function openEdit(goalId: string) {
    setEditingId(goalId)
    setFormOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open)
    if (!open) setEditingId(null)
  }

  async function onSubmit(values: GoalForm) {
    try {
      const plannedMonthly = parseAmount(values.plannedMonthly.trim())
      const payload = {
        name: values.name.trim(),
        targetAmount: parseAmount(values.target.trim()),
        priority: values.priority,
        targetDate: values.targetDate || undefined,
        note: values.note.trim() || priorityLabels[values.priority],
        // Sent as 0 rather than omitted when cleared, so clearing the field on an
        // existing goal actually retracts the declared pace. Omitting it would
        // make the backend fall back to the stored value (`?? goal.planned…`),
        // leaving a projection the household no longer stands behind.
        plannedMonthlyContribution: plannedMonthly,
      }

      if (editingId) {
        // No currentAmount on update: `UpdateFinancialGoalDto` omits it so the
        // stored total cannot diverge from the contribution history. Raise
        // progress with a goal_contribution event (addContribution) instead.
        await updateGoal.mutateAsync({ goalId: editingId, payload })
        toast.success('Cap nhat muc tieu thanh cong.')
      } else {
        // Create-only: lets onboarding record savings that predate the app.
        await createGoal.mutateAsync({
          ...payload,
          currentAmount: parseAmount(values.current.trim()),
        })
        toast.success('Tao muc tieu thanh cong.')
      }

      handleFormOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, editingId ? 'Khong the cap nhat muc tieu.' : 'Khong the tao muc tieu.'))
    }
  }

  async function handleDeleteGoal(goalId: string) {
    try {
      await deleteGoal.mutateAsync(goalId)
      toast.success('Da xoa muc tieu.')
      setContributions((prev) => {
        const next = { ...prev }
        delete next[goalId]
        return next
      })
      if (editingId === goalId) handleFormOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Khong the xoa muc tieu.'))
      throw error
    }
  }

  async function addContribution(goalId: string) {
    const raw = contributions[goalId]?.trim()
    if (!raw) return false
    const delta = parseAmount(raw)
    if (delta <= 0) return false

    const goal = goals.find((item) => item.id === goalId)
    if (!goal) return false

    // A contribution moves money out of a spendable wallet — the source is chosen
    // per contribution and is required (the backend rejects a goal_contribution
    // with no / non-wallet fromAssetId). Block + prompt when none is picked.
    const fromAssetId = resolvedContributionSources[goalId]
    if (!fromAssetId) {
      toast.error(t('goals.actions.sourceRequired'))
      return false
    }
    try {
      await createEvent.mutateAsync({
        amount: delta,
        isoDate: new Date().toISOString().slice(0, 10),
        type: 'goal_contribution',
        category: 'saving',
        // `title` was dropped; the contribution label now lives in the note.
        note: t('goals.recent.added', { value: formatAmount(delta), name: goal.name }),
        financialGoalId: goalId,
        // Debits the chosen wallet; backend requires a cash/bank fromAssetId for
        // goal_contribution. See memory/goals.md.
        fromAssetId,
      })
      // currentAmount is derived from goal_contribution events — refetch goals
      // so the progress bar and allocation reflect this contribution. Not
      // awaited: the contribution is saved once the write above returns, and
      // awaiting the refetch only delays the toast.
      if (activeHouseholdId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.goals(activeHouseholdId) })
      }
      toast.success('Da cap nhat dong gop cho muc tieu.')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Khong the cap nhat dong gop.'))
      return false
    }
    setContributions((prev) => ({ ...prev, [goalId]: '' }))
    if (goal) {
      setRecent((prev) =>
        [
          {
            id: `${goalId}-${prev.length}`,
            text: t('goals.recent.added', { value: formatAmount(delta), name: goal.name }),
          },
          ...prev,
        ].slice(0, 4),
      )
    }
    return true
  }

  function setContribution(goalId: string, value: string) {
    setContributions((prev) => ({ ...prev, [goalId]: value }))
  }

  function setContributionSource(goalId: string, assetId: string) {
    setContributionSources((prev) => ({ ...prev, [goalId]: assetId }))
  }

  const primaryRemaining = primaryGoal
    ? Math.max(
        goalAmount(primaryGoal.targetAmount) -
          goalAmount(primaryGoal.currentAmount),
        0,
      )
    : 0
  const primaryPace = primaryGoal ? suggestedPace(primaryGoal) : 0

  return {
    // data
    goals,
    isLoading,
    stats,
    allocation,
    recent,
    primaryGoal,
    primaryRemaining,
    primaryPace,
    priorityLabels,
    // contributions
    contributions,
    setContribution,
    contributionSources: resolvedContributionSources,
    setContributionSource,
    walletOptions,
    addContribution,
    isContributing: createEvent.isPending,
    // form
    form,
    isEditing,
    isSavingGoal,
    submit: handleSubmit(onSubmit),
    // dialog + actions
    formOpen,
    openCreate,
    openEdit,
    handleFormOpenChange,
    deleteId,
    setDeleteId,
    deletingGoal,
    isDeleting: deleteGoal.isPending,
    handleDeleteGoal,
  }
}
