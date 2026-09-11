import { useTranslation } from 'react-i18next'

import { usePaymentOrders } from '@money-space/core/features/billing/hooks/use-payment-orders'
import { formatMoney } from '@money-space/core/shared/lib/format-money'
import type { PaymentOrderStatus } from '@money-space/core/features/billing/api/billing.repository'

import { Panel, PanelHeader } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusChip, type ChipTone } from '@/components/ui/status-chip'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN')
}

/**
 * Only a state that needs attention gets a colored chip (§9). `paid` is the
 * ordinary outcome and reads neutral — a green pill on every receipt would
 * make the one abandoned checkout harder to find, not easier.
 */
const TONE: Record<PaymentOrderStatus, ChipTone> = {
  paid: 'neutral',
  pending: 'attention',
  cancelled: 'neutral',
  expired: 'neutral',
}

/**
 * What the household has paid, newest first.
 *
 * Renders nothing at all when there are no orders: a household on a redeem code
 * or still on Free has never bought anything, and an empty "Lịch sử" panel is a
 * reminder of nothing.
 */
export function OrderHistory() {
  const { t } = useTranslation()
  const { orders, isLoading } = usePaymentOrders()

  if (isLoading) {
    return (
      <Panel>
        <PanelHeader title={t('settings.billing.orders.title')} />
        <Skeleton className="s-head-body h-16 w-full" />
      </Panel>
    )
  }

  if (orders.length === 0) return null

  return (
    <Panel>
      <PanelHeader
        title={t('settings.billing.orders.title')}
        meta={t('settings.billing.orders.meta')}
      />

      <ul className="s-head-body flex flex-col gap-3">
        {orders.map((order) => (
          <li
            key={order.orderCode}
            className="flex items-baseline justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="t-body">
                {t(`settings.billing.plan.${order.planCode}`)}
              </p>
              <p className="mt-1 t-caption text-ink3">
                {/* The date the money moved when it did; otherwise the date the
                    household tried. Both are real answers to "when was this". */}
                {formatDate(order.paidAt ?? order.createdAt ?? '')}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="t-body">{formatMoney(order.amount)}</p>
              <StatusChip tone={TONE[order.status]} className="mt-1 justify-end">
                {t(`settings.billing.orders.status.${order.status}`)}
              </StatusChip>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
