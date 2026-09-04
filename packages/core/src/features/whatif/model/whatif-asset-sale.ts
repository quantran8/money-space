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
import {
  UNASSIGNED_WALLET_ID,
  type WhatIfAppliedSale,
  type WhatIfAssetSale,
  type WhatIfAssetSaleLine,
  type WhatIfFundingOption,
} from '#/features/whatif/model/whatif.types'
import { parseRawMoney } from '#/shared/lib/number-format'

type Translate = (key: string, params?: Record<string, unknown>) => string

/**
 * One line of the draft — raw strings, as every money field in this codebase is.
 *
 * A market asset (gold, stock, crypto) is sold in ITS OWN UNIT: you cannot sell
 * "86,4tr of gold", you sell 6 chỉ. `quantity` leads for those and the money
 * figure is derived; a manual asset (investment, bond) has no unit, so it is
 * sold by value and `quantity` stays empty.
 */
export type WhatIfAssetSaleLineDraft = {
  /** Stable across re-orders and removals, so React keys survive an edit. */
  key: string
  /** '' until an asset is picked. */
  assetId: string
  /** Raw decimal string ("6", "5,5"). Market assets only. */
  quantity: string
  /** Raw money string ("300000000"). Manual assets only. */
  amount: string
}

/**
 * The whole funding step.
 *
 * Several lines, because one holding often is not enough to close the gap. The
 * receiving wallet is shared: a household selling gold AND stocks to pay for
 * one thing banks the proceeds together, and asking per line would double the
 * fields on a phone for a choice nobody makes differently twice.
 */
export type WhatIfAssetSaleDraft = {
  lines: WhatIfAssetSaleLineDraft[]
  /** The wallet the proceeds land in. Which account holds the cash decides
   *  which goals it is sitting in front of, so the household names it. */
  toAssetId: string
}

let lineKeySeed = 0

/** `crypto.randomUUID` is unavailable on React Native (see [[rn-port-runtime-gotchas]]). */
export function newLineKey(): string {
  lineKeySeed += 1
  return `sale-${lineKeySeed}`
}

export function emptyLineDraft(): WhatIfAssetSaleLineDraft {
  return { key: newLineKey(), assetId: '', quantity: '', amount: '' }
}

export const emptyWhatIfAssetSaleDraft: WhatIfAssetSaleDraft = {
  lines: [],
  toAssetId: '',
}

export type WhatIfAssetSaleLineErrors = {
  assetId?: string
  quantity?: string
  amount?: string
}

export type WhatIfAssetSaleErrors = {
  /** Per line, keyed by `WhatIfAssetSaleLineDraft.key`. */
  lines: Record<string, WhatIfAssetSaleLineErrors>
  toAssetId?: string
}

export const noWhatIfAssetSaleErrors: WhatIfAssetSaleErrors = { lines: {} }

export type WalletOption = { value: string; label: string; balance: number }

/**
 * Wallets that can receive proceeds — the same `usable_now` rule the backend
 * validates against, read through the shared `canSettleCashflow`.
 *
 * A household tracking only gold and stocks has none, and used to reach a
 * required picker with nothing in it. So when there is no real wallet the list
 * carries the one honest answer left: the cash exists and sits in no account
 * yet. Only then — offering it beside real wallets would invite a household
 * that HAS a bank account to park imagined money outside it, and the goals
 * standing in front of that account are the whole point of asking.
 */
export function receivingWalletOptions(
  assets: Asset[],
  asOf: string,
  t: Translate,
): WalletOption[] {
  const wallets = assets
    .filter(canSettleCashflow)
    .map((asset) => ({
      value: asset.id,
      label: asset.name,
      balance: computeCurrentValue(asset, asOf) ?? 0,
    }))
    .sort((left, right) => right.balance - left.balance)

  if (wallets.length > 0) return wallets
  return [
    {
      value: UNASSIGNED_WALLET_ID,
      label: t('whatif.assetSale.unassignedWallet'),
      balance: 0,
    },
  ]
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
 *
 * `currentValue` — the whole position — is exactly what selling everything
 * realises, because `lineProceeds` returns `currentValue` for a full sale
 * rather than re-deriving it from a rounded quantity. So this ceiling is
 * reachable, not merely theoretical.
 */
export function totalSellableValue(options: SellableAssetOption[]): number {
  return options.reduce((sum, option) => sum + option.currentValue, 0)
}

/** What one line's quantity is worth, or its typed value for a manual asset. */
export function lineProceeds(
  line: WhatIfAssetSaleLineDraft,
  option: SellableAssetOption | null,
): number {
  if (!option) return 0
  if (!option.isMarket) {
    const amount = parseRawMoney(line.amount)
    return Number.isFinite(amount) ? amount : 0
  }
  const quantity = parseRawDecimal(line.quantity)
  if (!Number.isFinite(quantity) || quantity <= 0) return 0
  // Selling the whole position realises its whole value, whatever rounding the
  // unit price carries — otherwise "bán tất cả" leaves a few đồng behind.
  if (quantity >= option.heldQuantity) return option.currentValue
  return Math.round(quantity * option.unitPrice)
}

/** What the whole draft raises — every line that names a real asset. */
export function saleProceeds(
  draft: WhatIfAssetSaleDraft,
  options: SellableAssetOption[],
): number {
  return draft.lines.reduce((sum, line) => {
    const option = options.find((candidate) => candidate.value === line.assetId) ?? null
    return sum + lineProceeds(line, option)
  }, 0)
}

/**
 * How many decimal places a fractional quantity is written to.
 *
 * Both clients render the seeded quantity at this precision, so the figure the
 * household sees IS the figure that gets sold. Rounding up at the same step is
 * what keeps a seeded line worth at least what it was seeded to cover.
 */
export const QUANTITY_DECIMALS = 4

/**
 * The smallest quantity worth at least `shortfall` — what the household would
 * actually have to sell. Rounded UP, because you cannot sell 5,7 chỉ vàng and,
 * for an asset that does trade in fractions, rounding the displayed figure DOWN
 * would seed a line worth less than the gap it was filled to close: the step
 * would open already short by a few đồng, and say so.
 */
export function quantityForShortfall(
  option: SellableAssetOption,
  shortfall: number,
): number {
  if (shortfall <= 0 || option.unitPrice <= 0) return 0
  const exact = shortfall / option.unitPrice
  // A whole-number holding means whole-number units; a fractional one rounds up
  // at the precision it is displayed with.
  const stepped = Number.isInteger(option.heldQuantity)
    ? Math.ceil(exact)
    : // `/ step * step` reintroduces binary error (0,0052 → 0,005200000000000001),
      // so the rounding is done on the integer count of steps instead.
      Number(
        (Math.ceil(exact * 10 ** QUANTITY_DECIMALS) / 10 ** QUANTITY_DECIMALS).toFixed(
          QUANTITY_DECIMALS,
        ),
      )
  return Math.min(stepped, option.heldQuantity)
}

function validateLine(
  line: WhatIfAssetSaleLineDraft,
  selected: SellableAssetOption,
  t: Translate,
): WhatIfAssetSaleLineErrors {
  if (selected.isMarket) {
    const quantity = parseRawDecimal(line.quantity)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { quantity: t('whatif.assetSale.quantityRequired') }
    }
    if (quantity > selected.heldQuantity) {
      return {
        quantity: t('whatif.assetSale.quantityExceeds', {
          max: selected.heldQuantity,
          unit: selected.unit,
        }),
      }
    }
    return {}
  }

  const amount = parseRawMoney(line.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return { amount: t('whatif.assetSale.amountRequired') }
  }
  if (amount > selected.currentValue) {
    // Selling more of a thing than exists is a typo, not a hypothesis.
    return {
      amount: t('whatif.assetSale.amountExceeds', { max: selected.currentValue }),
    }
  }
  return {}
}

/**
 * Field errors, or an empty map. Never throws.
 *
 * Every line is checked, not just the first bad one: with three holdings on
 * screen, fixing them one round-trip at a time is the kind of form people
 * abandon.
 */
export function validateWhatIfAssetSale(
  draft: WhatIfAssetSaleDraft,
  options: SellableAssetOption[],
  t: Translate,
): WhatIfAssetSaleErrors {
  const errors: WhatIfAssetSaleErrors = { lines: {} }

  // No lines at all is "chọn một tài sản để thử", which belongs on the first
  // line rather than nowhere — so the step always shows one.
  const seen = new Set<string>()
  for (const line of draft.lines) {
    const selected = options.find((option) => option.value === line.assetId)
    if (!selected) {
      errors.lines[line.key] = { assetId: t('whatif.assetSale.assetRequired') }
      continue
    }
    // The same holding twice would let the household sell 200% of it, one
    // line at a time — each passing its own bound.
    if (seen.has(line.assetId)) {
      errors.lines[line.key] = { assetId: t('whatif.assetSale.assetDuplicate') }
      continue
    }
    seen.add(line.assetId)
    const lineErrors = validateLine(line, selected, t)
    if (Object.keys(lineErrors).length > 0) errors.lines[line.key] = lineErrors
  }

  if (!draft.toAssetId) {
    errors.toAssetId = t('whatif.assetSale.walletRequired')
  }

  return errors
}

/** True when nothing in the draft failed. */
export function hasAssetSaleErrors(errors: WhatIfAssetSaleErrors): boolean {
  return Boolean(errors.toAssetId) || Object.keys(errors.lines).length > 0
}

export function toWhatIfAssetSale(
  draft: WhatIfAssetSaleDraft,
  options: SellableAssetOption[],
): WhatIfAssetSale | undefined {
  if (!draft.toAssetId) return undefined
  const lines: WhatIfAssetSaleLine[] = []
  for (const line of draft.lines) {
    const option = options.find((candidate) => candidate.value === line.assetId) ?? null
    if (!option) continue
    const amount = lineProceeds(line, option)
    if (amount <= 0) continue
    lines.push({ assetId: line.assetId, amount })
  }
  if (lines.length === 0) return undefined
  return { lines, toAssetId: draft.toAssetId }
}

/** The sold holdings, named — "Vàng, Chứng khoán". */
export function soldAssetNames(sale: WhatIfAppliedSale): string {
  return sale.lines.map((line) => line.name).join(', ')
}

/** What the funding step can do about a shortfall, decided in one place. */
export type FundingVerdict =
  /** No shortfall, or the answer is not ready to be judged yet. */
  | { kind: 'none' }
  /** Selling could close it — the only case the step is worth opening for. */
  | { kind: 'canCover' }
  /** Nothing here is sellable at all. */
  | { kind: 'noAssets' }
  /** Sellable holdings exist, but every one of them together falls short. */
  | { kind: 'beyondAssets'; sellable: number; stillShort: number }

/**
 * Can selling close this gap?
 *
 * Shared by web and mobile so the two cannot disagree about when the step
 * opens, and so the REASON it did not open is always the same sentence.
 *
 * `isTotalKnown` guards the asset list still being in flight: an empty list
 * then means "not loaded", not "nothing to sell", and answering from it would
 * tell the household their holdings cannot cover a spend before the app has
 * looked at them.
 */
export function fundingVerdict(
  shortfall: number,
  sellableTotal: number,
  optionCount: number,
  isTotalKnown: boolean,
): FundingVerdict {
  if (shortfall <= 0 || !isTotalKnown) return { kind: 'none' }
  if (optionCount === 0) return { kind: 'noAssets' }
  if (sellableTotal >= shortfall) return { kind: 'canCover' }
  return {
    kind: 'beyondAssets',
    sellable: sellableTotal,
    stillShort: shortfall - sellableTotal,
  }
}

/**
 * Is this spend beyond everything the household has — usable money AND every
 * holding they could sell?
 *
 * Answered on the FORM, before the question is asked, because the answer does
 * not need the engine: a spend larger than the sum of what exists cannot be
 * funded whatever the forecast says about timing. Running it first would spend
 * a round-trip and a screen to arrive at a fact both figures already carry.
 *
 * `null` while either figure is still loading — an unknown ceiling must never
 * read as a ceiling of zero. Deliberately compares against the RAW liquid total
 * rather than flexible money: what a goal has claimed is still the household's
 * money, and telling them a spend is impossible when it is merely expensive
 * would be a verdict, not a fact.
 */
export function exceedsEverything(
  amount: number,
  liquidTotal: number | undefined,
  sellableTotal: number,
  isSellableTotalKnown: boolean,
): { total: number; short: number } | null {
  if (!isSellableTotalKnown || liquidTotal === undefined) return null
  if (!Number.isFinite(amount) || amount <= 0) return null
  const total = liquidTotal + sellableTotal
  if (amount <= total) return null
  return { total, short: amount - total }
}
