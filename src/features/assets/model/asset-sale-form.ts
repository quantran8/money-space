import { z } from 'zod'

import { computeCurrentValue, type Asset } from '@/features/assets/model/assets'
import type { EventPayload } from '@/features/events/api/events.repository'
import type { MoneyEventItem } from '@/features/events/model/events.types'
import { parseRawDecimal, parseRawMoney } from '@/shared/lib/number-format'

type Translate = (key: string, params?: Record<string, unknown>) => string

/** Raw form values (all strings for money/decimal inputs). */
export type AssetSaleForm = {
  /** Quantity sold — market assets only. Raw decimal string ("5,5"). */
  quantity: string
  /** Agreed sale price for one unit (or one m²), in VND. */
  unitPrice: string
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
  return !!asset.marketPosition || asset.type === 'real_estate' || asset.type === 'bond'
}

/** Current held quantity for a market asset, or 0. */
export function currentQuantity(asset: Asset): number {
  return asset.marketPosition?.quantity ?? asset.areaSqm ?? 0
}

/**
 * The quantity a sale form may sell up to. On CREATE it is the asset's current
 * holding; on EDIT of an existing sale the backend first reverses that sale
 * (adds `soldQuantity` back), so the editable max is `current + this sale's
 * soldQuantity` — the pre-sale holding.
 */
export function effectiveHeldQuantity(asset: Asset, editingEvent?: MoneyEventItem): number {
  return currentQuantity(asset) + (editingEvent?.soldQuantity ?? 0)
}

export function buildAssetSaleSchema(t: Translate, asset: Asset, editingEvent?: MoneyEventItem) {
  const market = isMarketSale(asset)
  const heldQuantity = effectiveHeldQuantity(asset, editingEvent)
  const required = (label: string) => t('validation.required', { label })
  const invalidMoney = t('validation.invalidMoney')

  return z
    .object({
      quantity: z.string().trim(),
      unitPrice: z.string().trim(),
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
        } else if (heldQuantity > 0 && quantity > heldQuantity) {
          ctx.addIssue({
            path: ['quantity'],
            code: 'custom',
            message: t('assets.sale.quantityExceeds', { max: heldQuantity }),
          })
        }
      }
      if (market) {
        if (!values.unitPrice) {
          ctx.addIssue({
            path: ['unitPrice'],
            code: 'custom',
            message: required(t('assets.sale.unitPrice')),
          })
        } else if (!moneyLike.test(values.unitPrice) || parseRawMoney(values.unitPrice) <= 0) {
          ctx.addIssue({ path: ['unitPrice'], code: 'custom', message: invalidMoney })
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
  unitPrice: '',
  proceeds: '',
  fee: '',
  toAssetId: '',
  date: '',
  note: '',
  sellAll: false,
}

/**
 * Prefill the sale form from an existing `asset_sale` money event, for editing.
 * `sellAll` is derived: a market sale that sold the whole pre-sale holding, or a
 * manual sale that emptied the asset. Money/decimal fields become raw strings.
 */
export function toSaleEditValues(
  asset: Asset,
  event: MoneyEventItem,
): AssetSaleForm {
  const market = isMarketSale(asset)
  const soldQuantity = event.soldQuantity ?? 0
  const preSaleQuantity = effectiveHeldQuantity(asset, event)
  const soldAll = market
    ? preSaleQuantity > 0 && soldQuantity >= preSaleQuantity
    : currentQuantity(asset) === 0 && !!event.soldValue
  return {
    quantity: market && !soldAll && soldQuantity ? String(soldQuantity) : '',
    unitPrice:
      market && soldQuantity && event.amount
        ? String(Math.round(Math.abs(event.amount) / soldQuantity))
        : '',
    proceeds: event.amount ? String(Math.round(Math.abs(event.amount))) : '',
    fee: event.feeAmount ? String(Math.round(event.feeAmount)) : '',
    toAssetId: event.toAssetId ?? '',
    date: event.isoDate,
    note: event.note ?? '',
    sellAll: soldAll,
  }
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
 * values. `asOf` resolves a manual asset's full-sale value. `editingEvent` is
 * passed when editing an existing sale: `sellAll` then resolves against the
 * PRE-sale holding (current + the sale's own soldQuantity/value), since the
 * backend reverses this sale before re-applying the edited one.
 */
export function toSalePayload(
  asset: Asset,
  values: AssetSaleForm,
  asOf: string,
  editingEvent?: MoneyEventItem,
): EventPayload {
  const market = isMarketSale(asset)
  const proceeds = parseRawMoney(values.proceeds)
  const fee = values.fee ? parseRawMoney(values.fee) : 0
  const amount = Number.isFinite(proceeds) ? proceeds : 0
  const feeAmount = Number.isFinite(fee) ? fee : 0

  const payload: EventPayload = {
    amount,
    feeAmount,
    type: 'asset_sale',
    category: 'investment',
    isoDate: values.date,
    fromAssetId: asset.id,
    toAssetId: values.toAssetId,
    // `title` was dropped; the sale label now lives in the note (keep the user's
    // note if they wrote one, else the default "Đã bán …").
    note: values.note.trim() || editingEvent?.note || `Đã bán ${asset.name}`,
  }

  if (market) {
    // Full sale → the pre-sale held quantity; partial → the entered amount.
    const quantity = values.sellAll
      ? effectiveHeldQuantity(asset, editingEvent)
      : parseRawDecimal(values.quantity)
    payload.soldQuantity = Number.isFinite(quantity) ? quantity : 0
  }

  if (!asset.marketPosition) {
    // Manual asset: sold VND value. Full sale → pre-sale value (current value
    // plus what this sale had already taken out, when editing).
    const currentValue = computeCurrentValue(asset, asOf) ?? 0
    const preSaleValue = currentValue + (editingEvent?.soldValue ?? 0)
    if (asset.type === 'real_estate') {
      const preSaleArea = effectiveHeldQuantity(asset, editingEvent)
      const soldArea = payload.soldQuantity ?? 0
      payload.soldValue = values.sellAll
        ? preSaleValue
        : preSaleArea > 0
          ? (preSaleValue * soldArea) / preSaleArea
          : 0
    } else {
      payload.soldValue = values.sellAll ? preSaleValue : amount
    }
  }

  return payload
}
