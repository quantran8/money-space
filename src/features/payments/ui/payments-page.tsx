import { zodResolver } from '@hookform/resolvers/zod'
import { Clock3, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { PageHeader } from '@/app/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DatePicker } from '@/components/ui/date-picker'
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
  important: 'bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))]',
  normal: 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]',
  pending: 'bg-[hsla(var(--status-blue),0.1)] text-[hsl(var(--status-blue))]',
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

export function PaymentsPage() {
  const { t } = useTranslation()
  const { payments: seedPayments } = usePayments()
  const [payments, setPayments] = useState<UpcomingPaymentItem[]>(seedPayments)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const isEditing = editingId !== null

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

      <Card>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('payments.list.eyebrow')}</p>
            <h2 className="section-title mt-1 text-2xl font-semibold">{t('payments.list.title')}</h2>
          </div>
          <Clock3 className="size-5 text-[hsl(var(--status-orange))]" />
        </div>

        <div className="space-y-3">
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
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="surface-muted rounded-3xl px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{payment.name}</p>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                      {t('common.dueOn', { date: payment.due })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="money-number text-2xl">{payment.amount}</p>
                      <Badge className={`mt-2 ${statusTone[payment.status]}`}>
                        {paymentStatusLabels[payment.status]}
                      </Badge>
                    </div>
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
            ))
          )}
        </div>
      </Card>

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
