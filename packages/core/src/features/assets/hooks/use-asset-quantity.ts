import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { useAssets } from '#/features/assets/hooks/use-assets'
import type { Asset } from '#/features/assets/model/assets'
import {
  buildAssetPurchaseSchema,
  buildAssetQuantityAdjustmentSchema,
  defaultAssetPurchaseValues,
  defaultAssetQuantityAdjustmentValues,
  heldQuantity,
  toPurchasePayload,
  type AssetPurchaseForm,
  type AssetQuantityAdjustmentForm,
} from '#/features/assets/model/asset-quantity-form'
import { getErrorMessage } from '#/shared/lib/get-error-message'
import { notify } from '#/shared/notify'
import { parseRawDecimal } from '#/shared/lib/number-format'

/** A neutral fallback so the forms have a resolver before an asset is chosen. */
const FALLBACK_ASSET: Asset = {
  id: '__none__',
  name: '',
  type: 'gold',
  valuationMode: 'market_priced',
  liquidity: 'long_term',
  currency: 'VND',
  note: '',
}

/**
 * The two non-sale ways a holding changes: bought more, or corrected.
 *
 * Both used to be one thing — typing a new number into the asset edit form —
 * which is why they are here together now. Splitting them is the point: the
 * server writes a different event for each, so a corrected holding stops being
 * reported as a market movement.
 */
export function useAssetQuantity() {
  const { t } = useTranslation()
  const { assets, purchaseIntoPosition, updateAsset } = useAssets()

  const [mode, setMode] = useState<'purchase' | 'adjustment' | null>(null)
  const [asset, setAsset] = useState<Asset | null>(null)

  const effectiveAsset = asset ?? FALLBACK_ASSET
  const currentQuantity = heldQuantity(effectiveAsset)

  const purchaseSchema = useMemo(() => buildAssetPurchaseSchema(t), [t])
  const adjustmentSchema = useMemo(
    () => buildAssetQuantityAdjustmentSchema(t, effectiveAsset),
    [t, effectiveAsset],
  )

  const purchaseForm = useForm<AssetPurchaseForm>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: defaultAssetPurchaseValues,
    mode: 'onChange',
  })
  const adjustmentForm = useForm<AssetQuantityAdjustmentForm>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: defaultAssetQuantityAdjustmentValues,
    mode: 'onChange',
  })

  const walletOptions = useMemo(
    () =>
      assets
        .filter((item) => item.type === 'cash' || item.type === 'bank_account')
        .map((item) => ({ value: item.id, label: item.name })),
    [assets],
  )

  // Seed on open: the purchase form starts at the last known unit price, the
  // adjustment form at the holding being corrected — the number the user is
  // about to change, so they can see what they are changing it from.
  useEffect(() => {
    if (mode === 'purchase') {
      const lastPrice =
        asset?.marketPosition?.lastPrice ?? asset?.marketPosition?.purchasePrice
      purchaseForm.reset({
        ...defaultAssetPurchaseValues,
        unitPrice: lastPrice !== undefined ? String(Math.round(lastPrice)) : '',
        fundingAssetId: walletOptions[0]?.value ?? '',
      })
    }
    if (mode === 'adjustment') {
      adjustmentForm.reset({
        ...defaultAssetQuantityAdjustmentValues,
        quantity: currentQuantity ? String(currentQuantity).replace('.', ',') : '',
      })
    }
    // walletOptions intentionally omitted: only re-seed on open / asset change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, asset])

  function openPurchase(target: Asset) {
    setAsset(target)
    setMode('purchase')
  }

  function openAdjustment(target: Asset) {
    setAsset(target)
    setMode('adjustment')
  }

  function close() {
    setMode(null)
    setAsset(null)
  }

  function handleOpenChange(open: boolean) {
    if (!open) close()
  }

  async function submitPurchase(values: AssetPurchaseForm) {
    if (!asset) return
    try {
      await purchaseIntoPosition.mutateAsync({
        assetId: asset.id,
        payload: toPurchasePayload(values),
      })
      notify.success(t('assets.purchase.success'))
      close()
    } catch (error) {
      notify.error(getErrorMessage(error, t('assets.purchase.error')))
    }
  }

  async function submitAdjustment(values: AssetQuantityAdjustmentForm) {
    if (!asset?.marketPosition) return
    try {
      // Only `quantity` moves. Sending the rest of the position unchanged is what
      // lets the server recognise this as a quantity-only edit and write an
      // `asset_quantity_adjustment` rather than a revaluation.
      await updateAsset.mutateAsync({
        assetId: asset.id,
        payload: {
          marketPosition: {
            ...asset.marketPosition,
            quantity: parseRawDecimal(values.quantity),
          },
          ...(values.reason.trim() ? { note: values.reason.trim() } : {}),
        },
      })
      notify.success(t('assets.quantityAdjustment.success'))
      close()
    } catch (error) {
      notify.error(getErrorMessage(error, t('assets.quantityAdjustment.error')))
    }
  }

  return {
    mode,
    asset,
    currentQuantity,
    walletOptions,
    openPurchase,
    openAdjustment,
    close,
    handleOpenChange,
    purchaseForm,
    adjustmentForm,
    isSubmitting: purchaseIntoPosition.isPending || updateAsset.isPending,
    submitPurchase: purchaseForm.handleSubmit(submitPurchase),
    submitAdjustment: adjustmentForm.handleSubmit(submitAdjustment),
  }
}
