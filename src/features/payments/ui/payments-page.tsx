import { zodResolver } from '@hookform/resolvers/zod'
import { Clock3, MoreVertical, Pencil, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { PageHeader } from '@/app/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { SummaryStrip, SummaryTile } from '@/components/ui/summary-strip'
import { cn } from '@/shared/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
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
  type PaymentStatus,
  type UpcomingPaymentItem,
} from '@/features/payments/model/payments'
import { usePayments } from '@/features/payments/hooks/use-payments'
import {
  localizedIsoDate,
  localizedMoneyAmount,
  localizedRequiredText,
} from '@/shared/lib/validation'

type PaymentForm = {
  name: string
  amount: string
  due: string
  status: PaymentStatus
}

const defaultValues: PaymentForm = {
  name: '',
  amount: '',
  due: '2026-07-10',
  status: 'normal',
}

const statusTone: Record<PaymentStatus, string> = {
  important:
    'border border-[hsla(var(--status-orange),0.24)] bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))]',
  normal: 'border border-border bg-card text-[hsl(var(--muted-foreground))]',
  pending:
    'border border-[hsla(var(--status-blue),0.24)] bg-[hsla(var(--status-blue),0.1)] text-[hsl(var(--status-blue))]',
}

const monthAbbr = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function formatDue(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const day = String(date.getDate()).padStart(2, '0')
  return `${day} ${monthAbbr[date.getMonth()]}`
}

function dueToIso(due: string) {
  const parsed = new Date(due)
  if (!Number.isNaN(parsed.getTime())) return due
  const [day, abbr] = due.split(' ')
  const month = monthAbbr.indexOf(abbr)
  if (!day || month < 0) return defaultValues.due
  const year = new Date().getFullYear()
  return `${year}-${String(month + 1).padStart(2, '0')}-${day.padStart(2, '0')}`
}

/** Reference "today" for the MVP (matches the seeded snapshot horizon). */
const AS_OF = '2026-07-06'
const AS_OF_YEAR = 2026

/**
 * Resolve a "10 Jul" / ISO due string to an ISO date in the AS_OF year.
 * `new Date("10 Jul")` parses to year 2001, so we can't trust it — build the
 * ISO string explicitly from the day + month abbreviation.
 */
function dueToAsOfIso(due: string): string {
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(due.trim())
  if (iso) return iso[0]
  const [day, abbr] = due.trim().split(/\s+/)
  const month = monthAbbr.indexOf(abbr)
  if (!day || month < 0) return `${AS_OF_YEAR}-07-10`
  return `${AS_OF_YEAR}-${String(month + 1).padStart(2, '0')}-${day.padStart(2, '0')}`
}

/** Whole days from AS_OF until a payment's due date; negative if overdue. */
function daysUntilDue(due: string): number {
  const target = new Date(dueToAsOfIso(due)).getTime()
  const now = new Date(AS_OF).getTime()
  if (Number.isNaN(target) || Number.isNaN(now)) return Number.POSITIVE_INFINITY
  return Math.round((target - now) / (1000 * 60 * 60 * 24))
}

/** Sum a list of "12M" / "1,8M" style amounts into millions of VND. */
function sumAmountsInMillions(items: { amount: string }[]): number {
  return items.reduce((total, item) => {
    const cleaned = item.amount.replace(/,/g, '.').replace(/[^\d.]/g, '')
    const value = Number(cleaned)
    return total + (Number.isFinite(value) ? value : 0)
  }, 0)
}

function formatMillions(value: number): string {
  return `${Math.round(value * 10) / 10}M`
}

type PaymentTab = 'all' | 'important' | 'pending'

export function PaymentsPage() {
  const { t } = useTranslation()
  const { payments: seedPayments } = usePayments()
  const [payments, setPayments] = useState<UpcomingPaymentItem[]>(seedPayments)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [tab, setTab] = useState<PaymentTab>('all')
  const [query, setQuery] = useState('')
  const isEditing = editingId !== null

  const strip = useMemo(() => {
    const next7 = payments.filter((p) => {
      const d = daysUntilDue(p.due)
      return d >= 0 && d <= 7
    })
    const next30 = payments.filter((p) => {
      const d = daysUntilDue(p.due)
      return d >= 0 && d <= 30
    })
    const discuss = payments.filter((p) => p.status === 'pending' || p.status === 'important')
    return {
      next7: next7.length,
      next7Amount: formatMillions(sumAmountsInMillions(next7)),
      next30: next30.length,
      next30Amount: formatMillions(sumAmountsInMillions(next30)),
      discuss: discuss.length,
      total: formatMillions(sumAmountsInMillions(payments)),
    }
  }, [payments])

  // Nearest not-yet-overdue payment, for the strip tile and the focus card.
  const nearestPayment = useMemo(() => {
    const upcoming = payments
      .map((p) => ({ payment: p, days: daysUntilDue(p.due) }))
      .filter((entry) => entry.days >= 0)
      .sort((a, b) => a.days - b.days)
    return upcoming[0]
  }, [payments])

  const visiblePayments = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return payments.filter((p) => {
      if (tab !== 'all' && p.status !== tab) return false
      if (!needle) return true
      return p.name.toLowerCase().includes(needle)
    })
  }, [payments, tab, query])

  // Group the visible payments by due horizon, in display order.
  const groups = useMemo(() => {
    const buckets: Record<'overdue' | 'next7' | 'next30' | 'later', UpcomingPaymentItem[]> = {
      overdue: [],
      next7: [],
      next30: [],
      later: [],
    }
    for (const payment of visiblePayments) {
      const d = daysUntilDue(payment.due)
      if (d < 0) buckets.overdue.push(payment)
      else if (d <= 7) buckets.next7.push(payment)
      else if (d <= 30) buckets.next30.push(payment)
      else buckets.later.push(payment)
    }
    return (['overdue', 'next7', 'next30', 'later'] as const)
      .map((key) => ({ key, items: buckets[key] }))
      .filter((group) => group.items.length > 0)
  }, [visiblePayments])

  const groupDot: Record<'overdue' | 'next7' | 'next30' | 'later', string> = {
    overdue: 'hsl(var(--status-red))',
    next7: 'hsl(var(--status-orange))',
    next30: 'hsl(var(--status-blue))',
    later: 'hsl(var(--muted-foreground))',
  }

  function dueMeta(due: string) {
    const d = daysUntilDue(due)
    if (d < 0) return t('payments.due.overdue', { count: Math.abs(d) })
    if (d === 0) return t('payments.due.today')
    return t('payments.due.inDays', { count: d })
  }

  const paymentSchema = z.object({
    name: localizedRequiredText(t, t('payments.form.name')),
    amount: localizedMoneyAmount(t),
    due: localizedIsoDate(t),
    status: z.enum(['important', 'normal', 'pending']),
  })
  const paymentStatusLabels: Record<PaymentStatus, string> = {
    important: t('options.paymentStatus.important'),
    normal: t('options.paymentStatus.normal'),
    pending: t('options.paymentStatus.pending'),
  }

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues,
    mode: 'onChange',
  })

  const editingPayment = editingId
    ? payments.find((payment) => payment.id === editingId)
    : undefined
  const deletingPayment = deleteId
    ? payments.find((payment) => payment.id === deleteId)
    : undefined

  useEffect(() => {
    if (!formOpen) return
    if (editingPayment) {
      reset({
        name: editingPayment.name,
        amount: editingPayment.amount,
        due: dueToIso(editingPayment.due),
        status: editingPayment.status,
      })
    } else {
      reset(defaultValues)
    }
  }, [formOpen, editingPayment, reset])

  function openCreate() {
    setEditingId(null)
    setFormOpen(true)
  }

  function openEdit(paymentId: string) {
    setEditingId(paymentId)
    setFormOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open)
    if (!open) setEditingId(null)
  }

  function onSubmit(values: PaymentForm) {
    if (editingId) {
      setPayments((prev) =>
        prev.map((payment) =>
          payment.id === editingId
            ? {
                ...payment,
                name: values.name.trim(),
                amount: values.amount.trim(),
                due: formatDue(values.due),
                status: values.status,
              }
            : payment,
        ),
      )
    } else {
      const nextPayment: UpcomingPaymentItem = {
        id: `p${payments.length + 1}-${values.name}`,
        name: values.name.trim(),
        amount: values.amount.trim(),
        due: formatDue(values.due),
        status: values.status,
      }
      setPayments((prev) => [...prev, nextPayment])
    }

    handleFormOpenChange(false)
  }

  function deletePayment(paymentId: string) {
    setPayments((prev) => prev.filter((payment) => payment.id !== paymentId))
    if (editingId === paymentId) handleFormOpenChange(false)
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={t('payments.header.eyebrow')}
        title={t('payments.header.title')}
        description={t('payments.header.description')}
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            {t('payments.form.submit')}
          </Button>
        }
      />

      <SummaryStrip>
        <SummaryTile
          label={t('payments.strip.next7')}
          value={t('payments.list.countLabel', { count: strip.next7 })}
          dotColor="hsl(var(--status-orange))"
        />
        <SummaryTile
          label={t('payments.strip.next30')}
          value={t('payments.list.countLabel', { count: strip.next30 })}
          dotColor="hsl(var(--status-blue))"
        />
        <SummaryTile
          label={t('payments.strip.discuss')}
          value={t('payments.list.countLabel', { count: strip.discuss })}
          dotColor="hsl(var(--status-green))"
        />
        <SummaryTile label={t('payments.strip.total')} value={strip.total} inverted />
      </SummaryStrip>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {t('payments.list.eyebrow')}
              </p>
              <h2 className="section-title mt-1 text-2xl font-semibold">
                {t('payments.list.title')}
              </h2>
            </div>
            <div className="relative sm:w-[260px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('payments.toolbar.searchPlaceholder')}
                aria-label={t('payments.toolbar.search')}
                className="pl-11"
              />
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {(['all', 'important', 'pending'] as PaymentTab[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  tab === value
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
                )}
              >
                {t(`payments.tabs.${value}`)}
              </button>
            ))}
          </div>

          {payments.length === 0 ? (
            <div className="rounded-3xl border border-dashed bg-white p-8 text-center">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {t('payments.list.empty')}
              </p>
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="mr-2 size-4" />
                {t('payments.form.submit')}
              </Button>
            </div>
          ) : visiblePayments.length === 0 ? (
            <p className="rounded-3xl bg-[hsl(var(--muted))] px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
              {t('payments.list.emptyFiltered')}
            </p>
          ) : (
            <div className="space-y-7">
              {groups.map((group) => (
                <div key={group.key}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: groupDot[group.key] }}
                      />
                      <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                        {t(`payments.groups.${group.key}`)}
                      </h3>
                    </div>
                    <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                      {t('payments.groups.countAmount', {
                        count: group.items.length,
                        value: formatMillions(sumAmountsInMillions(group.items)),
                      })}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((payment) => (
                      <div key={payment.id} className="surface-muted rounded-3xl p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{payment.name}</p>
                              <Badge className={statusTone[payment.status]}>
                                {paymentStatusLabels[payment.status]}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                              {t('common.dueOn', { date: payment.due })} · {dueMeta(payment.due)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="money-number text-2xl font-semibold">{payment.amount}</p>
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
                                <DropdownMenuItem onSelect={() => openEdit(payment.id)}>
                                  <Pencil className="size-4" />
                                  {t('common.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-[hsl(var(--status-red))] focus:text-[hsl(var(--status-red))]"
                                  onSelect={() => setDeleteId(payment.id)}
                                >
                                  <Trash2 className="size-4" />
                                  {t('common.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <aside className="space-y-4 xl:col-span-4">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {t('payments.focus.eyebrow')}
                </p>
                <h2 className="section-title mt-1 truncate text-2xl font-semibold">
                  {nearestPayment ? nearestPayment.payment.name : '—'}
                </h2>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[hsla(var(--status-orange),0.1)]">
                <Clock3 className="size-5 text-[hsl(var(--status-orange))]" strokeWidth={1.8} />
              </div>
            </div>

            {nearestPayment ? (
              <>
                <div className="surface-muted mt-6 rounded-3xl p-5">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {t('payments.focus.need', {
                      date: nearestPayment.payment.due,
                    })}
                  </p>
                  <p className="money-number mt-2 text-4xl font-semibold">
                    {nearestPayment.payment.amount}
                  </p>
                  <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                    {dueMeta(nearestPayment.payment.due)}
                  </p>
                </div>
                <Button className="mt-5 w-full" onClick={() => openEdit(nearestPayment.payment.id)}>
                  {t('payments.focus.markPrepared')}
                </Button>
              </>
            ) : (
              <p className="mt-6 text-sm text-[hsl(var(--muted-foreground))]">
                {t('payments.focus.empty')}
              </p>
            )}
          </Card>

          <Card>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {t('payments.month.eyebrow')}
            </p>
            <h2 className="section-title mt-1 text-xl font-semibold">
              {t('payments.month.title')}
            </h2>
            <div className="mt-5 space-y-3">
              <div className="surface-muted flex items-center justify-between rounded-3xl p-4">
                <div>
                  <p className="text-sm font-semibold">{t('payments.month.totalNeed')}</p>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    {t('payments.month.totalNeedHint')}
                  </p>
                </div>
                <p className="money-number text-xl font-semibold">{strip.next30Amount}</p>
              </div>
              <div className="surface-muted flex items-center justify-between rounded-3xl p-4">
                <div>
                  <p className="text-sm font-semibold">{t('payments.month.discuss')}</p>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    {t('payments.month.discussHint')}
                  </p>
                </div>
                <p className="money-number text-xl font-semibold">{strip.discuss}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[hsla(var(--accent),0.1)]">
                <ShieldCheck className="size-5 text-[hsl(var(--accent))]" strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-semibold">{t('payments.gentle.title')}</p>
                <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                  {t('payments.gentle.description')}
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      <ResponsiveDialog open={formOpen} onOpenChange={handleFormOpenChange}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {isEditing ? t('payments.form.editTitle') : t('payments.form.title')}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {isEditing ? t('payments.form.editEyebrow') : t('payments.form.eyebrow')}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormField label={t('payments.form.name')} error={errors.name?.message}>
              <Input
                placeholder={t('payments.form.namePlaceholder')}
                aria-invalid={!!errors.name}
                {...register('name')}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t('payments.form.amount')} error={errors.amount?.message}>
                <Input
                  placeholder={t('payments.form.amountPlaceholder')}
                  aria-invalid={!!errors.amount}
                  {...register('amount')}
                />
              </FormField>
              <FormField label={t('payments.form.due')} error={errors.due?.message}>
                <Controller
                  control={control}
                  name="due"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      aria-invalid={!!errors.due}
                    />
                  )}
                />
              </FormField>
            </div>

            <FormField label={t('payments.form.status')} error={errors.status?.message}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={!!errors.status}>
                      <SelectValue placeholder={t('payments.form.statusPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="important">{t('options.paymentStatus.important')}</SelectItem>
                      <SelectItem value="normal">{t('options.paymentStatus.normal')}</SelectItem>
                      <SelectItem value="pending">{t('options.paymentStatus.pending')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
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
                {isEditing ? t('payments.form.save') : t('payments.form.submit')}
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('common.confirmDelete.title')}
        description={t('common.confirmDelete.description', { name: deletingPayment?.name ?? '' })}
        onConfirm={() => deleteId && deletePayment(deleteId)}
      />
    </div>
  )
}
