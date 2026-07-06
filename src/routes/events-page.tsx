import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, ReceiptText, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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
import {
  localizedIsoDate,
  localizedMoneyAmount,
  localizedOptionalText,
  localizedRequiredText,
} from '@/lib/validation'

type EventForm = {
  title: string
  amount: string
  type: MoneyEventItem['type']
  category: string
  date: string
  note: string
}

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
  const { t } = useTranslation()
  const [events, setEvents] = useState<EventRow[]>(() => seedEvents.map(createEventRow))
  const eventSchema = z.object({
    title: localizedRequiredText(t, t('events.form.name')),
    amount: localizedMoneyAmount(t),
    type: z.enum(['expense', 'income', 'transfer', 'goal_contribution']),
    category: z.string().min(1),
    date: localizedIsoDate(t),
    note: localizedOptionalText(t, 200),
  })

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
      note: values.note.trim() || t('common.noAdditionalNote'),
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
        title: `${target.title}${t('events.form.duplicateSuffix')}`,
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
        eyebrow={t('events.header.eyebrow')}
        title={t('events.header.title')}
        description={t('events.header.description')}
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('events.table.title')}</p>
              <h2 className="section-title mt-1 text-2xl font-semibold">
                {t('events.table.subtitle')}
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
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('events.form.eyebrow')}</p>
              <h2 className="section-title mt-1 text-2xl font-semibold">
                {t('events.form.title')}
              </h2>
            </div>
            <Sparkles className="size-5 text-[hsl(var(--accent))]" />
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t('events.form.name')} error={errors.title?.message}>
                <Input
                  placeholder={t('events.form.namePlaceholder')}
                  aria-invalid={!!errors.title}
                  {...register('title')}
                />
              </FormField>
              <FormField label={t('events.form.amount')} error={errors.amount?.message}>
                <Input
                  placeholder={t('events.form.amountPlaceholder')}
                  aria-invalid={!!errors.amount}
                  {...register('amount')}
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t('events.form.type')} error={errors.type?.message}>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={!!errors.type}>
                        <SelectValue placeholder={t('events.form.typePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">{t('options.eventType.expense')}</SelectItem>
                        <SelectItem value="income">{t('options.eventType.income')}</SelectItem>
                        <SelectItem value="transfer">{t('options.eventType.transfer')}</SelectItem>
                        <SelectItem value="goal_contribution">{t('options.eventType.goal_contribution')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField label={t('events.form.category')} error={errors.category?.message}>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={!!errors.category}>
                        <SelectValue placeholder={t('events.form.categoryPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="education">{t('options.eventCategory.education')}</SelectItem>
                        <SelectItem value="repair">{t('options.eventCategory.repair')}</SelectItem>
                        <SelectItem value="saving">{t('options.eventCategory.saving')}</SelectItem>
                        <SelectItem value="income">{t('options.eventCategory.income')}</SelectItem>
                        <SelectItem value="household">{t('options.eventCategory.household')}</SelectItem>
                        <SelectItem value="other">{t('options.eventCategory.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>

            <FormField label={t('events.form.date')} error={errors.date?.message}>
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

            <FormField label={t('events.form.note')} error={errors.note?.message}>
              <Textarea
                placeholder={t('events.form.notePlaceholder')}
                aria-invalid={!!errors.note}
                {...register('note')}
              />
            </FormField>

            <div className="surface-muted rounded-[22px] p-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              {t('events.form.helper')}
            </div>

            <Button type="submit" className="w-full" disabled={!isValid}>
              <Plus className="mr-2 size-4" />
              {t('events.form.submit')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
