import { z } from 'zod'

import { computeCurrentValue, type Asset } from '@/features/assets/model/assets'
import type { EventPayload } from '@/features/events/api/events.repository'
import { parseRawDecimal, parseRawMoney } from '@/shared/lib/number-format'

type Translate = (key: string, params?: Record<string, unknown>) => string

/** Raw form values (all strings for money/decimal inputs). */
export type AssetSaleForm = {
  /** Quantity sold — market assets only. Raw decimal string ("5,5"). */
  quantity: string
  /** Gross proceeds in VND (before fee). Raw money string. */
  proceeds: string
  /** Sale fee in VND. Raw money string; empty → 0. */
  fee: string
  /** Receiving wallet asset id (a cash / bank_account asset). */
  toAssetId: string
  /** Sale date (YYYY-MM-DD). */
  date: string
  /** Optional note. */
  note: string
  /** Sell the whole position. */
  sellAll: boolean
}

const moneyLike = /^\d+$/

/**
 * A market asset is sold by quantity; it holds a `marketPosition`. Everything
 * else sellable (real_estate, investment, bond) is sold by VND value.
 */
export function isMarketSale(asset: Asset): boolean {
  return !!asset.marketPosition
}

/** Current held quantity for a market asset, or 0. */
export function currentQuantity(asset: Asset): number {
  return asset.marketPosition?.quantity ?? 0
}

export function buildAssetSaleSchema(t: Translate, asset: Asset) {
  const market = isMarketSale(asset)
  const heldQuantity = currentQuantity(asset)
  const required = (label: string) => t('validation.required', { label })
  const invalidMoney = t('validation.invalidMoney')

  return z
    .object({
      quantity: z.string().trim(),
      proceeds: z.string().trim(),
      fee: z.string().trim(),
      toAssetId: z.string().trim(),
      date: z.string().trim(),
      note: z.string().trim().max(200, t('validation.maxLengthGeneric', { max: 200 })),
      sellAll: z.boolean(),
    })
    .superRefine((values, ctx) => {
      // Quantity — market assets only, and only when not selling everything.
      if (market && !values.sellAll) {
        const quantity = parseRawDecimal(values.quantity)
        if (!values.quantity) {
          ctx.addIssue({
            path: ['quantity'],
            code: 'custom',
            message: required(t('assets.sale.quantity')),
          })
        } else if (!Number.isFinite(quantity) || quantity <= 0) {
          ctx.addIssue({ path: ['quantity'], code: 'custom', message: invalidMoney })
        } else if (quantity > heldQuantity) {
          ctx.addIssue({
            path: ['quantity'],
            code: 'custom',
            message: t('assets.sale.quantityExceeds', { max: heldQuantity }),
          })
        }
      }

      // Proceeds — required, > 0.
      const proceeds = parseRawMoney(values.proceeds)
      if (!values.proceeds) {
        ctx.addIssue({
          path: ['proceeds'],
          code: 'custom',
          message: required(t('assets.sale.proceeds')),
        })
      } else if (!moneyLike.test(values.proceeds) || proceeds <= 0) {
        ctx.addIssue({ path: ['proceeds'], code: 'custom', message: invalidMoney })
      }

      // Fee — optional (≥ 0), but never above the proceeds.
      if (values.fee) {
        const fee = parseRawMoney(values.fee)
        if (!moneyLike.test(values.fee) || fee < 0) {
          ctx.addIssue({ path: ['fee'], code: 'custom', message: invalidMoney })
        } else if (Number.isFinite(proceeds) && fee > proceeds) {
          ctx.addIssue({
            path: ['fee'],
            code: 'custom',
            message: t('assets.sale.feeExceeds'),
          })
        }
      }

      // Receiving wallet.
      if (!values.toAssetId) {
        ctx.addIssue({
          path: ['toAssetId'],
          code: 'custom',
          message: required(t('assets.sale.receiveInto')),
        })
      } else if (values.toAssetId === asset.id) {
        ctx.addIssue({
          path: ['toAssetId'],
          code: 'custom',
          message: t('assets.sale.receiveIntoSame'),
        })
      }

      if (!values.date) {
        ctx.addIssue({ path: ['date'], code: 'custom', message: t('validation.requiredDate') })
      }
    })
}

export const defaultAssetSaleValues: AssetSaleForm = {
  quantity: '',
  proceeds: '',
  fee: '',
  toAssetId: '',
  date: '',
  note: '',
  sellAll: false,
}

/** Net amount credited to the wallet: gross proceeds minus fee. */
export function computeNet(proceeds: string, fee: string): number {
  const gross = parseRawMoney(proceeds)
  const feeValue = fee ? parseRawMoney(fee) : 0
  const grossValue = Number.isFinite(gross) ? gross : 0
  const feeSafe = Number.isFinite(feeValue) ? feeValue : 0
  return Math.max(0, grossValue - feeSafe)
}

/**
 * Build the `asset_sale` money event payload from the sold asset and raw form
 * values. `asOf` is used to resolve a manual asset's full-sale value.
 */
export function toSalePayload(asset: Asset, values: AssetSaleForm, asOf: string): EventPayload {
  const market = isMarketSale(asset)
  const proceeds = parseRawMoney(values.proceeds)
  const fee = values.fee ? parseRawMoney(values.fee) : 0
  const amount = Number.isFinite(proceeds) ? proceeds : 0
  const feeAmount = Number.isFinite(fee) ? fee : 0

  const payload: EventPayload = {
    title: `Đã bán ${asset.name}`,
    amount,
    feeAmount,
    type: 'asset_sale',
    category: 'investment',
    isoDate: values.date,
    fromAssetId: asset.id,
    toAssetId: values.toAssetId,
    note: values.note.trim() || undefined,
  }

  if (market) {
    // Full sale → the current held quantity; partial → the entered amount.
    const quantity = values.sellAll ? currentQuantity(asset) : parseRawDecimal(values.quantity)
    payload.soldQuantity = Number.isFinite(quantity) ? quantity : 0
  } else {
    // Manual asset: sold VND value. Full sale → current value.
    const currentValue = computeCurrentValue(asset, asOf) ?? 0
    payload.soldValue = values.sellAll ? currentValue : amount
  }

  return payload
}
