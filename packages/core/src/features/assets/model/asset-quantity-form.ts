import { z } from 'zod'

import type { Asset } from '#/features/assets/model/assets'
import { parseRawDecimal, parseRawMoney } from '#/shared/lib/number-format'

type Translate = (key: string, params?: Record<string, unknown>) => string

/**
 * The two ways a market position's quantity may change outside a sale.
 *
 * They are separate forms because they are separate acts, and conflating them
 * is what the asset edit form used to do: any quantity change was written as a
 * revaluation, so buying more gold and correcting a typo'd holding both showed
 * up as the price having moved.
 *
 *  - `purchase` — more was bought. A wallet pays, the cost basis re-averages.
 *  - `adjustment` — the holding was wrong and is now right. No money moved, so
 *    no wallet is touched and nothing lands in P&L; the old history stays as it
 *    was and a new record states both sides of the correction.
 */

/** Raw form values for buying more of a held position. */
export type AssetPurchaseForm = {
  /** How much was added, in the position's unit. Raw decimal string ("0,5"). */
  quantity: string
  /** Price paid per unit, in VND. Raw money string. */
  unitPrice: string
  /**
   * The wallet that paid, or '' for "it arrived without being bought" (a gift,
   * a stock dividend) — then no balance moves and net worth rises, which is
   * correct because something came in from outside the household.
   */
  fundingAssetId: string
}

/** Raw form values for correcting a held quantity. */
export type AssetQuantityAdjustmentForm = {
  /** The holding as it actually is. Raw decimal string. */
  quantity: string
  /** Why it changed — free text, kept on the event so history stays readable. */
  reason: string
}

export const defaultAssetPurchaseValues: AssetPurchaseForm = {
  quantity: '',
  unitPrice: '',
  fundingAssetId: '',
}

export const defaultAssetQuantityAdjustmentValues: AssetQuantityAdjustmentForm = {
  quantity: '',
  reason: '',
}

/** The position's current holding, or 0 for an asset that has none. */
export function heldQuantity(asset: Asset): number {
  return asset.marketPosition?.quantity ?? 0
}

export function buildAssetPurchaseSchema(t: Translate) {
  const required = (label: string) => t('validation.required', { label })
  return z.object({
    quantity: z
      .string()
      .min(1, required(t('assets.purchase.quantity')))
      .refine((raw) => parseRawDecimal(raw) > 0, {
        message: t('assets.purchase.quantityPositive'),
      }),
    unitPrice: z
      .string()
      .min(1, required(t('assets.purchase.unitPrice')))
      .refine((raw) => parseRawMoney(raw) >= 0, { message: t('validation.invalidMoney') }),
    // Optional on purpose — see `fundingAssetId` above.
    fundingAssetId: z.string(),
  })
}

export function buildAssetQuantityAdjustmentSchema(t: Translate, asset: Asset) {
  const required = (label: string) => t('validation.required', { label })
  const current = heldQuantity(asset)
  return z.object({
    quantity: z
      .string()
      .min(1, required(t('assets.quantityAdjustment.quantity')))
      .refine((raw) => parseRawDecimal(raw) >= 0, {
        message: t('assets.quantityAdjustment.quantityNonNegative'),
      })
      // A correction that corrects nothing would write a record saying the
      // holding went from x to x — noise in a history meant to explain changes.
      .refine((raw) => parseRawDecimal(raw) !== current, {
        message: t('assets.quantityAdjustment.unchanged'),
      }),
    reason: z.string(),
  })
}

export function toPurchasePayload(values: AssetPurchaseForm) {
  return {
    quantity: parseRawDecimal(values.quantity),
    purchasePrice: parseRawMoney(values.unitPrice),
    fundingAssetId: values.fundingAssetId || null,
  }
}

/**
 * What a purchase costs, and what the position looks like once it settles.
 *
 * The weighted average here is the SAME one the server computes on commit —
 * shown before the household agrees to it, because a purchase silently
 * re-averages the cost basis every future gain or loss is measured against.
 *
 * Returns `null` until both numbers are real: a total of "0 đ" while someone is
 * still typing states something false, and `null` is what the callers render
 * nothing for.
 *
 * `purchasePrice` is the cost basis, never `lastPrice` — the first is what was
 * paid, the second is what it is worth today, and averaging in today's price
 * would quietly erase the gain.
 */
export function buildPurchaseSummary({
  rawQuantity,
  rawUnitPrice,
  currentQuantity,
  heldCostBasis,
}: {
  rawQuantity: string
  rawUnitPrice: string
  currentQuantity: number
  /** The position's existing `purchasePrice`; 0 when it has none yet. */
  heldCostBasis: number
}): { total: number; nextQuantity: number; nextCostBasis: number } | null {
  const quantity = parseRawDecimal(rawQuantity)
  const unitPrice = parseRawMoney(rawUnitPrice)

  if (!Number.isFinite(quantity) || quantity <= 0) return null
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) return null

  const total = quantity * unitPrice
  const nextQuantity = currentQuantity + quantity

  return {
    total,
    nextQuantity,
    nextCostBasis: nextQuantity > 0 ? (currentQuantity * heldCostBasis + total) / nextQuantity : 0,
  }
}
