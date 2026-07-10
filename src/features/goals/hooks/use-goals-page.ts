import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useGoals } from '@/features/goals/hooks/use-goals'
import { parseAmount, type GoalPriority } from '@/features/goals/model/goals'
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
  const { goals, createGoal, updateGoal, deleteGoal, isLoading } = useGoals()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [contributions, setContributions] = useState<Record<string, string>>({})
  const [recent, setRecent] = useState<RecentUpdate[]>([])
  const isEditing = editingId !== null
  const isSavingGoal = createGoal.isPending || updateGoal.isPending

  const stats = useMemo<GoalStats>(() => {
    const saved = goals.reduce((sum, goal) => sum + goalAmount(goal.currentAmount, goal.current), 0)
    const target = goals.reduce((sum, goal) => sum + goalAmount(goal.targetAmount, goal.target), 0)
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
      percent: Math.round((goalAmount(goal.currentAmount, goal.current) / stats.saved) * 100),
      color: allocationColors[index % allocationColors.length],
    }))
  }, [goals, stats.saved])

  const goalSchema = useMemo(() => buildGoalSchema(t), [t])

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
        current: amountToRaw(goalAmount(editingGoal.currentAmount, editingGoal.current)),
        target: amountToRaw(goalAmount(editingGoal.targetAmount, editingGoal.target)),
        priority: editingGoal.priority,
        deadline: editingGoal.deadline === 'No deadline' ? '' : (editingGoal.deadline ?? ''),
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
      const current = values.current.trim() || '0'
      const payload = {
        name: values.name.trim(),
        currentAmount: parseAmount(current),
        targetAmount: parseAmount(values.target.trim()),
        priority: values.priority,
        deadline: values.deadline || undefined,
        note: values.note.trim() || priorityLabels[values.priority],
      }

      if (editingId) {
        await updateGoal.mutateAsync({ goalId: editingId, payload })
        toast.success('Cap nhat muc tieu thanh cong.')
      } else {
        await createGoal.mutateAsync(payload)
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
    if (!raw) return
    const delta = parseAmount(raw)
    if (delta <= 0) return

    const goal = goals.find((item) => item.id === goalId)
    try {
      if (goal) {
        await updateGoal.mutateAsync({
          goalId,
          payload: {
            currentAmount: goalAmount(goal.currentAmount, goal.current) + delta,
          },
        })
        toast.success('Da cap nhat dong gop cho muc tieu.')
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Khong the cap nhat dong gop.'))
      return
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
  }

  function setContribution(goalId: string, value: string) {
    setContributions((prev) => ({ ...prev, [goalId]: value }))
  }

  const primaryRemaining = primaryGoal
    ? Math.max(
        goalAmount(primaryGoal.targetAmount, primaryGoal.target) -
          goalAmount(primaryGoal.currentAmount, primaryGoal.current),
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
    addContribution,
    isContributing: updateGoal.isPending,
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
