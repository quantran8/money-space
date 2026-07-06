import { zodResolver } from '@hookform/resolvers/zod'
import { Clock3, Plus } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
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
import {
  upcomingPaymentList as seedPayments,
  type PaymentStatus,
  type UpcomingPaymentItem,
} from '@/lib/mock-data'
import {
  localizedIsoDate,
  localizedMoneyAmount,
  localizedRequiredText,
} from '@/lib/validation'

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

export function PaymentsPage() {
  const { t } = useTranslation()
  const [payments, setPayments] = useState<UpcomingPaymentItem[]>(seedPayments)
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

  function onSubmit(values: PaymentForm) {
    const nextPayment: UpcomingPaymentItem = {
      id: `p${payments.length + 1}-${values.name}`,
      name: values.name.trim(),
      amount: values.amount.trim(),
      due: formatDue(values.due),
      status: values.status,
    }

    setPayments((current) => [...current, nextPayment])
    reset(defaultValues)
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={t('payments.header.eyebrow')}
        title={t('payments.header.title')}
        description={t('payments.header.description')}
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('payments.list.eyebrow')}</p>
              <h2 className="section-title mt-1 text-2xl font-semibold">{t('payments.list.title')}</h2>
            </div>
            <Clock3 className="size-5 text-[hsl(var(--status-orange))]" />
          </div>

          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="surface-muted rounded-[22px] px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{payment.name}</p>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                      {t('common.dueOn', { date: payment.due })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="money-number text-2xl">{payment.amount}</p>
                    <Badge className={`mt-2 ${statusTone[payment.status]}`}>
                      {paymentStatusLabels[payment.status]}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('payments.form.eyebrow')}</p>
              <h2 className="section-title mt-1 text-2xl font-semibold">{t('payments.form.title')}</h2>
            </div>
            <Plus className="size-5 text-[hsl(var(--status-orange))]" />
          </div>

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

            <Button type="submit" className="w-full" disabled={!isValid}>
              <Plus className="mr-2 size-4" />
              {t('payments.form.submit')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
