/**
 * The optional funding step: "…and to pay for it, we sell part of an asset."
 *
 * **This is not the wallet picker what-if bans.** That ban is about which
 * account the SPEND comes out of — a routing question the engine answers better
 * than the household, using their own goal ranking. This asks what to convert
 * INTO usable money, which the engine cannot answer: gold vs stocks vs crypto
 * is a preference, not a derivable fact. It is also optional, second, and only
 * offered once an answer has shown a shortfall.
 *
 * Nothing here is ever written. See [[what-if]] and [[asset-sale]].
 */
import type { Asset, AssetType } from '#/features/assets/model/assets.types'
import {
  assetTypeOrder,
  canSettleCashflow,
  computeCurrentValue,
  isSellableAssetType,
} from '#/features/assets/model/assets'
import {
  currentQuantity,
  isMarketSale,
  seedUnitPrice,
} from '#/features/assets/model/asset-sale-form'
import { parseRawDecimal } from '#/shared/lib/number-format'
import type {
  WhatIfAssetSale,
  WhatIfFundingOption,
} from '#/features/whatif/model/whatif.types'
import { parseRawMoney } from '#/shared/lib/number-format'

type Translate = (key: string, params?: Record<string, unknown>) => string

/**
 * Raw draft values — strings, as every money field in this codebase is.
 *
 * A market asset (gold, stock, crypto) is sold in ITS OWN UNIT: you cannot sell
 * "86,4tr of gold", you sell 6 chỉ. `quantity` leads for those and the money
 * figure is derived; a manual asset (investment, bond) has no unit, so it is
 * sold by value and `quantity` stays empty.
 */
export type WhatIfAssetSaleDraft = {
  /** '' until an asset is picked. */
  assetId: string
  /** The wallet the proceeds land in. Which account holds the cash decides
   *  which goals it is sitting in front of, so the household names it. */
  toAssetId: string
  /** Raw decimal string ("6", "5,5"). Market assets only. */
  quantity: string
  /** Raw money string ("300000000"). Manual assets only. */
  amount: string
}

export const emptyWhatIfAssetSaleDraft: WhatIfAssetSaleDraft = {
  assetId: '',
  toAssetId: '',
  quantity: '',
  amount: '',
}

export type WhatIfAssetSaleErrors = {
  assetId?: string
  toAssetId?: string
  quantity?: string
  amount?: string
}

export type WalletOption = { value: string; label: string; balance: number }

/**
 * Wallets that can receive proceeds — the same `usable_now` rule the backend
 * validates against, read through the shared `canSettleCashflow`.
 */
export function receivingWalletOptions(
  assets: Asset[],
  asOf: string,
): WalletOption[] {
  return assets
    .filter(canSettleCashflow)
    .map((asset) => ({
      value: asset.id,
      label: asset.name,
      balance: computeCurrentValue(asset, asOf) ?? 0,
    }))
    .sort((left, right) => right.balance - left.balance)
}

export type SellableAssetOption = {
  value: string
  label: string
  /** Asset-type label, for the picker's group headings. */
  group: string
  currentValue: number
  /** What the goals hold of this asset. 0 when nothing is promised. */
  goalClaimedAmount: number
  /** True when this is sold by quantity rather than by value. */
  isMarket: boolean
  /** How much is held, in `unit`. 0 for a manual asset. */
  heldQuantity: number
  /** "chỉ", "cổ phiếu", … Empty for a manual asset. */
  unit: string
  /** VND for one unit, 0 when no price is known. */
  unitPrice: number
}

/**
 * `real_estate` is excluded even though it is sellable for real: a partial
 * property sale is priced by area, so "bán 300tr bất động sản" is a scenario
 * the household could not actually execute.
 */
function isFundingCandidate(type: AssetType): boolean {
  return isSellableAssetType(type) && type !== 'real_estate'
}

/**
 * What the household could plausibly turn into cash for this spend.
 *
 * Prefers the server's `fundingOptions` — it knows what the goals hold of each
 * asset, which is the fact that makes the choice informed. Falls back to the
 * local asset list so the step still works against an older backend, without
 * the goal figures.
 */
export function sellableAssetOptions(
  assets: Asset[],
  asOf: string,
  t: Translate,
  fundingOptions?: WhatIfFundingOption[],
): SellableAssetOption[] {
  const claimed = new Map(
    (fundingOptions ?? []).map((option) => [option.assetId, option.goalClaimedAmount]),
  )

  const candidates = assets.filter((asset) => {
    if (asset.status === 'sold' || asset.status === 'closed') return false
    if (!isFundingCandidate(asset.type)) return false
    // A wallet is transferred from, not sold.
    if (asset.liquidity === 'usable_now') return false
    return (computeCurrentValue(asset, asOf) ?? 0) > 0
  })

  return candidates
    .map((asset) => {
      const currentValue = computeCurrentValue(asset, asOf) ?? 0
      const heldQuantity = currentQuantity(asset)
      const seeded = Number(seedUnitPrice(asset))
      return {
        value: asset.id,
        label: asset.name,
        group: t(`options.assetType.${asset.type}`),
        currentValue,
        goalClaimedAmount: claimed.get(asset.id) ?? 0,
        isMarket: isMarketSale(asset) && heldQuantity > 0,
        heldQuantity,
        unit: asset.marketPosition?.unit ?? '',
        /**
         * Today's quote when there is one; otherwise the position's own average
         * (value ÷ held), which is the only honest figure left and keeps a
         * priceless holding sellable in a hypothesis.
         */
        unitPrice:
          Number.isFinite(seeded) && seeded > 0
            ? seeded
            : heldQuantity > 0
              ? currentValue / heldQuantity
              : 0,
        type: asset.type,
      }
    })
    // Grouped first so the picker's headings stay contiguous, then biggest
    // first inside a group — the household is scanning for "enough to cover it".
    .sort((left, right) => {
      const byType =
        assetTypeOrder.indexOf(left.type) - assetTypeOrder.indexOf(right.type)
      if (byType !== 0) return byType
      const byValue = right.currentValue - left.currentValue
      return byValue !== 0 ? byValue : left.label.localeCompare(right.label)
    })
    .map(({ type: _type, ...option }) => option)
}

/**
 * The most these holdings could raise — every sellable asset, sold whole.
 *
 * Read at the moment the answer lands, to decide which of three things the
 * household is told: usable money covers it, selling could cover it, or the
 * gap is out of reach even after selling everything. That last case must not
 * open the funding step: an asset picker whose every option leaves them short
 * is a form that cannot be completed.
 */
export function totalSellableValue(options: SellableAssetOption[]): number {
  return options.reduce((sum, option) => sum + option.currentValue, 0)
}

/** What a draft's quantity is worth, or its typed value for a manual asset. */
export function saleProceeds(
  draft: WhatIfAssetSaleDraft,
  option: SellableAssetOption | null,
): number {
  if (!option) return 0
  if (!option.isMarket) {
    const amount = parseRawMoney(draft.amount)
    return Number.isFinite(amount) ? amount : 0
  }
  const quantity = parseRawDecimal(draft.quantity)
  if (!Number.isFinite(quantity) || quantity <= 0) return 0
  // Selling the whole position realises its whole value, whatever rounding the
  // unit price carries — otherwise "bán tất cả" leaves a few đồng behind.
  if (quantity >= option.heldQuantity) return option.currentValue
  return Math.round(quantity * option.unitPrice)
}

/**
 * The smallest quantity worth at least `shortfall` — what the household would
 * actually have to sell. Rounded UP to a whole unit unless the asset trades in
 * fractions, because you cannot sell 5,7 chỉ vàng.
 */
export function quantityForShortfall(
  option: SellableAssetOption,
  shortfall: number,
): number {
  if (shortfall <= 0 || option.unitPrice <= 0) return 0
  const exact = shortfall / option.unitPrice
  // A whole-number holding means whole-number units.
  const stepped = Number.isInteger(option.heldQuantity) ? Math.ceil(exact) : exact
  return Math.min(stepped, option.heldQuantity)
}

/** Field errors, or an empty object. Never throws. */
export function validateWhatIfAssetSale(
  draft: WhatIfAssetSaleDraft,
  options: SellableAssetOption[],
  t: Translate,
): WhatIfAssetSaleErrors {
  const errors: WhatIfAssetSaleErrors = {}

  const selected = options.find((option) => option.value === draft.assetId)
  if (!selected) {
    errors.assetId = t('whatif.assetSale.assetRequired')
    return errors
  }

  if (!draft.toAssetId) {
    errors.toAssetId = t('whatif.assetSale.walletRequired')
  }

  if (selected.isMarket) {
    const quantity = parseRawDecimal(draft.quantity)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.quantity = t('whatif.assetSale.quantityRequired')
    } else if (quantity > selected.heldQuantity) {
      errors.quantity = t('whatif.assetSale.quantityExceeds', {
        max: selected.heldQuantity,
        unit: selected.unit,
      })
    }
    return errors
  }

  const amount = parseRawMoney(draft.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = t('whatif.assetSale.amountRequired')
  } else if (amount > selected.currentValue) {
    // Selling more of a thing than exists is a typo, not a hypothesis.
    errors.amount = t('whatif.assetSale.amountExceeds', {
      max: selected.currentValue,
    })
  }

  return errors
}

export function toWhatIfAssetSale(
  draft: WhatIfAssetSaleDraft,
  option: SellableAssetOption | null,
): WhatIfAssetSale | undefined {
  if (!draft.assetId || !draft.toAssetId || !option) return undefined
  const amount = saleProceeds(draft, option)
  if (amount <= 0) return undefined
  return { assetId: draft.assetId, amount, toAssetId: draft.toAssetId }
}
