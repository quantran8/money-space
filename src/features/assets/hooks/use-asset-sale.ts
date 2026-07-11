import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useAssets } from '@/features/assets/hooks/use-assets'
import { AS_OF } from '@/features/assets/model/assets-form'
import {
  buildAssetSaleSchema,
  computeNet,
  currentQuantity,
  defaultAssetSaleValues,
  isMarketSale,
  toSalePayload,
  type AssetSaleForm,
} from '@/features/assets/model/asset-sale-form'
import type { Asset } from '@/features/assets/model/assets'
import { useEvents } from '@/features/events/hooks/use-events'
import { getErrorMessage } from '@/shared/lib/get-error-message'

/** A neutral fallback schema so the form has a resolver before an asset is chosen. */
const FALLBACK_ASSET: Asset = {
  id: '__none__',
  name: '',
  type: 'gold',
  valuationMode: 'manual',
  liquidity: 'long_term',
  currency: 'VND',
  note: '',
}

export function useAssetSale() {
  const { t } = useTranslation()
  const { assets, asOf } = useAssets()
  const { createEvent } = useEvents()

  const [saleOpen, setSaleOpen] = useState(false)
  const [sellingAsset, setSellingAsset] = useState<Asset | null>(null)

  const effectiveAsset = sellingAsset ?? FALLBACK_ASSET
  const saleSchema = useMemo(
    () => buildAssetSaleSchema(t, effectiveAsset),
    [t, effectiveAsset],
  )

  const form = useForm<AssetSaleForm>({
    resolver: zodResolver(saleSchema),
    defaultValues: defaultAssetSaleValues,
    mode: 'onChange',
  })

  const { reset, watch, handleSubmit } = form

  const walletOptions = useMemo(
    () =>
      assets
        .filter((asset) => asset.type === 'cash' || asset.type === 'bank_account')
        .map((asset) => ({ value: asset.id, label: asset.name })),
    [assets],
  )

  const isMarketAsset = sellingAsset ? isMarketSale(sellingAsset) : false
  const heldQuantity = sellingAsset ? currentQuantity(sellingAsset) : 0

  const proceeds = watch('proceeds')
  const fee = watch('fee')
  const previewNet = useMemo(() => computeNet(proceeds, fee), [proceeds, fee])

  useEffect(() => {
    if (!saleOpen) return
    reset({
      ...defaultAssetSaleValues,
      date: asOf || AS_OF,
      toAssetId: walletOptions[0]?.value ?? '',
    })
    // walletOptions intentionally omitted: only re-seed on open / asset change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleOpen, sellingAsset, asOf, reset])

  function openSale(asset: Asset) {
    setSellingAsset(asset)
    setSaleOpen(true)
  }

  function closeSale() {
    setSaleOpen(false)
    setSellingAsset(null)
  }

  function handleOpenChange(open: boolean) {
    if (open) {
      setSaleOpen(true)
    } else {
      closeSale()
    }
  }

  async function onSubmit(values: AssetSaleForm) {
    if (!sellingAsset) return
    try {
      const payload = toSalePayload(sellingAsset, values, asOf || AS_OF)
      await createEvent.mutateAsync(payload)
      toast.success('Da ban tai san.')
      closeSale()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Khong the ban tai san.'))
    }
  }

  return {
    saleOpen,
    openSale,
    closeSale,
    handleOpenChange,
    sellingAsset,
    form,
    walletOptions,
    isMarketAsset,
    currentQuantity: heldQuantity,
    previewNet,
    isSubmitting: createEvent.isPending,
    submit: handleSubmit(onSubmit),
  }
}
