import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useAssets } from '@/features/assets/hooks/use-assets'
import { computeCurrentValue } from '@/features/assets/model/assets'
import { useGoals } from '@/features/goals/hooks/use-goals'
import { parseAmount, type GoalPriority } from '@/features/goals/model/goals'
import type { GoalAllocationPayload } from '@/features/goals/api/goals.repository'
import {
  allocationColors,
  amountToRaw,
  buildGoalSchema,
  defaultGoalFormValues,
  formatAmount,
  goalAmount,
  isWalletAssetType,
  priorityRank,
  suggestedPace,
  type GoalAllocationDraft,
  type GoalAllocationSlice,
  type GoalForm,
  type GoalStats,
} from '@/features/goals/model/goals-form'
import { getErrorMessage } from '@/shared/lib/get-error-message'

/**
 * What one draft row declares per month, as the API wants it.
 *
 * Only a wallet acting as the contribution source can carry an amount; anything
 * else sends `null`, which is also what an emptied field means — "this share
 * feeds the goal no fixed amount", distinct from 0.
 */
function allocationMonthly(row: GoalAllocationDraft): number | null {
  if (row.role !== 'contribution') return null
  const raw = row.monthlyContribution.trim()
  return raw === '' ? null : parseAmount(raw)
}

/**
 * The share this row declares, or null when the question did not apply.
 *
 * Read against the contested set rather than trusted from the draft: a wallet
 * that stopped being contested (the household moved the goal to another
 * priority) must not still submit the share it was asked for earlier.
 */
function allocationShare(
  row: GoalAllocationDraft,
  contested: ReadonlySet<string>,
): number | null {
  if (row.role !== 'contribution' || !contested.has(row.assetId)) return null
  const raw = row.sharePercent.trim()
  return raw === '' ? null : Number(raw)
}

export function useGoalsPage() {
  const { t } = useTranslation()
  const {
    goals,
    walletUsage,
    createGoal,
    updateGoal,
    deleteGoal,
    createAllocation,
    updateAllocation,
    deleteAllocation,
    isLoading,
  } = useGoals()
  const { assets, asOf } = useAssets()
  // EVERY asset, not just wallets: an asset-backed goal can be fed by gold,
  // crypto, stocks or cash alike — they are all part of what the household is
  // working towards. Used by the allocations panel.
  const assetOptions = useMemo(
    () =>
      assets.map((asset) => {
        const value = computeCurrentValue(asset, asOf) ?? 0
        return {
          value: asset.id,
          label: `${asset.name} · ${formatAmount(value)}`,
          name: asset.name,
          balance: value,
          // Seeds the share's role — a wallet is what money is contributed
          // through, everything else is value already held.
          type: asset.type,
        }
      }),
    [asOf, assets],
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
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

  // The household's wallets. A goal needs one behind it — money is only ever put
  // in through a wallet — and the form says so while it is being filled rather
  // than leaving the server to refuse the submit.
  const walletAssetIds = useMemo(
    () =>
      new Set(
        assets.filter((asset) => isWalletAssetType(asset.type)).map((asset) => asset.id),
      ),
    [assets],
  )

  /**
   * The other goals already drawing on each wallet, excluding the one being
   * edited. The schema matches their priority against the form's own, so the
   * share question appears exactly when two goals would have to divide a wallet.
   */
  const walletRivals = useMemo(() => {
    const rivals = new Map<string, Array<{ priority: GoalPriority; name: string }>>()
    for (const wallet of walletUsage) {
      rivals.set(
        wallet.assetId,
        wallet.goals
          .filter((row) => row.goalId !== editingId)
          .map((row) => ({ priority: row.priority, name: row.name })),
      )
    }
    return rivals
  }, [walletUsage, editingId])

  // Rebuilt when the mode flips: `current` is create-only (the API rejects it on
  // PATCH), so the schema must stop validating it once we are editing.
  const goalSchema = useMemo(
    () => buildGoalSchema(t, isEditing, walletAssetIds, walletRivals),
    [t, isEditing, walletAssetIds, walletRivals],
  )

  const priorityLabels: Record<GoalPriority, string> = {
    high: t('options.priority.high'),
    medium: t('options.priority.medium'),
    low: t('options.priority.low'),
  }

  // §22.10: the primary button stays enabled and reports what is missing on
  // click, so validation runs on submit and only re-runs per keystroke once the
  // household has seen an error. `shouldFocusError` moves the cursor there.
  const form = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: defaultGoalFormValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  })

  const { reset, handleSubmit, control } = form

  // The priority the household is on RIGHT NOW, which is what decides whether a
  // wallet is contested — not the priority the goal was saved with.
  const draftPriority = useWatch({ control, name: 'priority' })

  /** Wallets this goal would have to divide with another at the same priority. */
  const contestedWalletIds = useMemo(() => {
    const ids = new Set<string>()
    for (const [assetId, rivals] of walletRivals) {
      if (rivals.some((rival) => rival.priority === draftPriority)) ids.add(assetId)
    }
    return ids
  }, [walletRivals, draftPriority])

  /** Which goals sit on each wallet, so a contested row can name them. */
  const walletGoalNames = useMemo(() => {
    const names = new Map<string, string[]>()
    for (const [assetId, rivals] of walletRivals) {
      names.set(
        assetId,
        rivals.map((rival) => rival.name),
      )
    }
    return names
  }, [walletRivals])

  const editingGoal = editingId ? goals.find((goal) => goal.id === editingId) : undefined
  const deletingGoal = deleteId ? goals.find((goal) => goal.id === deleteId) : undefined

  useEffect(() => {
    if (!formOpen) return
    if (editingGoal) {
      reset({
        name: editingGoal.name,
        target: amountToRaw(goalAmount(editingGoal.targetAmount)),
        // Read-only context for the dialog's summary; the API ignores it.
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
      const payload = {
        name: values.name.trim(),
        targetAmount: parseAmount(values.target.trim()),
        priority: values.priority,
        targetDate: values.targetDate || undefined,
        note: values.note.trim() || priorityLabels[values.priority],
        // No pace here. It is declared per wallet, on the allocations, and the
        // server keeps the goal's figure as their sum — sending one from this
        // form would put a number on the goal that no wallet underneath it
        // claims.
      }

      if (editingId) {
        // No progress figure on update: it is derived from the goal's
        // allocations, which are edited through their own routes.
        await updateGoal.mutateAsync({ goalId: editingId, payload })
        toast.success(t('goals.toast.updated'))
      } else {
        // Create-only: lets a household record savings that predate the app.
        // An asset-backed goal sends no starting amount — its progress comes
        // from the assets allocated to it (the schema blocks it too).
        // The goal and the assets behind it are declared together — a goal with
        // no assets has no progress and no way to gain any.
        await createGoal.mutateAsync({
          ...payload,
          allocations: values.allocations.map((row) =>
            // Same invariant the form renders by: a contribution is an amount,
            // never a percent. Read here rather than trusted, so a row that got
            // its shape from anywhere else cannot be submitted as one thing while
            // the screen showed another.
            row.role !== 'contribution' && row.kind === 'percent'
              ? {
                  assetId: row.assetId,
                  kind: 'percent' as const,
                  role: row.role,
                  monthlyContribution: allocationMonthly(row),
                  percent: Number(row.percent),
                }
              : {
                  assetId: row.assetId,
                  kind: 'fixed' as const,
                  role: row.role,
                  monthlyContribution: allocationMonthly(row),
                  // Only sent for a contested wallet: elsewhere there is nothing
                  // to divide, and a share nobody was asked for is worse than
                  // none — it would settle a future tie by a number the
                  // household never chose.
                  sharePercent: allocationShare(row, contestedWalletIds),
                  allocatedAmount: parseAmount(row.amount.trim()),
                },
          ),
        })
        toast.success(t('goals.toast.created'))
      }

      handleFormOpenChange(false)
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          editingId ? t('goals.toast.updateFailed') : t('goals.toast.createFailed'),
        ),
      )
    }
  }

  async function handleDeleteGoal(goalId: string) {
    try {
      await deleteGoal.mutateAsync(goalId)
      toast.success(t('goals.toast.deleted'))
      if (editingId === goalId) handleFormOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, t('goals.toast.deleteFailed')))
      throw error
    }
  }

  /**
   * Add a share of an asset to an asset-backed goal.
   *
   * The server refuses a claim that would promise more of an asset than it
   * holds (counting every goal, not just this one) — that message is surfaced
   * as-is, because it names exactly how much is still free.
   */
  async function addAllocation(goalId: string, payload: GoalAllocationPayload) {
    try {
      await createAllocation.mutateAsync({ goalId, payload })
      toast.success(t('goals.toast.allocationSaved'))
      return true
    } catch (error) {
      toast.error(getErrorMessage(error, t('goals.toast.allocationFailed')))
      return false
    }
  }

  /** Change an existing share — the amount or the percent, not the asset. */
  async function editAllocation(
    goalId: string,
    allocationId: string,
    payload: Omit<GoalAllocationPayload, 'assetId'>,
  ) {
    try {
      await updateAllocation.mutateAsync({ goalId, allocationId, payload })
      toast.success(t('goals.toast.allocationSaved'))
      return true
    } catch (error) {
      toast.error(getErrorMessage(error, t('goals.toast.allocationFailed')))
      return false
    }
  }

  async function removeAllocation(goalId: string, allocationId: string) {
    try {
      await deleteAllocation.mutateAsync({ goalId, allocationId })
      toast.success(t('goals.toast.allocationRemoved'))
      return true
    } catch (error) {
      toast.error(getErrorMessage(error, t('goals.toast.allocationFailed')))
      return false
    }
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
    primaryGoal,
    primaryRemaining,
    primaryPace,
    priorityLabels,
    // contributions
    assetOptions,
    // Wallets this goal would have to share with another at the same priority —
    // the rows the form asks a split for.
    contestedWalletIds,
    walletGoalNames,
    walletUsage,
    addAllocation,
    editAllocation,
    removeAllocation,
    isSavingAllocation:
      createAllocation.isPending ||
      updateAllocation.isPending ||
      deleteAllocation.isPending,
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
