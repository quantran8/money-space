import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { UpcomingPaymentItem } from '@/features/payments/model/payments.types'
import { dueParts } from '@/features/dashboard/model/dashboard'

type UpcomingPaymentsSectionProps = {
  payments: UpcomingPaymentItem[]
  upcomingCount: number
}

/** Status → text color token for the per-payment readiness note. */
const STATUS_COLOR: Record<UpcomingPaymentItem['status'], string> = {
  important: 'text-[hsl(var(--accent))]',
  normal: 'text-[hsl(var(--status-green))]',
  pending: 'text-[hsl(var(--muted-foreground))]',
}

/**
 * "Sắp đến hạn" (mockup `#upcoming`): the next payments over 30 days, each with
 * a calendar pill, who's responsible, the amount, and a readiness note.
 */
export function UpcomingPaymentsSection({
  payments,
  upcomingCount,
}: UpcomingPaymentsSectionProps) {
  const { t } = useTranslation()
  const visible = payments.slice(0, 3)

  return (
    <div className="rounded-[28px] border border-border bg-card p-6 apple-shadow-soft xl:col-span-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('dashboard.redesign.upcoming.eyebrow')}
          </p>
          <h3 className="section-title mt-1 text-xl font-semibold">
            {t('dashboard.redesign.upcoming.title')}
          </h3>
        </div>
        <span className="rounded-full bg-[hsl(var(--muted))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
          {t('dashboard.redesign.upcoming.count', { count: upcomingCount })}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="mt-5 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {t('dashboard.redesign.upcoming.empty')}
        </p>
      ) : (
        <div className="mt-5 divide-y divide-border">
          {visible.map((payment) => {
            const { month, day } = dueParts(payment.dueDate, payment.due)
            return (
              <Link
                key={payment.id}
                to="/payments"
                className="flex gap-4 py-4 text-left transition first:pt-0 last:pb-0 hover:opacity-75"
              >
                <div className="w-12 shrink-0 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                    {month}
                  </p>
                  <p className="mt-0.5 text-lg font-semibold">{day}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{payment.name}</p>
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                        {payment.owner
                          ? t('dashboard.redesign.upcoming.owner', { name: payment.owner })
                          : t('dashboard.redesign.upcoming.noOwner')}
                      </p>
                    </div>
                    {payment.amount ? (
                      <p className="money-number shrink-0 text-sm">{payment.amount}</p>
                    ) : null}
                  </div>
                  <p className={`mt-2 text-xs font-medium ${STATUS_COLOR[payment.status]}`}>
                    {t(`dashboard.redesign.upcoming.status.${payment.status}`)}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
