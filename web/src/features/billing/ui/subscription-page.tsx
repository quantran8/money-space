import { useTranslation } from 'react-i18next'

import { useEntitlement } from '@money-space/core/features/billing/hooks/use-entitlement'
import { usePlans } from '@money-space/core/features/billing/hooks/use-plans'
import { useCheckout } from '@money-space/core/features/billing/hooks/use-checkout'
import { usePaymentReturn } from '@money-space/core/features/billing/hooks/use-payment-return'
import { formatMoney } from '@money-space/core/shared/lib/format-money'

import { Panel, PanelHeader } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusChip } from '@/components/ui/status-chip'
import { CompactPageHeader } from '@/app/layout/compact-page-header'
import { RedeemCodeForm } from '@/features/billing/ui/redeem-code-form'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN')
}

/**
 * The plan, in full: what the household is on now, what is for sale, and the
 * field for an activation code.
 *
 * Its own route rather than a sixth card in Settings — that page is already
 * long, and a route can be linked to from the paywall and from a message.
 */
export function SubscriptionPage() {
  const { t } = useTranslation()
  const { entitlement, isPremium, isLoading } = useEntitlement()
  const { plans, isLoading: plansLoading } = usePlans()
  const checkout = useCheckout()
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
            meta={t('settings.billing.forBothOfYou')}
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

        <Panel>
          <RedeemCodeForm />
        </Panel>

        {/* Prices come from the server, never a literal here: that is what makes
            a discount campaign a config change rather than a release. */}
        <Panel>
          <PanelHeader title={t('settings.billing.plans')} />

          {plansLoading ? (
            <Skeleton className="s-head-body h-16 w-full" />
          ) : (
            <ul className="s-head-body flex flex-col gap-3">
              {plans.map((plan) => (
                <li key={plan.planCode}>
                  <button
                    type="button"
                    onClick={() => checkout.start(plan.planCode)}
                    disabled={checkout.isStarting}
                    className="flex w-full items-baseline justify-between gap-4 rounded-control px-3 py-2 text-left transition-colors hover:bg-canvas"
                  >
                  <div className="min-w-0">
                    <p className="t-body">
                      {t(`settings.billing.plan.${plan.planCode}`)}
                    </p>
                    {plan.savingsAmount ? (
                      <p className="mt-1 t-caption text-ink3">
                        {t('settings.billing.savings', {
                          amount: formatMoney(plan.savingsAmount),
                        })}
                        {plan.monthlyEquivalent
                          ? ` · ${t('settings.billing.perMonth', {
                              amount: formatMoney(plan.monthlyEquivalent),
                            })}`
                          : ''}
                      </p>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="t-body">{formatMoney(plan.amount)}</p>
                    {plan.compareAtAmount ? (
                      <p className="t-caption text-ink3 line-through">
                        {formatMoney(plan.compareAtAmount)}
                      </p>
                    ) : null}
                  </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {checkout.error ? (
            <p className="mt-4 t-caption leading-5 text-alert-ink">
              {t('billing.checkout.failed')}
            </p>
          ) : (
            <p className="mt-4 t-caption leading-5 text-ink3">
              {t('billing.checkout.payNote')}
            </p>
          )}
        </Panel>
      </div>
    </div>
  )
}
