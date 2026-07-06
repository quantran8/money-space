import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, ReceiptText, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  eventCategoryLabels,
  eventTypeLabels,
  moneyEvents as seedEvents,
  type MoneyEventItem,
} from '@/lib/mock-data'
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

function getAmountTone(direction: MoneyEventItem['direction']) {
  if (direction === 'inflow') return 'text-[hsl(var(--status-green))]'
  if (direction === 'outflow') return 'text-[hsl(var(--status-red))]'
  return 'text-[hsl(var(--accent))]'
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
  const [events, setEvents] = useState(seedEvents)

  const {
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
    const nextEvent: MoneyEventItem = {
      title: values.title.trim(),
      amount: formatAmount(values.amount, values.type),
      note: values.note.trim() || 'Chưa có ghi chú thêm.',
      date: values.date.slice(8, 10) + ' Jul',
      type: values.type,
      category: values.category,
      direction: getDirection(values.type),
    }

    setEvents((current) => [nextEvent, ...current])
    reset(defaultValues)
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

          <div className="mt-6 space-y-4">
            {events.map((event) => (
              <div
                key={`${event.title}-${event.date}-${event.amount}`}
                className="rounded-[28px] border bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{event.title}</p>
                      <Badge>{eventTypeLabels[event.type]}</Badge>
                      <Badge>{eventCategoryLabels[event.category] ?? event.category}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                      {event.note}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`money-number text-2xl ${getAmountTone(event.direction)}`}>
                      {event.amount}
                    </p>
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{event.date}</p>
                  </div>
                </div>
              </div>
            ))}
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
                <Select aria-invalid={!!errors.type} {...register('type')}>
                  <option value="expense">Chi ra</option>
                  <option value="income">Tiền vào</option>
                  <option value="transfer">Chuyển khoản nội bộ</option>
                  <option value="goal_contribution">Góp vào mục tiêu</option>
                </Select>
              </FormField>
              <FormField label="Nhóm" error={errors.category?.message}>
                <Select aria-invalid={!!errors.category} {...register('category')}>
                  <option value="education">Giáo dục</option>
                  <option value="repair">Sửa chữa</option>
                  <option value="saving">Tiết kiệm</option>
                  <option value="income">Thu nhập</option>
                  <option value="household">Sinh hoạt</option>
                  <option value="other">Khác</option>
                </Select>
              </FormField>
            </div>

            <FormField label="Ngày xảy ra" error={errors.date?.message}>
              <Input type="date" aria-invalid={!!errors.date} {...register('date')} />
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
