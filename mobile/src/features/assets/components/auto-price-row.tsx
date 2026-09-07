import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useAssets } from '@money-space/core/features/assets/hooks/use-assets'
import { useEntitlement } from '@money-space/core/features/billing/hooks/use-entitlement'
import type { Asset } from '@money-space/core/features/assets/model/assets.types'

import { StatusChip, Switch } from '@/components/ui'

/**
 * The mobile counterpart of the web's auto-price row.
 *
 * `Switch` here carries its own label and hint, so this is only the switch plus
 * the "Cập nhật tay" chip — the same information, in the kit's own shape.
 *
 * Turning it on at the plan's ceiling does not fail: the server moves the
 * automation off the oldest asset. The household is choosing which assets are
 * automatic, not being refused.
 */
export function AutoPriceRow({ asset }: { asset: Asset }) {
  const { t } = useTranslation()
  const { setAutoPrice } = useAssets()
  const { limits } = useEntitlement()

  if (asset.valuationMode !== 'market_priced') return null

  const enabled = asset.autoPriceEnabled !== false
  // Nothing to explain on an unlimited plan.
  if (limits && limits.marketPricedAssets === null && enabled) return null

  return (
    <View className="mt-4 border-t border-hair pt-4">
      <Switch
        value={enabled}
        onChange={(next) => setAutoPrice.mutate({ assetId: asset.id, enabled: next })}
        label={t('assets.autoPrice.label')}
        hint={enabled ? t('assets.autoPrice.on') : t('assets.autoPrice.off')}
      />

      {enabled ? null : (
        <View className="mt-3 flex-row">
          <StatusChip label={t('assets.autoPrice.manualChip')} />
        </View>
      )}
    </View>
  )
}
