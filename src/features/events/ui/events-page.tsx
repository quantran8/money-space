import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ListChecks, Plus, ReceiptText, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { EventsDataTable } from '@/features/events/ui/events-data-table'
import { PageHeader } from '@/app/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { SummaryStrip, SummaryTile } from '@/components/ui/summary-strip'
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
import { Textarea } from '@/components/ui/textarea'
import { useEvents } from '@/features/events/hooks/use-events'
import type { MoneyEventItem } from '@/features/events/model/events'
import { monthKeyOf, monthOptionsOf } from '@/features/events/model/events-month'
import { formatVndShort } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'
import {
  localizedIsoDate,
  localizedMoneyAmount,
  localizedOptionalText,
  localizedRequiredText,
} from '@/shared/lib/validation'

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

type EventFilter = 'all' | 'inflow' | 'outflow' | 'goal'

const shortMonthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Format an ISO date "2026-07-05" into the short "05 Jul" display style. */
function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-')
  const name = shortMonthNames[Number(month) - 1] ?? month
  return `${day} ${name}`
}

/** Parse a signed shorthand amount ("+35M", "-1,2M", "500K") into a VND number. */
function parseSignedAmountToVnd(raw: string): number {
  const normalized = raw.trim().replace(/,/g, '.')
  const match = normalized.match(/^([+-]?)(\d+(?:\.\d+)?)\s*([kKmMbB]?)$/)
  if (!match) return 0
  const sign = match[1] === '-' ? -1 : 1
  const base = Number(match[2])
  const suffix = match[3].toLowerCase()
  const factor =
    suffix === 'k' ? 1_000 : suffix === 'm' ? 1_000_000 : suffix === 'b' ? 1_000_000_000 : 1
  return sign * base * factor
}

function formatAmount(rawAmount: string, type: EventForm['type']) {
  const normalized = rawAmount.trim()
  if (!normalized) return ''
  if (normalized.startsWith('+') || normalized.startsWith('-')) return normalized
  return type === 'expense' ? `-${normalized}` : `+${normalized}`
}

export function EventsPage() {
  const { t } = useTranslation()
  const { events: seedEvents } = useEvents()
  const [events, setEvents] = useState<EventRow[]>(() => seedEvents.map(createEventRow))
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filter, setFilter] = useState<EventFilter>('all')
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [query, setQuery] = useState('')

  const eventFilters: { key: EventFilter; label: string }[] = [
    { key: 'all', label: t('events.filters.all') },
    { key: 'inflow', label: t('events.filters.inflow') },
    { key: 'outflow', label: t('events.filters.outflow') },
    { key: 'goal', label: t('events.filters.goal') },
  ]

  const monthOptions = useMemo(() => monthOptionsOf(events), [events])

  // Events scoped to the selected month — drives both the summary strip and list.
  const monthScopedEvents = useMemo(
    () =>
      monthFilter === 'all'
        ? events
        : events.filter((event) => monthKeyOf(event.isoDate) === monthFilter),
    [events, monthFilter],
  )

  const totals = useMemo(() => {
    let inflow = 0
    let outflow = 0
    for (const event of monthScopedEvents) {
      const value = parseSignedAmountToVnd(event.amount)
      if (value >= 0) inflow += value
      else outflow += value
    }
    return { inflow, outflow, net: inflow + outflow }
  }, [monthScopedEvents])

  const inflowMagnitude = totals.inflow
  const outflowMagnitude = Math.abs(totals.outflow)
  const flowMax = Math.max(inflowMagnitude, outflowMagnitude, 1)

  const filteredEvents = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return monthScopedEvents.filter((event) => {
      if (filter === 'goal' && event.type !== 'goal_contribution') return false
      if ((filter === 'inflow' || filter === 'outflow') && event.direction !== filter) return false
      if (!needle) return true
      return (
        event.title.toLowerCase().includes(needle) || event.note.toLowerCase().includes(needle)
      )
    })
  }, [monthScopedEvents, filter, query])

  const reviewEvent = useMemo(
    () =>
      monthScopedEvents
        .filter((event) => event.direction === 'outflow')
        .sort((a, b) => parseSignedAmountToVnd(a.amount) - parseSignedAmountToVnd(b.amount))[0],
    [monthScopedEvents],
  )
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

  const deletingEvent = deleteId ? events.find((event) => event.id === deleteId) : undefined

  useEffect(() => {
    if (!formOpen) return
    reset(defaultValues)
  }, [formOpen, reset])

  function openCreate() {
    setFormOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open)
  }

  function onSubmit(values: EventForm) {
    const nextEvent: EventRow = createEventRow({
      title: values.title.trim(),
      amount: formatAmount(values.amount, values.type),
      note: values.note.trim() || t('common.noAdditionalNote'),
      date: formatShortDate(values.date),
      isoDate: values.date,
      type: values.type,
      category: values.category,
      direction: getDirection(values.type),
    })

    setEvents((current) => [nextEvent, ...current])
    handleFormOpenChange(false)
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

  function deleteEvent(id: string) {
    setEvents((current) => current.filter((event) => event.id !== id))
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={t('events.header.eyebrow')}
        title={t('events.header.title')}
        description={t('events.header.description')}
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            {t('events.form.submit')}
          </Button>
        }
      />

      <SummaryStrip>
        <SummaryTile
          label={t('events.strip.count')}
          value={t('events.strip.countValue', { count: monthScopedEvents.length })}
        />
        <SummaryTile
          label={t('events.strip.inflow')}
          value={`+${formatVndShort(inflowMagnitude)}`}
          dotColor="hsl(var(--status-green))"
        />
        <SummaryTile
          label={t('events.strip.outflow')}
          value={`−${formatVndShort(outflowMagnitude)}`}
          dotColor="hsl(var(--status-red))"
        />
        <SummaryTile
          label={t('events.strip.net')}
          value={`${totals.net >= 0 ? '+' : '−'}${formatVndShort(Math.abs(totals.net))}`}
          inverted
        />
      </SummaryStrip>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {t('events.table.title')}
              </p>
              <h2 className="section-title mt-1 text-2xl font-semibold">
                {t('events.table.subtitle')}
              </h2>
            </div>
            <ReceiptText className="hidden size-5 shrink-0 text-[hsl(var(--accent))] sm:block" />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('events.toolbar.searchPlaceholder')}
                className="pl-11"
              />
            </div>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="sm:w-52">
                <SelectValue placeholder={t('events.toolbar.allMonths')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('events.toolbar.allMonths')}</SelectItem>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t('events.toolbar.month', { month: option.month, year: option.year })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {eventFilters.map((option) => (
              <FilterChip
                key={option.key}
                label={option.label}
                active={filter === option.key}
                onClick={() => setFilter(option.key)}
              />
            ))}
          </div>

          <div className="mt-5">
            <EventsDataTable
              events={filteredEvents}
              onDuplicate={handleDuplicateEvent}
              onDelete={setDeleteId}
              emptyMessage={t('events.toolbar.empty')}
            />
          </div>
        </Card>

        <aside className="space-y-4 lg:col-span-4">
          <Card>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {t('events.summary.eyebrow')}
            </p>
            <h3 className="section-title mt-1 text-xl font-semibold">
              {t('events.summary.title')}
            </h3>
            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">
                    {t('events.summary.inflow')}
                  </span>
                  <span className="font-semibold text-[hsl(var(--status-green))]">
                    +{formatVndShort(inflowMagnitude)}
                  </span>
                </div>
                <Progress
                  value={(inflowMagnitude / flowMax) * 100}
                  className="[&>[data-slot=progress-indicator]]:bg-[hsl(var(--status-green))]"
                />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">
                    {t('events.summary.outflow')}
                  </span>
                  <span className="font-semibold text-[hsl(var(--status-red))]">
                    −{formatVndShort(outflowMagnitude)}
                  </span>
                </div>
                <Progress
                  value={(outflowMagnitude / flowMax) * 100}
                  className="[&>[data-slot=progress-indicator]]:bg-[hsl(var(--status-red))]"
                />
              </div>
              <div className="surface-muted rounded-3xl p-4">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {t('events.summary.net')}
                </p>
                <p className="money-number mt-2 text-3xl font-semibold">
                  {totals.net >= 0 ? '+' : '−'}
                  {formatVndShort(Math.abs(totals.net))}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle className="size-5 text-[hsl(var(--status-orange))]" strokeWidth={1.8} />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {t('events.review.eyebrow')}
              </p>
            </div>
            {reviewEvent ? (
              <div className="surface-muted rounded-3xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{reviewEvent.title}</p>
                    <p className="mt-1 text-sm leading-5 text-[hsl(var(--muted-foreground))]">
                      {t('events.review.description')}
                    </p>
                  </div>
                  <Badge className="shrink-0 bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))]">
                    {formatVndShort(Math.abs(parseSignedAmountToVnd(reviewEvent.amount)))}
                  </Badge>
                </div>
                <Button size="sm" className="mt-4">
                  {t('events.review.discuss')}
                </Button>
              </div>
            ) : (
              <p className="surface-muted rounded-3xl p-4 text-sm text-[hsl(var(--muted-foreground))]">
                {t('events.review.empty')}
              </p>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <ListChecks className="size-5 text-[hsl(var(--accent))]" strokeWidth={1.8} />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {t('events.rules.eyebrow')}
              </p>
            </div>
            <h3 className="section-title text-xl font-semibold">{t('events.rules.title')}</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              {['one', 'two', 'three'].map((key) => (
                <li key={key} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[hsl(var(--foreground))]" />
                  <span>{t(`events.rules.${key}`)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>

      <ResponsiveDialog open={formOpen} onOpenChange={handleFormOpenChange}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t('events.form.title')}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>{t('events.form.eyebrow')}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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

            <div className="surface-muted rounded-3xl p-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              {t('events.form.helper')}
            </div>

            <ResponsiveDialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleFormOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={!isValid}>
                {t('events.form.submit')}
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('common.confirmDelete.title')}
        description={t('common.confirmDelete.description', { name: deletingEvent?.title ?? '' })}
        onConfirm={() => deleteId && deleteEvent(deleteId)}
      />
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
        active
          ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
          : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
      )}
    >
      {label}
    </button>
  )
}
