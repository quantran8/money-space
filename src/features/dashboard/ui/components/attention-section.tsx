import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { UpcomingPaymentItem } from '@/features/payments/model/payments.types'
import { dueDate } from '@/features/dashboard/model/dashboard'
import { SectionCard } from '@/features/dashboard/ui/components/section-card'

type AttentionSectionProps = {
  payments: UpcomingPaymentItem[]
  attentionTotal: string
}

export function AttentionSection({ payments, attentionTotal }: AttentionSectionProps) {
  const { t } = useTranslation()

  return (
    <SectionCard
      title={t('dashboard.sections.attention.title')}
      subtitle={t('dashboard.sections.attention.subtitle')}
      to="/payments"
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[24px] bg-[hsl(var(--muted))] px-4 py-3.5">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
              {t('dashboard.sections.attention.totalCount')}
            </p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.02em]">
              {t('dashboard.metrics.paymentsCount', { count: payments.length })}
            </p>
          </div>

          <div className="rounded-[24px] bg-[hsl(var(--muted))] px-4 py-3.5">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
              {t('dashboard.sections.attention.totalAmount')}
            </p>
            <p className="money-number mt-1 text-lg">{attentionTotal} đ</p>
          </div>
        </div>

        <div className="divide-y divide-[hsl(var(--border))] overflow-hidden rounded-[24px] bg-[hsl(var(--muted))]">
          {payments.slice(0, 3).map((payment) => (
            <Link
              key={payment.id}
              to="/payments"
              className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-[hsl(var(--secondary))]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium tracking-[-0.01em]">{payment.name}</p>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  {dueDate(payment.due)}
                </p>
              </div>
              {payment.amount ? (
                <span className="money-number shrink-0 text-base">{payment.amount}</span>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}
