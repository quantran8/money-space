import { Clock3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { type UpcomingPaymentItem } from '@/features/payments/model/payments'

type PaymentsFocusCardProps = {
  nearestPayment?: { payment: UpcomingPaymentItem; days: number }
  dueMeta: (due: string) => string
  onEdit: (paymentId: string) => void
}

export function PaymentsFocusCard({
  nearestPayment,
  dueMeta,
  onEdit,
}: PaymentsFocusCardProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="section-title truncate text-2xl font-semibold">
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
          <Button className="mt-5 w-full" onClick={() => onEdit(nearestPayment.payment.id)}>
            {t('payments.focus.markPrepared')}
          </Button>
        </>
      ) : (
        <p className="mt-6 text-sm text-[hsl(var(--muted-foreground))]">
          {t('payments.focus.empty')}
        </p>
      )}
    </Card>
  )
}
