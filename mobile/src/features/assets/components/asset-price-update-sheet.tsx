import { useState } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useAssets } from '@money-space/core/features/assets/hooks/use-assets'
import type { Asset } from '@money-space/core/features/assets/model/assets'
import { getErrorMessage } from '@money-space/core/shared/lib/get-error-message'
import { notify } from '@money-space/core/shared/notify'

import { BottomSheet, Button, MoneyInput } from '@/components/ui'

/**
 * Re-price a holding by hand.
 *
 * This is a RE-VALUATION, not a sale: no money moves and no wallet changes,
 * only what the holding is worth on paper. The backend logs it as a neutral
 * `asset_update` event so the change has a history point, but it never touches
 * income or expense.
 *
 * Only offered for types whose price a household can actually read off
 * somewhere (`canUpdatePriceManually`); a bank balance is edited through the
 * form, not here.
 */
export function AssetPriceUpdateSheet({
  open,
  onOpenChange,
  asset,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: Asset
}) {
  const { t } = useTranslation()
  const { updateAsset } = useAssets()
  const [price, setPrice] = useState(() => currentRawPrice(asset))
  const [error, setError] = useState('')
  const isBond = asset.type === 'bond'

  async function submit() {
    const nextPrice = Number(price)
    if (!price || !Number.isFinite(nextPrice) || nextPrice <= 0) {
      setError(t('validation.invalidMoney'))
      return
    }

    try {
      if (isBond && asset.calculationTerm) {
        await updateAsset.mutateAsync({
          assetId: asset.id,
          payload: {
            calculationTerm: { ...asset.calculationTerm, principalAmount: nextPrice },
          },
        })
      } else if (asset.marketPosition) {
        await updateAsset.mutateAsync({
          assetId: asset.id,
          payload: {
            marketPosition: {
              ...asset.marketPosition,
              lastPrice: nextPrice,
              lastPriceAt: new Date().toISOString(),
            },
          },
        })
      } else {
        setError(t('assets.priceUpdate.unavailable'))
        return
      }
      notify.success(t('assets.priceUpdate.success'))
      onOpenChange(false)
    } catch (caught) {
      notify.error(getErrorMessage(caught, t('assets.priceUpdate.failed')))
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => onOpenChange(false)}
      title={t('assets.priceUpdate.title')}
      footer={
        <Button onPress={submit} loading={updateAsset.isPending}>
          {t('assets.priceUpdate.submit')}
        </Button>
      }
    >
      <View className="gap-4">
        <Text className="text-[14px] leading-5 text-ink2">
          {t(isBond ? 'assets.priceUpdate.bondHelp' : 'assets.priceUpdate.marketHelp', {
            name: asset.name,
            unit: asset.marketPosition?.unit ?? '',
          })}
        </Text>

        <MoneyInput
          label={t(isBond ? 'assets.priceUpdate.bondValue' : 'assets.priceUpdate.unitPrice')}
          value={price}
          onChange={(next) => {
            setPrice(next)
            setError('')
          }}
          error={error}
        />
      </View>
    </BottomSheet>
  )
}

/** The figure the field opens on: what the app currently prices this at. */
function currentRawPrice(asset: Asset): string {
  const value =
    asset.type === 'bond'
      ? asset.calculationTerm?.principalAmount
      : (asset.marketPosition?.lastPrice ?? asset.marketPosition?.purchasePrice)
  return typeof value === 'number' && Number.isFinite(value) ? String(Math.round(value)) : ''
}
