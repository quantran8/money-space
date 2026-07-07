import { zodResolver } from '@hookform/resolvers/zod'
import { MoreVertical, Pencil, PiggyBank, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { PageHeader } from '@/app/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  computeProgress,
  parseAmount,
  type GoalItem,
  type GoalPriority,
} from '@/features/goals/model/goals'
import { useGoals } from '@/features/goals/hooks/use-goals'
import {
  localizedMoneyAmount,
  localizedOptionalMoneyAmount,
  localizedOptionalText,
  localizedRequiredText,
} from '@/shared/lib/validation'

type GoalForm = {
  name: string
  current: string
  target: string
  priority: GoalPriority
  note: string
}

const defaultValues: GoalForm = {
  name: '',
  current: '',
  target: '',
  priority: 'medium',
  note: '',
}

const priorityTone: Record<GoalPriority, string> = {
  high: 'bg-[hsla(var(--status-red),0.1)] text-[hsl(var(--status-red))]',
  medium: 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]',
  low: 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]',
}

function formatAmount(value: number) {
  return `${Math.round(value * 10) / 10}M`
}

export function GoalsPage() {
  const { t } = useTranslation()
  const { goals: seedGoals } = useGoals()
  const [goals, setGoals] = useState<GoalItem[]>(seedGoals)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [contributions, setContributions] = useState<Record<string, string>>({})
  const isEditing = editingId !== null

  const goalSchema = z
    .object({
      name: localizedRequiredText(t, t('goals.form.name')),
      current: localizedOptionalMoneyAmount(t),
      target: localizedMoneyAmount(t),
      priority: z.enum(['high', 'medium', 'low']),
      note: localizedOptionalText(t, 120),
    })
    .refine((data) => parseAmount(data.current || '0') <= parseAmount(data.target), {
      path: ['current'],
      message: t('validation.currentExceedsTarget'),
    })
  const priorityLabels: Record<GoalPriority, string> = {
    high: t('options.priority.high'),
    medium: t('options.priority.medium'),
    low: t('options.priority.low'),
  }

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues,
    mode: 'onChange',
  })

  const editingGoal = editingId ? goals.find((goal) => goal.id === editingId) : undefined
  const deletingGoal = deleteId ? goals.find((goal) => goal.id === deleteId) : undefined

  useEffect(() => {
    if (!formOpen) return
    if (editingGoal) {
      reset({
        name: editingGoal.name,
        current: editingGoal.current,
        target: editingGoal.target,
        priority: editingGoal.priority,
        note: editingGoal.note,
      })
    } else {
      reset(defaultValues)
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

  function onSubmit(values: GoalForm) {
    const current = values.current.trim() || '0M'
    const target = values.target.trim()

    if (editingId) {
      setGoals((prev) =>
        prev.map((goal) =>
          goal.id === editingId
            ? {
                ...goal,
                name: values.name.trim(),
                current,
                target,
                progress: computeProgress(current, target),
                priority: values.priority,
                note: values.note.trim() || priorityLabels[values.priority],
              }
            : goal,
        ),
      )
    } else {
      const nextGoal: GoalItem = {
        id: `g${goals.length + 1}-${values.name}`,
        name: values.name.trim(),
        current,
        target,
        progress: computeProgress(current, target),
        priority: values.priority,
        note: values.note.trim() || priorityLabels[values.priority],
      }
      setGoals((prev) => [...prev, nextGoal])
    }

    handleFormOpenChange(false)
  }

  function deleteGoal(goalId: string) {
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId))
    setContributions((prev) => {
      const next = { ...prev }
      delete next[goalId]
      return next
    })
    if (editingId === goalId) handleFormOpenChange(false)
  }

  function addContribution(goalId: string) {
    const raw = contributions[goalId]?.trim()
    if (!raw) return
    const delta = parseAmount(raw)
    if (delta <= 0) return

    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal
        const nextCurrent = formatAmount(parseAmount(goal.current) + delta)
        return {
          ...goal,
          current: nextCurrent,
          progress: computeProgress(nextCurrent, goal.target),
        }
      }),
    )
    setContributions((prev) => ({ ...prev, [goalId]: '' }))
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={t('goals.header.eyebrow')}
        title={t('goals.header.title')}
        description={t('goals.header.description')}
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            {t('goals.form.submit')}
          </Button>
        }
      />

      <Card>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('goals.list.eyebrow')}</p>
            <h2 className="section-title mt-1 text-2xl font-semibold">{t('goals.list.title')}</h2>
          </div>
          <PiggyBank className="size-5 text-[hsl(var(--accent))]" />
        </div>

        <div className="space-y-5">
          {goals.length === 0 ? (
            <div className="rounded-3xl border border-dashed bg-white p-8 text-center">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {t('goals.list.empty')}
              </p>
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="mr-2 size-4" />
                {t('goals.form.submit')}
              </Button>
            </div>
          ) : (
            goals.map((goal) => (
              <div key={goal.id} className="surface-muted rounded-3xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{goal.name}</p>
                      <Badge className={priorityTone[goal.priority]}>
                        {priorityLabels[goal.priority]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{goal.note}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                      {goal.current} / {goal.target}
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0"
                          aria-label={t('common.actions')}
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(goal.id)}>
                          <Pencil className="size-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-[hsl(var(--status-red))] focus:text-[hsl(var(--status-red))]"
                          onSelect={() => setDeleteId(goal.id)}
                        >
                          <Trash2 className="size-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Progress value={goal.progress} className="flex-1" />
                  <span className="money-number text-sm font-semibold">{goal.progress}%</span>
                </div>
                <form
                  className="mt-3 flex items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    addContribution(goal.id)
                  }}
                >
                  <Input
                    value={contributions[goal.id] ?? ''}
                    onChange={(event) =>
                      setContributions((prev) => ({ ...prev, [goal.id]: event.target.value }))
                    }
                    placeholder={t('goals.actions.contributePlaceholder')}
                    className="h-9 flex-1"
                    aria-label={t('goals.actions.contribute')}
                  />
                  <Button type="submit" variant="secondary" size="sm" className="shrink-0">
                    <Plus className="mr-1 size-4" />
                    {t('goals.actions.contribute')}
                  </Button>
                </form>
              </div>
            ))
          )}
        </div>
      </Card>

      <ResponsiveDialog open={formOpen} onOpenChange={handleFormOpenChange}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {isEditing ? t('goals.form.editTitle') : t('goals.form.title')}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {isEditing ? t('goals.form.editEyebrow') : t('goals.form.eyebrow')}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormField label={t('goals.form.name')} error={errors.name?.message}>
              <Input
                placeholder={t('goals.form.namePlaceholder')}
                aria-invalid={!!errors.name}
                {...register('name')}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t('goals.form.current')} error={errors.current?.message}>
                <Input
                  placeholder={t('goals.form.currentPlaceholder')}
                  aria-invalid={!!errors.current}
                  {...register('current')}
                />
              </FormField>
              <FormField label={t('goals.form.target')} error={errors.target?.message}>
                <Input
                  placeholder={t('goals.form.targetPlaceholder')}
                  aria-invalid={!!errors.target}
                  {...register('target')}
                />
              </FormField>
            </div>

            <FormField label={t('goals.form.priority')} error={errors.priority?.message}>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={!!errors.priority}>
                      <SelectValue placeholder={t('goals.form.priorityPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">{t('options.priority.high')}</SelectItem>
                      <SelectItem value="medium">{t('options.priority.medium')}</SelectItem>
                      <SelectItem value="low">{t('options.priority.low')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label={t('goals.form.note')} error={errors.note?.message}>
              <Input
                placeholder={t('goals.form.notePlaceholder')}
                aria-invalid={!!errors.note}
                {...register('note')}
              />
            </FormField>

            <ResponsiveDialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleFormOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={!isValid}>
                {isEditing ? t('goals.form.save') : t('goals.form.submit')}
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('common.confirmDelete.title')}
        description={t('common.confirmDelete.description', { name: deletingGoal?.name ?? '' })}
        onConfirm={() => deleteId && deleteGoal(deleteId)}
      />
    </div>
  )
}
