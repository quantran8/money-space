import { useTranslation } from 'react-i18next'

import { useEntitlement } from '@money-space/core/features/billing/hooks/use-entitlement'
import { useQuota } from '@money-space/core/features/billing/hooks/use-quota'
import type { Asset } from '@money-space/core/features/assets/model/assets.types'

import { StatusChip } from '@/components/ui/status-chip'

/**
 * How this asset's price is kept current. A statement, not a control.
 *
 * Only for market-priced assets: there is nothing to refresh on a manual one.
 *
 * There is deliberately **no switch**. Automation goes to the first assets the
 * household creates, and everything after that is manual — so which assets are
 * automatic follows from what they own and when they added it, not from a
 * setting to tune. A toggle here would only ever be a way to take automation
 * away from something to give it to something else, which is a shuffle nobody
 * asked to perform. Making room means deleting an asset they no longer hold.
 *
 * The chip is the honest label for an asset the plan is not automating: the
 * household records its value themselves, which is a perfectly good way to hold
 * gold and is how the app worked for everyone until this phase.
 */
export function AutoPriceRow({ asset }: { asset: Asset }) {
  const { t } = useTranslation()
  const { limits } = useEntitlement()
  const quota = useQuota('marketPricedAssets')

  if (asset.valuationMode !== 'market_priced') return null

  // Absent means true, matching the server's column default.
  const enabled = asset.autoPriceEnabled !== false
  // Nothing to say on an unlimited plan: every asset is automatic, so the row
  // would state the obvious on every asset the household owns.
  if (limits && limits.marketPricedAssets === null && enabled) return null

  return (
    <div className="mt-4 flex items-center justify-between gap-4 border-t border-divider pt-4">
      <div className="min-w-0">
        <p className="t-body-sm">{t('assets.autoPrice.label')}</p>
        <p className="mt-0.5 t-caption leading-5 text-ink3">
          {enabled ? t('assets.autoPrice.on') : t('assets.autoPrice.off')}
        </p>
        {/* Why this one is manual — stated only on the assets it is true of,
            and only once the ceiling is actually reached. */}
        {!enabled && quota?.isExhausted ? (
          <p className="mt-1 t-caption leading-5 text-ink3">
            {t('assets.autoPrice.atLimit', { limit: quota.limit })}
          </p>
        ) : null}
      </div>

      {enabled ? null : (
        <StatusChip className="shrink-0">{t('assets.autoPrice.manualChip')}</StatusChip>
      )}
    </div>
  )
}
