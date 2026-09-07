import { useTranslation } from 'react-i18next'

import { useAssets } from '@money-space/core/features/assets/hooks/use-assets'
import { useEntitlement } from '@money-space/core/features/billing/hooks/use-entitlement'
import type { Asset } from '@money-space/core/features/assets/model/assets.types'

import { StatusChip } from '@/components/ui/status-chip'
import { Switch } from '@/components/ui/switch'

/**
 * How this asset's price is kept current — and the control that changes it.
 *
 * Only for market-priced assets: there is nothing to refresh on a manual one.
 *
 * The chip is the honest label for an asset the plan is not automating. It says
 * "Cập nhật tay" rather than anything about a limit, because that IS what is
 * true of the asset — the household records its value themselves, which is a
 * perfectly good way to hold gold and is how the app worked for everyone until
 * this phase.
 *
 * Turning the switch ON at the plan's ceiling does NOT fail. The server moves
 * the automation off the oldest asset and names it, so the household is
 * choosing which assets are automatic rather than being refused.
 */
export function AutoPriceRow({ asset }: { asset: Asset }) {
  const { t } = useTranslation()
  const { setAutoPrice } = useAssets()
  const { limits } = useEntitlement()

  if (asset.valuationMode !== 'market_priced') return null

  // Absent means true, matching the server's column default.
  const enabled = asset.autoPriceEnabled !== false
  // Nothing to explain on an unlimited plan: every asset is automatic, so the
  // control would only ever be a way to turn something off for no reason.
  if (limits && limits.marketPricedAssets === null && enabled) return null

  return (
    <div className="mt-4 flex items-center justify-between gap-4 border-t border-divider pt-4">
      <div className="min-w-0">
        <p className="t-body-sm">{t('assets.autoPrice.label')}</p>
        <p className="mt-0.5 t-caption text-ink3">
          {enabled ? t('assets.autoPrice.on') : t('assets.autoPrice.off')}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {enabled ? null : <StatusChip>{t('assets.autoPrice.manualChip')}</StatusChip>}
        <Switch
          checked={enabled}
          aria-label={t('assets.autoPrice.label')}
          onCheckedChange={(next) =>
            setAutoPrice.mutate({ assetId: asset.id, enabled: next })
          }
        />
      </div>
    </div>
  )
}
