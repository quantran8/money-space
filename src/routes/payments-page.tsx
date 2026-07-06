import { zodResolver } from '@hookform/resolvers/zod'
import { Clock3, Plus } from 'lucide-react'
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
import {
  paymentStatusLabels,
  upcomingPaymentList as seedPayments,
  type PaymentStatus,
  type UpcomingPaymentItem,
} from '@/lib/mock-data'
import { isoDate, moneyAmount, requiredText } from '@/lib/validation'

const paymentSchema = z.object({
  name: requiredText('tên khoản'),
  amount: moneyAmount,
  due: isoDate,
  status: z.enum(['important', 'normal', 'pending']),
})

type PaymentForm = z.infer<typeof paymentSchema>

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
  const [payments, setPayments] = useState<UpcomingPaymentItem[]>(seedPayments)

  const {
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
        eyebrow="Khoản sắp tới"
        title="Tránh bị động với các khoản sắp phải trả"
        description="Nhìn trước 7 đến 30 ngày để biết khoản nào cần chuẩn bị, khoản nào cần cùng trao đổi."
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Danh sách khoản</p>
              <h2 className="section-title mt-1 text-2xl font-semibold">Lịch thanh toán sắp tới</h2>
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
                      Đến hạn {payment.due}
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
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Thêm khoản</p>
              <h2 className="section-title mt-1 text-2xl font-semibold">Ghi một khoản sắp tới</h2>
            </div>
            <Plus className="size-5 text-[hsl(var(--status-orange))]" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormField label="Tên khoản" error={errors.name?.message}>
              <Input
                placeholder="Ví dụ: Học phí tháng 8"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Số tiền" error={errors.amount?.message}>
                <Input
                  placeholder="Ví dụ: 12M"
                  aria-invalid={!!errors.amount}
                  {...register('amount')}
                />
              </FormField>
              <FormField label="Đến hạn" error={errors.due?.message}>
                <Input type="date" aria-invalid={!!errors.due} {...register('due')} />
              </FormField>
            </div>

            <FormField label="Trạng thái" error={errors.status?.message}>
              <Select aria-invalid={!!errors.status} {...register('status')}>
                <option value="important">Quan trọng</option>
                <option value="normal">Bình thường</option>
                <option value="pending">Chờ xác nhận</option>
              </Select>
            </FormField>

            <Button type="submit" className="w-full" disabled={!isValid}>
              <Plus className="mr-2 size-4" />
              Thêm khoản
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
