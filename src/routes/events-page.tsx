import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, ReceiptText, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { EventsDataTable } from '@/components/events/events-data-table'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { moneyEvents as seedEvents, type MoneyEventItem } from '@/lib/mock-data'
import { isoDate, moneyAmount, optionalText, requiredText } from '@/lib/validation'

const eventSchema = z.object({
  title: requiredText('tên event'),
  amount: moneyAmount,
  type: z.enum(['expense', 'income', 'transfer', 'goal_contribution']),
  category: z.string().min(1),
  date: isoDate,
  note: optionalText(200),
})

type EventForm = z.infer<typeof eventSchema>

const defaultValues: EventForm = {
  title: '',
  amount: '',
  type: 'expense',
  category: 'other',
  date: '2026-07-05',
  note: '',
}

type EventRow = MoneyEventItem & {
  id: string
}

function createEventId() {
  return crypto.randomUUID()
}

function createEventRow(event: MoneyEventItem): EventRow {
  return { ...event, id: createEventId() }
}

function getDirection(type: EventForm['type']): MoneyEventItem['direction'] {
  if (type === 'income') return 'inflow'
  if (type === 'expense') return 'outflow'
  return 'neutral'
}

function formatAmount(rawAmount: string, type: EventForm['type']) {
  const normalized = rawAmount.trim()
  if (!normalized) return ''
  if (normalized.startsWith('+') || normalized.startsWith('-')) return normalized
  return type === 'expense' ? `-${normalized}` : `+${normalized}`
}

export function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>(() => seedEvents.map(createEventRow))

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues,
    mode: 'onChange',
  })

  function onSubmit(values: EventForm) {
    const nextEvent: EventRow = createEventRow({
      title: values.title.trim(),
      amount: formatAmount(values.amount, values.type),
      note: values.note.trim() || 'Chưa có ghi chú thêm.',
      date: values.date.slice(8, 10) + ' Jul',
      type: values.type,
      category: values.category,
      direction: getDirection(values.type),
    })

    setEvents((current) => [nextEvent, ...current])
    reset(defaultValues)
  }

  function handleDuplicateEvent(id: string) {
    setEvents((current) => {
      const target = current.find((event) => event.id === id)
      if (!target) return current

      const duplicated = createEventRow({
        ...target,
        title: `${target.title} (copy)`,
      })

      return [duplicated, ...current]
    })
  }

  function handleDeleteEvent(id: string) {
    setEvents((current) => current.filter((event) => event.id !== id))
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Timeline giải thích vì sao snapshot thay đổi"
        title="Sự kiện tài chính"
        description="Chỉ ghi những khoản đủ lớn hoặc đủ quan trọng để cả hai cùng hiểu chuyện gì vừa xảy ra."
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Money events</p>
              <h2 className="section-title mt-1 text-2xl font-semibold">
                Những sự kiện làm bức tranh tài chính thay đổi
              </h2>
            </div>
            <ReceiptText className="size-5 text-[hsl(var(--accent))]" />
          </div>

          <div className="mt-6">
            <EventsDataTable
              events={events}
              onDuplicate={handleDuplicateEvent}
              onDelete={handleDeleteEvent}
            />
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Nhập event</p>
              <h2 className="section-title mt-1 text-2xl font-semibold">
                Ghi một khoản lớn hoặc đáng chú ý
              </h2>
            </div>
            <Sparkles className="size-5 text-[hsl(var(--accent))]" />
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Tên event" error={errors.title?.message}>
                <Input
                  placeholder="Ví dụ: Đóng học phí tháng 7"
                  aria-invalid={!!errors.title}
                  {...register('title')}
                />
              </FormField>
              <FormField label="Số tiền" error={errors.amount?.message}>
                <Input
                  placeholder="Ví dụ: 12M"
                  aria-invalid={!!errors.amount}
                  {...register('amount')}
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Loại event" error={errors.type?.message}>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={!!errors.type}>
                        <SelectValue placeholder="Chọn loại event" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Chi ra</SelectItem>
                        <SelectItem value="income">Tiền vào</SelectItem>
                        <SelectItem value="transfer">Chuyển khoản nội bộ</SelectItem>
                        <SelectItem value="goal_contribution">Góp vào mục tiêu</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField label="Nhóm" error={errors.category?.message}>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={!!errors.category}>
                        <SelectValue placeholder="Chọn nhóm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="education">Giáo dục</SelectItem>
                        <SelectItem value="repair">Sửa chữa</SelectItem>
                        <SelectItem value="saving">Tiết kiệm</SelectItem>
                        <SelectItem value="income">Thu nhập</SelectItem>
                        <SelectItem value="household">Sinh hoạt</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>

            <FormField label="Ngày xảy ra" error={errors.date?.message}>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={!!errors.date}
                  />
                )}
              />
            </FormField>

            <FormField label="Ghi chú" error={errors.note?.message}>
              <Textarea
                placeholder="Thêm một câu ngắn để người kia hiểu vì sao snapshot thay đổi."
                aria-invalid={!!errors.note}
                {...register('note')}
              />
            </FormField>

            <div className="surface-muted rounded-[22px] p-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              Mục tiêu của money_events không phải ghi hết mọi giao dịch nhỏ. Chỉ cần ghi những
              khoản đủ lớn hoặc đủ quan trọng để cả hai cùng hiểu vì sao tiền tăng giảm.
            </div>

            <Button type="submit" className="w-full" disabled={!isValid}>
              <Plus className="mr-2 size-4" />
              Thêm money event
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
