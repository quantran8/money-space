import { zodResolver } from '@hookform/resolvers/zod'
import { PiggyBank, Plus, Target } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  computeProgress,
  financialGoals as seedGoals,
  parseAmount,
  type GoalItem,
  type GoalPriority,
} from '@/lib/mock-data'
import {
  localizedMoneyAmount,
  localizedOptionalMoneyAmount,
  localizedOptionalText,
  localizedRequiredText,
} from '@/lib/validation'

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

export function GoalsPage() {
  const { t } = useTranslation()
  const [goals, setGoals] = useState<GoalItem[]>(seedGoals)
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

  function onSubmit(values: GoalForm) {
    const current = values.current.trim() || '0M'
    const target = values.target.trim()
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
    reset(defaultValues)
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={t('goals.header.eyebrow')}
        title={t('goals.header.title')}
        description={t('goals.header.description')}
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('goals.list.eyebrow')}</p>
              <h2 className="section-title mt-1 text-2xl font-semibold">{t('goals.list.title')}</h2>
            </div>
            <PiggyBank className="size-5 text-[hsl(var(--accent))]" />
          </div>

          <div className="space-y-5">
            {goals.map((goal) => (
              <div key={goal.id} className="rounded-[22px] border bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{goal.name}</p>
                      <Badge className={priorityTone[goal.priority]}>
                        {priorityLabels[goal.priority]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{goal.note}</p>
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {goal.current} / {goal.target}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Progress value={goal.progress} className="flex-1" />
                  <span className="money-number text-sm font-semibold">{goal.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('goals.form.eyebrow')}</p>
              <h2 className="section-title mt-1 text-2xl font-semibold">{t('goals.form.title')}</h2>
            </div>
            <Target className="size-5 text-[hsl(var(--accent))]" />
          </div>

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

            <Button type="submit" className="w-full" disabled={!isValid}>
              <Plus className="mr-2 size-4" />
              {t('goals.form.submit')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
