import { useTranslation } from 'react-i18next'

import { useEntitlement } from '@money-space/core/features/billing/hooks/use-entitlement'
import { usePaymentReturn } from '@money-space/core/features/billing/hooks/use-payment-return'
import { usePaywallStore } from '@money-space/core/shared/stores/paywall-store'

import { Button } from '@/components/ui/button'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusChip } from '@/components/ui/status-chip'
import { CompactPageHeader } from '@/app/layout/compact-page-header'
import { OrderHistory } from '@/features/billing/ui/order-history'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN')
}

/**
 * Where a checkout comes back to, and the record of what has been bought.
 *
 * It stays a route because PayOS's return URL points at it — that is the whole
 * reason it cannot be a modal. Choosing a plan is `PaywallSheet` and entering a
 * code is the settings card; neither is repeated here.
 */
export function SubscriptionPage() {
  const { t } = useTranslation()
  const { entitlement, isPremium, isLoading } = useEntitlement()
  const openPaywall = usePaywallStore((store) => store.openPaywall)
  // Mounted here because this is where PayOS's return URL points.
  const payment = usePaymentReturn()

  return (
    <div className="s-page">
      <CompactPageHeader title={t('settings.billing.eyebrow')} />

      <div className="s-card-gap s-head-body flex flex-col">
        {/* What happened to the payment just made. Absent entirely when the
            household did not arrive from a checkout. */}
        {payment.state !== 'idle' ? (
          <Panel>
            <p className="t-subtitle">{t(`billing.checkout.${payment.state}.title`)}</p>
            <p className="mt-2 t-body-sm text-ink2">
              {t(`billing.checkout.${payment.state}.description`)}
            </p>
          </Panel>
        ) : null}

        <Panel>
          <PanelHeader
            title={t('settings.billing.eyebrow')}
            action={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => openPaywall({ reason: isPremium ? 'manage' : 'general' })}
              >
                {isPremium ? t('settings.billing.manage') : t('settings.billing.viewPlans')}
              </Button>
            }
          />

          {isLoading || !entitlement ? (
            <Skeleton className="s-head-body h-6 w-48" />
          ) : (
            <div className="s-head-body">
              <p className="t-subtitle">
                {entitlement.isLifetime
                  ? t('settings.billing.lifetime')
                  : entitlement.isTrial
                    ? t('settings.billing.trial')
                    : isPremium
                      ? t('settings.billing.premium')
                      : t('settings.billing.free')}
              </p>

              {entitlement.isLifetime ? null : entitlement.tier === 'premium' &&
                entitlement.status === 'expired' &&
                entitlement.expiresAt ? (
                <StatusChip tone="attention" className="mt-2">
                  {t('settings.billing.expiredOn', {
                    date: formatDate(entitlement.expiresAt),
                  })}
                </StatusChip>
              ) : isPremium && entitlement.expiresAt ? (
                <p className="mt-2 t-body-sm text-ink2">
                  {t('settings.billing.activeUntil', {
                    date: formatDate(entitlement.expiresAt),
                  })}
                  {entitlement.daysRemaining !== null
                    ? ` · ${t('settings.billing.daysRemaining', {
                        count: entitlement.daysRemaining,
                      })}`
                    : ''}
                </p>
              ) : null}
            </div>
          )}
        </Panel>

        {/* Absent entirely for a household that has never bought anything —
            an empty "lịch sử" panel is a reminder of nothing. */}
        <OrderHistory />
      </div>
    </div>
  )
}
