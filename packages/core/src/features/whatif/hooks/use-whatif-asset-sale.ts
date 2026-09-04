import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAssets } from '#/features/assets/hooks/use-assets'
import {
  emptyWhatIfAssetSaleDraft,
  quantityForShortfall,
  receivingWalletOptions,
  saleProceeds,
  sellableAssetOptions,
  toWhatIfAssetSale,
  totalSellableValue,
  validateWhatIfAssetSale,
  type SellableAssetOption,
  type WhatIfAssetSaleDraft,
  type WhatIfAssetSaleErrors,
} from '#/features/whatif/model/whatif-asset-sale'
import type {
  WhatIfAssetSale,
  WhatIfFundingOption,
} from '#/features/whatif/model/whatif.types'

/** Comma is the decimal separator for quantities in this app. */
function formatQuantity(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : String(Number(value.toFixed(4))).replace('.', ',')
}

/**
 * The funding step's state, shared by web and mobile so only layout differs.
 *
 * Plain state rather than react-hook-form: two fields with one rule, and
 * mobile's primary button must never be disabled (§22.10), which fights RHF's
 * `isValid` gating. `use-asset-sale` earns RHF with eight fields and
 * cross-field rules; this does not.
 *
 * **This hook never writes.** Unlike `use-asset-sale`, there is no mutation and
 * no `createEvent` — the sale is a hypothesis that dies with the response.
 */
export function useWhatIfAssetSale(fundingOptions?: WhatIfFundingOption[]) {
  const { t } = useTranslation()
  const { assets, asOf, isLoading } = useAssets()

  const [draft, setDraft] = useState<WhatIfAssetSaleDraft>(emptyWhatIfAssetSaleDraft)
  const [errors, setErrors] = useState<WhatIfAssetSaleErrors>({})
  // What the step was opened to cover, so picking another asset re-estimates
  // against the same gap rather than leaving the previous asset's figure.
  const [target, setTarget] = useState(0)

  const options = useMemo(
    () => sellableAssetOptions(assets, asOf, t, fundingOptions),
    [assets, asOf, t, fundingOptions],
  )
  const walletOptions = useMemo(
    () => receivingWalletOptions(assets, asOf),
    [assets, asOf],
  )
  const sellableTotal = useMemo(() => totalSellableValue(options), [options])
  const selected = options.find((option) => option.value === draft.assetId) ?? null

  /** Fill in how much of THIS asset would cover the gap. */
  const estimateFor = useCallback(
    (option: SellableAssetOption | undefined, shortfall: number) => {
      if (!option || shortfall <= 0) return {}
      if (!option.isMarket) {
        return { amount: String(Math.round(Math.min(shortfall, option.currentValue))) }
      }
      const quantity = quantityForShortfall(option, shortfall)
      return quantity > 0 ? { quantity: formatQuantity(quantity) } : {}
    },
    [],
  )

  const setAssetId = useCallback(
    (assetId: string) => {
      const option = options.find((candidate) => candidate.value === assetId)
      setDraft((current) => ({
        ...current,
        assetId,
        quantity: '',
        amount: '',
        // Re-estimate for the asset just picked: 86tr is 6 chỉ of gold and a
        // quite different number of shares.
        ...estimateFor(option, target),
      }))
      setErrors({})
    },
    [options, estimateFor, target],
  )

  const setQuantity = useCallback((quantity: string) => {
    setDraft((current) => ({ ...current, quantity }))
    setErrors((current) => ({ ...current, quantity: undefined }))
  }, [])

  const setToAssetId = useCallback((toAssetId: string) => {
    setDraft((current) => ({ ...current, toAssetId }))
    setErrors((current) => ({ ...current, toAssetId: undefined }))
  }, [])

  const setAmount = useCallback((amount: string) => {
    setDraft((current) => ({ ...current, amount }))
    setErrors((current) => ({ ...current, amount: undefined }))
  }, [])

  /**
   * Open the step already answered: the biggest holding, and how much of it
   * would cover the gap. The household is here because they are short a known
   * amount — making them work out that 86,4tr is 6 chỉ is arithmetic the app
   * can do. They can still change either field.
   */
  const seedFromShortfall = useCallback(
    (shortfall: number) => {
      if (shortfall <= 0) return
      setTarget(shortfall)
      setDraft((current) => {
        if (current.assetId) return current
        // `options` is sorted biggest-first within a type group; the first one
        // that can actually cover the gap is the fewest units to sell.
        const option =
          options.find((candidate) => candidate.currentValue >= shortfall) ?? options[0]
        if (!option) return current
        return {
          ...current,
          assetId: option.value,
          // The biggest wallet, as a starting point they can change.
          toAssetId: current.toAssetId || (walletOptions[0]?.value ?? ''),
          ...estimateFor(option, shortfall),
        }
      })
    },
    [options, walletOptions, estimateFor],
  )

  const clear = useCallback(() => {
    setDraft(emptyWhatIfAssetSaleDraft)
    setErrors({})
    setTarget(0)
  }, [])

  /** The payload, or null — and the field errors, as a side effect. */
  const validate = useCallback((): WhatIfAssetSale | null => {
    const found = validateWhatIfAssetSale(draft, options, t)
    setErrors(found)
    if (Object.keys(found).length > 0) return null
    return toWhatIfAssetSale(draft, selected) ?? null
  }, [draft, options, selected, t])

  return {
    options,
    walletOptions,
    /**
     * The ceiling on what selling could raise. The sheet compares it against
     * the shortfall BEFORE opening the funding step, so a gap nothing can
     * close is stated as such instead of becoming an unfillable form.
     */
    sellableTotal,
    selected,
    draft,
    errors,
    isLoadingAssets: isLoading,
    /**
     * What the sold asset would be worth afterwards, for the preview line.
     *
     * `null` once the amount runs past the holding — errors only populate on
     * submit, so without this the preview would show a negative remainder while
     * the household is still typing. Not a clamp of a reported figure: there is
     * no honest preview of selling more than exists, so none is shown.
     */
    remainingAfterSale: (() => {
      if (!selected) return null
      const amount = saleProceeds(draft, selected)
      return amount > selected.currentValue ? null : selected.currentValue - amount
    })(),
    /** What the draft would actually raise — the unit maths, done for them. */
    proceeds: saleProceeds(draft, selected),
    setAssetId,
    setToAssetId,
    setQuantity,
    setAmount,
    seedFromShortfall,
    clear,
    validate,
  }
}
