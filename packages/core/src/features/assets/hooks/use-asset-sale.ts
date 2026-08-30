import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { notify } from '#/shared/notify'

import { useAssets } from '#/features/assets/hooks/use-assets'
import { AS_OF } from '#/features/assets/model/assets-form'
import {
  buildAssetSaleSchema,
  computeNet,
  defaultAssetSaleValues,
  effectiveHeldQuantity,
  isMarketSale,
  toSaleEditValues,
  toSalePayload,
  type AssetSaleForm,
} from '#/features/assets/model/asset-sale-form'
import type { Asset } from '#/features/assets/model/assets'
import { useEvents } from '#/features/events/hooks/use-events'
import type { MoneyEventItem } from '#/features/events/model/events.types'
import { getErrorMessage } from '#/shared/lib/get-error-message'

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

/**
 * The price to open a sale at: what one unit is worth TODAY.
 *
 * `marketPrice` (today's cached quote) leads, because a sale is agreed at the
 * current price — `lastPrice` is only what was last RECORDED, and cost basis
 * (`purchasePrice`) is what the position was bought at, so seeding from either
 * opens the form at a stale number the user must notice and overwrite.
 *
 * Only a VND figure may be seeded: the field is đồng, and `marketPrice` carries
 * the instrument's own currency. A foreign quote is left for the dialog to
 * convert and fill.
 */
function seedUnitPrice(asset: Asset | null): string {
  const position = asset?.marketPosition
  if (position) {
    const currency = position.marketPriceCurrency ?? position.quoteCurrency
    if (position.marketPrice !== undefined && currency === 'VND') {
      return String(Math.round(position.marketPrice))
    }
    const fallback = position.lastPrice ?? position.purchasePrice
    if (fallback !== undefined && position.quoteCurrency === 'VND') {
      return String(Math.round(fallback))
    }
    return ''
  }
  if (asset?.type === 'real_estate' && asset.areaSqm) {
    return String(Math.round((asset.manualValue ?? 0) / asset.areaSqm))
  }
  return ''
}

export function useAssetSale() {
  const { t } = useTranslation()
  const { assets, asOf } = useAssets()
  const { createEvent, updateEvent } = useEvents()

  const [saleOpen, setSaleOpen] = useState(false)
  const [sellingAsset, setSellingAsset] = useState<Asset | null>(null)
  // Set when editing an existing asset_sale event (null = creating a new sale).
  const [editingEvent, setEditingEvent] = useState<MoneyEventItem | null>(null)

  const effectiveAsset = sellingAsset ?? FALLBACK_ASSET
  const saleSchema = useMemo(
    () => buildAssetSaleSchema(t, effectiveAsset, editingEvent ?? undefined),
    [t, effectiveAsset, editingEvent],
  )

  const form = useForm<AssetSaleForm>({
    resolver: zodResolver(saleSchema),
    defaultValues: defaultAssetSaleValues,
    mode: 'onChange',
  })

  const { reset, watch, setValue, handleSubmit } = form

  const walletOptions = useMemo(
    () =>
      assets
        .filter((asset) => asset.type === 'cash' || asset.type === 'bank_account')
        .map((asset) => ({ value: asset.id, label: asset.name })),
    [assets],
  )

  const isMarketAsset = sellingAsset ? isMarketSale(sellingAsset) : false
  // On edit, show the PRE-sale holding (the backend adds this sale's quantity
  // back before re-applying), so the user can raise the quantity if they want.
  const heldQuantity = sellingAsset
    ? effectiveHeldQuantity(sellingAsset, editingEvent ?? undefined)
    : 0

  const proceeds = watch('proceeds')
  const quantity = watch('quantity')
  const unitPrice = watch('unitPrice')
  const sellAll = watch('sellAll')
  const fee = watch('fee')
  const previewNet = useMemo(() => computeNet(proceeds, fee), [proceeds, fee])

  useEffect(() => {
    if (!saleOpen || !isMarketAsset) return
    const parsedQuantity = sellAll ? heldQuantity : Number(quantity.replace(',', '.'))
    const parsedUnitPrice = Number(unitPrice)
    const total = parsedQuantity * parsedUnitPrice
    setValue('proceeds', Number.isFinite(total) && total > 0 ? String(Math.round(total)) : '', {
      shouldValidate: true,
    })
  }, [saleOpen, isMarketAsset, sellAll, heldQuantity, quantity, unitPrice, setValue])

  useEffect(() => {
    if (!saleOpen) return
    // Editing an existing sale → prefill from the event; creating → blank form.
    if (editingEvent && sellingAsset) {
      reset(toSaleEditValues(sellingAsset, editingEvent))
      return
    }
    reset({
      ...defaultAssetSaleValues,
      date: asOf || AS_OF,
      toAssetId: walletOptions[0]?.value ?? '',
      unitPrice: seedUnitPrice(sellingAsset),
    })
    // walletOptions intentionally omitted: only re-seed on open / asset change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleOpen, sellingAsset, editingEvent, asOf, reset])

  function openSale(asset: Asset) {
    setEditingEvent(null)
    setSellingAsset(asset)
    setSaleOpen(true)
  }

  /** Open the sale dialog to EDIT an existing `asset_sale` event. */
  function openSaleForEdit(asset: Asset, event: MoneyEventItem) {
    setEditingEvent(event)
    setSellingAsset(asset)
    setSaleOpen(true)
  }

  function closeSale() {
    setSaleOpen(false)
    setSellingAsset(null)
    setEditingEvent(null)
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
      const payload = toSalePayload(
        sellingAsset,
        values,
        asOf || AS_OF,
        editingEvent ?? undefined,
      )
      if (editingEvent?.id) {
        await updateEvent.mutateAsync({ eventId: editingEvent.id, payload })
        notify.success('Da cap nhat giao dich ban.')
      } else {
        await createEvent.mutateAsync(payload)
        notify.success('Da ban tai san.')
      }
      closeSale()
    } catch (error) {
      notify.error(
        getErrorMessage(
          error,
          editingEvent ? 'Khong the cap nhat giao dich ban.' : 'Khong the ban tai san.',
        ),
      )
    }
  }

  return {
    saleOpen,
    openSale,
    openSaleForEdit,
    closeSale,
    handleOpenChange,
    sellingAsset,
    isEditing: !!editingEvent,
    form,
    walletOptions,
    isMarketAsset,
    currentQuantity: heldQuantity,
    previewNet,
    isSubmitting: createEvent.isPending || updateEvent.isPending,
    submit: handleSubmit(onSubmit),
  }
}
