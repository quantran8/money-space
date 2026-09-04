import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAssets } from '#/features/assets/hooks/use-assets'
import {
  emptyLineDraft,
  emptyWhatIfAssetSaleDraft,
  hasAssetSaleErrors,
  lineProceeds,
  noWhatIfAssetSaleErrors,
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
  type WhatIfAssetSaleLineDraft,
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
 * Plain state rather than react-hook-form: a short list of lines with one rule
 * each, and mobile's primary button must never be disabled (§22.10), which
 * fights RHF's `isValid` gating. `use-asset-sale` earns RHF with eight fields
 * and cross-field rules; this does not.
 *
 * **This hook never writes.** Unlike `use-asset-sale`, there is no mutation and
 * no `createEvent` — the sale is a hypothesis that dies with the response.
 */
export function useWhatIfAssetSale(fundingOptions?: WhatIfFundingOption[]) {
  const { t } = useTranslation()
  const { assets, asOf, isLoading } = useAssets()

  const [draft, setDraft] = useState<WhatIfAssetSaleDraft>(emptyWhatIfAssetSaleDraft)
  const [errors, setErrors] = useState<WhatIfAssetSaleErrors>(noWhatIfAssetSaleErrors)
  // What the step was opened to cover, so picking another asset re-estimates
  // against the same gap rather than leaving the previous asset's figure.
  const [target, setTarget] = useState(0)

  const options = useMemo(
    () => sellableAssetOptions(assets, asOf, t, fundingOptions),
    [assets, asOf, t, fundingOptions],
  )
  const walletOptions = useMemo(
    () => receivingWalletOptions(assets, asOf, t),
    [assets, asOf, t],
  )
  const sellableTotal = useMemo(() => totalSellableValue(options), [options])

  /**
   * Whether the ceiling above can be trusted yet.
   *
   * `options` is built from the client's OWN asset list, so while that query is
   * still in flight it is empty and `sellableTotal` is 0 — which reads exactly
   * like "nothing can be sold". Opening or refusing the funding step on a
   * figure that is merely not loaded yet states a fact the app does not have.
   */
  const isSellableTotalKnown = !isLoading

  const optionFor = useCallback(
    (assetId: string) => options.find((option) => option.value === assetId) ?? null,
    [options],
  )

  /** Fill in how much of THIS asset would cover the remaining gap. */
  const estimateFor = useCallback(
    (option: SellableAssetOption | null, shortfall: number) => {
      if (!option || shortfall <= 0) return { quantity: '', amount: '' }
      if (!option.isMarket) {
        return {
          quantity: '',
          amount: String(Math.round(Math.min(shortfall, option.currentValue))),
        }
      }
      const quantity = quantityForShortfall(option, shortfall)
      return { amount: '', quantity: quantity > 0 ? formatQuantity(quantity) : '' }
    },
    [],
  )

  /**
   * What the OTHER lines already raise — so a line is estimated against the gap
   * that is actually left, not the whole shortfall. Without this, adding a
   * second asset pre-fills it to cover a gap the first one has already closed.
   */
  const raisedExcluding = useCallback(
    (lines: WhatIfAssetSaleLineDraft[], key: string) =>
      lines.reduce(
        (sum, line) =>
          line.key === key ? sum : sum + lineProceeds(line, optionFor(line.assetId)),
        0,
      ),
    [optionFor],
  )

  const clearLineError = useCallback((key: string, field: 'quantity' | 'amount') => {
    setErrors((current) => {
      const forLine = current.lines[key]
      if (!forLine?.[field]) return current
      return {
        ...current,
        lines: { ...current.lines, [key]: { ...forLine, [field]: undefined } },
      }
    })
  }, [])

  const setLineAssetId = useCallback(
    (key: string, assetId: string) => {
      setDraft((current) => {
        const option = optionFor(assetId)
        const remaining = target - raisedExcluding(current.lines, key)
        return {
          ...current,
          lines: current.lines.map((line) =>
            line.key === key
              ? {
                  ...line,
                  assetId,
                  // Re-estimate for the asset just picked: 86tr is 6 chỉ of
                  // gold and a quite different number of shares.
                  ...estimateFor(option, remaining),
                }
              : line,
          ),
        }
      })
      setErrors((current) => ({ ...current, lines: { ...current.lines, [key]: {} } }))
    },
    [optionFor, estimateFor, raisedExcluding, target],
  )

  const setLineQuantity = useCallback(
    (key: string, quantity: string) => {
      setDraft((current) => ({
        ...current,
        lines: current.lines.map((line) =>
          line.key === key ? { ...line, quantity } : line,
        ),
      }))
      clearLineError(key, 'quantity')
    },
    [clearLineError],
  )

  const setLineAmount = useCallback(
    (key: string, amount: string) => {
      setDraft((current) => ({
        ...current,
        lines: current.lines.map((line) =>
          line.key === key ? { ...line, amount } : line,
        ),
      }))
      clearLineError(key, 'amount')
    },
    [clearLineError],
  )

  /**
   * Another holding to sell — pre-filled with the asset that best covers what
   * the lines so far still leave open, since that is why the household is
   * reaching for a second one.
   */
  const addLine = useCallback(() => {
    setDraft((current) => {
      const used = new Set(current.lines.map((line) => line.assetId))
      const available = options.filter((option) => !used.has(option.value))
      if (available.length === 0) return current
      const remaining = target - saleProceeds(current, options)
      const option =
        (remaining > 0
          ? available.find((candidate) => candidate.currentValue >= remaining)
          : undefined) ?? available[0]
      return {
        ...current,
        lines: [
          ...current.lines,
          {
            ...emptyLineDraft(),
            assetId: option.value,
            ...estimateFor(option, remaining),
          },
        ],
      }
    })
  }, [options, estimateFor, target])

  const removeLine = useCallback((key: string) => {
    setDraft((current) => ({
      ...current,
      lines: current.lines.filter((line) => line.key !== key),
    }))
    setErrors((current) => {
      const { [key]: _dropped, ...rest } = current.lines
      return { ...current, lines: rest }
    })
  }, [])

  const setToAssetId = useCallback((toAssetId: string) => {
    setDraft((current) => ({ ...current, toAssetId }))
    setErrors((current) => ({ ...current, toAssetId: undefined }))
  }, [])

  /**
   * Open the step already answered: the biggest holding, and how much of it
   * would cover the gap. The household is here because they are short a known
   * amount — making them work out that 86,4tr is 6 chỉ is arithmetic the app
   * can do. They can still change either field, or add another holding.
   */
  const seedFromShortfall = useCallback(
    (shortfall: number) => {
      if (shortfall <= 0) return
      setTarget(shortfall)
      setDraft((current) => {
        if (current.lines.length > 0) return current
        // `options` is sorted biggest-first within a type group; the first one
        // that can actually cover the gap is the fewest units to sell.
        const option =
          options.find((candidate) => candidate.currentValue >= shortfall) ?? options[0]
        if (!option) return current
        return {
          ...current,
          // The biggest wallet, as a starting point they can change.
          toAssetId: current.toAssetId || (walletOptions[0]?.value ?? ''),
          lines: [
            {
              ...emptyLineDraft(),
              assetId: option.value,
              ...estimateFor(option, shortfall),
            },
          ],
        }
      })
    },
    [options, walletOptions, estimateFor],
  )

  const clear = useCallback(() => {
    setDraft(emptyWhatIfAssetSaleDraft)
    setErrors(noWhatIfAssetSaleErrors)
    setTarget(0)
  }, [])

  /** The payload, or null — and the field errors, as a side effect. */
  const validate = useCallback((): WhatIfAssetSale | null => {
    const found = validateWhatIfAssetSale(draft, options, t)
    setErrors(found)
    if (hasAssetSaleErrors(found)) return null
    return toWhatIfAssetSale(draft, options) ?? null
  }, [draft, options, t])

  /**
   * Per-line view data — the option, what the line raises, and what would be
   * left of the holding — so both clients render a row without re-deriving it.
   */
  const lines = useMemo(
    () =>
      draft.lines.map((line) => {
        const option = optionFor(line.assetId)
        const proceeds = lineProceeds(line, option)
        return {
          draft: line,
          option,
          proceeds,
          /**
           * What the sold asset would be worth afterwards, for the preview line.
           *
           * `null` once the amount runs past the holding — errors only populate
           * on submit, so without this the preview would show a negative
           * remainder while the household is still typing. Not a clamp of a
           * reported figure: there is no honest preview of selling more than
           * exists, so none is shown.
           */
          remainingAfterSale:
            !option || proceeds > option.currentValue
              ? null
              : option.currentValue - proceeds,
          errors: errors.lines[line.key] ?? {},
        }
      }),
    [draft.lines, optionFor, errors.lines],
  )

  return {
    options,
    walletOptions,
    /**
     * The ceiling on what selling could raise. The sheet compares it against
     * the shortfall BEFORE opening the funding step, so a gap nothing can
     * close is stated as such instead of becoming an unfillable form.
     */
    sellableTotal,
    isSellableTotalKnown,
    lines,
    /** False once every sellable holding is already on a line. */
    canAddLine: draft.lines.length < options.length,
    draft,
    errors,
    isLoadingAssets: isLoading,
    /** What the draft would actually raise — the unit maths, done for them. */
    proceeds: saleProceeds(draft, options),
    setLineAssetId,
    setLineQuantity,
    setLineAmount,
    addLine,
    removeLine,
    setToAssetId,
    seedFromShortfall,
    clear,
    validate,
  }
}
