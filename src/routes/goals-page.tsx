import { zodResolver } from '@hookform/resolvers/zod'
import { PiggyBank, Plus, Target } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
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
  priorityLabels,
  type GoalItem,
  type GoalPriority,
} from '@/lib/mock-data'
import { moneyAmount, optionalMoneyAmount, optionalText, requiredText } from '@/lib/validation'

const goalSchema = z
  .object({
    name: requiredText('tên mục tiêu'),
    current: optionalMoneyAmount,
    target: moneyAmount,
    priority: z.enum(['high', 'medium', 'low']),
    note: optionalText(120),
  })
  .refine(
    (data) => parseAmount(data.current || '0') <= parseAmount(data.target),
    {
      path: ['current'],
      message: 'Số đã có không được lớn hơn mục tiêu',
    },
  )

type GoalForm = z.infer<typeof goalSchema>

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
  const [goals, setGoals] = useState<GoalItem[]>(seedGoals)

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
        eyebrow="Mục tiêu tài chính"
        title="Giữ tiền có lý do rõ ràng"
        description="Mỗi mục tiêu nên đủ rõ để cả hai biết đang tiết kiệm cho điều gì và tiến độ đã đi tới đâu."
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Danh sách mục tiêu</p>
              <h2 className="section-title mt-1 text-2xl font-semibold">Tiến độ mục tiêu chung</h2>
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
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Thêm mục tiêu</p>
              <h2 className="section-title mt-1 text-2xl font-semibold">Đặt một mục tiêu mới</h2>
            </div>
            <Target className="size-5 text-[hsl(var(--accent))]" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormField label="Tên mục tiêu" error={errors.name?.message}>
              <Input
                placeholder="Ví dụ: Mua xe"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Đã có" error={errors.current?.message}>
                <Input
                  placeholder="Ví dụ: 10M"
                  aria-invalid={!!errors.current}
                  {...register('current')}
                />
              </FormField>
              <FormField label="Mục tiêu" error={errors.target?.message}>
                <Input
                  placeholder="Ví dụ: 100M"
                  aria-invalid={!!errors.target}
                  {...register('target')}
                />
              </FormField>
            </div>

            <FormField label="Mức ưu tiên" error={errors.priority?.message}>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={!!errors.priority}>
                      <SelectValue placeholder="Chọn mức ưu tiên" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Ưu tiên cao</SelectItem>
                      <SelectItem value="medium">Bình thường</SelectItem>
                      <SelectItem value="low">Ưu tiên thấp</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Ghi chú" error={errors.note?.message}>
              <Input
                placeholder="Ví dụ: Để dành cho năm sau"
                aria-invalid={!!errors.note}
                {...register('note')}
              />
            </FormField>

            <Button type="submit" className="w-full" disabled={!isValid}>
              <Plus className="mr-2 size-4" />
              Thêm mục tiêu
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
