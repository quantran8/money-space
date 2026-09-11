import { Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useEntitlement } from '@money-space/core/features/billing/hooks/use-entitlement'
import { useQuota } from '@money-space/core/features/billing/hooks/use-quota'
import { usePaywallStore } from '@money-space/core/shared/stores/paywall-store'

/**
 * Said BEFORE the asset is saved: the plan's automatic pricing is fully spoken
 * for, so this one will be manual.
 *
 * Nothing is blocked — the asset saves either way. Without this the household
 * only found out on the detail page, after committing to a holding they
 * expected the app to track.
 *
 * `useQuota` returns `null` for premium and unlimited plans, which is what
 * keeps this off every screen that does not need it.
 */
export function AutoPriceNotice() {
  const { t } = useTranslation()
  const quota = useQuota('marketPricedAssets')
  const { limits } = useEntitlement()
  const openPaywall = usePaywallStore((store) => store.openPaywall)

  if (!quota?.isExhausted) return null

  return (
    <div className="rounded-control bg-card p-4 ring-1 ring-attention">
      <div className="flex items-start gap-3">
        <Crown
          className="mt-0.5 size-4 shrink-0 text-attention-ink"
          strokeWidth={1.75}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="t-body-sm font-medium text-attention-ink">
            {t('assets.autoPrice.willBeManualTitle')}
          </p>
          <p className="mt-1 t-caption leading-5 text-ink2">
            {t('assets.autoPrice.willBeManual', { limit: quota.limit })}
          </p>
          <button
            type="button"
            onClick={() =>
              openPaywall({
                reason: 'auto_price_quota',
                limit: quota.limit,
                used: quota.used,
                limits,
              })
            }
            className="mt-2 t-caption font-medium text-attention-ink underline underline-offset-4"
          >
            {t('settings.billing.viewPlans')}
          </button>
        </div>
      </div>
    </div>
  )
}
