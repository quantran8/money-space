import { z } from 'zod'

import {
  assetClassForType,
  assetTypeOrder,
  calculationTypeForType,
  valuationModeForType,
  type Asset,
  type AssetLiquidity,
  type AssetType,
  type ValuationMode,
} from '@/features/assets/model/assets'
import { parseRawDecimal, parseRawMoney } from '@/shared/lib/number-format'
import { localizedOptionalText, localizedRequiredText } from '@/shared/lib/validation'

export const AS_OF = '2026-07-06'

export type AssetTotals = {
  usable_now: number
  not_immediately_usable: number
  long_term: number
  totalAssets: number
}

export type AssetForm = {
  name: string
  type: AssetType
  liquidity: AssetLiquidity
  note: string
  // manual
  value: string
  // market-priced
  symbol: string
  quantity: string
  unit: string
  unitPrice: string
  // formula-calculated
  principal: string
  interestRate: string
  startDate: string
  maturityDate: string
  interestPayment: 'end_of_term' | 'monthly'
  nonTermRate: string
  interestDestination: 'wallet' | 'principal'
  receivingWalletId: string
}

export const defaultAssetFormValues: AssetForm = {
  name: '',
  type: 'cash',
  liquidity: 'usable_now',
  note: '',
  value: '',
  symbol: '',
  quantity: '',
  unit: '',
  unitPrice: '',
  principal: '',
  interestRate: '',
  startDate: AS_OF,
  maturityDate: '',
  interestPayment: 'end_of_term',
  nonTermRate: '',
  interestDestination: 'principal',
  receivingWalletId: '',
}

/** Parse a raw (separator-free) money string like "20000000" into VND. */
export function parseMoneyToVnd(raw: string): number {
  return parseRawMoney(raw)
}

/** Build an Asset from raw form values, or null if inputs are incomplete. */
export function toAsset(id: string, values: AssetForm): Asset | null {
  const mode = valuationModeForType(values.type)
  const base = {
    id,
    name: values.name.trim(),
    type: values.type,
    liquidity: values.liquidity,
    currency: 'VND',
    note: values.note.trim(),
  }

  if (mode === 'manual') {
    const value = parseMoneyToVnd(values.value)
    return { ...base, valuationMode: 'manual', manualValue: Number.isFinite(value) ? value : 0 }
  }

  if (mode === 'market_priced') {
    const assetClass = assetClassForType(values.type)
    const quantity = parseRawDecimal(values.quantity)
    if (!assetClass || !values.symbol.trim() || !Number.isFinite(quantity)) return null
    const unitPrice = parseMoneyToVnd(values.unitPrice)
    return {
      ...base,
      valuationMode: 'market_priced',
      marketPosition: {
        assetClass,
        symbol: values.symbol.trim(),
        quantity,
        unit: values.unit.trim() || 'unit',
        quoteCurrency: 'VND',
        unitPrice: Number.isFinite(unitPrice) ? unitPrice : undefined,
      },
    }
  }

  // formula_calculated
  const calculationType = calculationTypeForType(values.type)
  const principal = parseMoneyToVnd(values.principal)
  const rate = parseRawDecimal(values.interestRate)
  if (!calculationType || !Number.isFinite(principal) || !Number.isFinite(rate) || !values.startDate)
    return null
  const nonTermRate = parseRawDecimal(values.nonTermRate)
  // saving_deposit needs a non-term (early-withdrawal) rate; others default to 0.
  if (values.type === 'saving_deposit' && !Number.isFinite(nonTermRate)) return null
  return {
    ...base,
    valuationMode: 'formula_calculated',
    calculationTerm: {
      calculationType,
      principalAmount: principal,
      interestRate: rate,
      startDate: values.startDate,
      maturityDate: values.maturityDate || null,
      interestPayment: values.interestPayment,
      nonTermRate: Number.isFinite(nonTermRate) ? nonTermRate : 0,
      interestDestination: values.interestDestination,
      receivingWalletId:
        values.interestDestination === 'wallet' && values.receivingWalletId
          ? values.receivingWalletId
          : null,
    },
  }
}

/** Convert a stored VND/whole number into the raw digit string a money field holds. */
function moneyToRaw(value?: number): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return ''
  return String(Math.round(value))
}

/** Convert a stored number into the raw string a decimal field holds ("," decimals). */
function decimalToRaw(value?: number): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return ''
  return String(value).replace('.', ',')
}

/** Build editable form values from an existing asset (edit mode). */
export function fromAsset(asset: Asset): AssetForm {
  return {
    ...defaultAssetFormValues,
    name: asset.name,
    type: asset.type,
    liquidity: asset.liquidity,
    note: asset.note,
    value: moneyToRaw(asset.manualValue),
    symbol: asset.marketPosition?.symbol ?? '',
    quantity: decimalToRaw(asset.marketPosition?.quantity),
    unit: asset.marketPosition?.unit ?? '',
    unitPrice: moneyToRaw(asset.marketPosition?.unitPrice),
    principal: moneyToRaw(asset.calculationTerm?.principalAmount),
    interestRate: decimalToRaw(asset.calculationTerm?.interestRate),
    startDate: asset.calculationTerm?.startDate ?? AS_OF,
    maturityDate: asset.calculationTerm?.maturityDate ?? '',
    interestPayment: asset.calculationTerm?.interestPayment ?? 'end_of_term',
    nonTermRate: decimalToRaw(asset.calculationTerm?.nonTermRate),
    interestDestination: asset.calculationTerm?.interestDestination ?? 'principal',
    receivingWalletId: asset.calculationTerm?.receivingWalletId ?? '',
  }
}

const moneyLike = /^\d+$/

export function buildAssetSchema(t: (key: string, params?: Record<string, unknown>) => string) {
  return z
    .object({
      name: localizedRequiredText(t, t('assets.form.name')),
      type: z.enum(assetTypeOrder as [AssetType, ...AssetType[]]),
      liquidity: z.enum(['usable_now', 'not_immediately_usable', 'long_term']),
      note: localizedOptionalText(t, 120),
      value: z.string().trim(),
      symbol: z.string().trim(),
      quantity: z.string().trim(),
      unit: z.string().trim(),
      unitPrice: z.string().trim(),
      principal: z.string().trim(),
      interestRate: z.string().trim(),
      startDate: z.string().trim(),
      maturityDate: z.string().trim(),
      interestPayment: z.enum(['end_of_term', 'monthly']),
      nonTermRate: z.string().trim(),
      interestDestination: z.enum(['wallet', 'principal']),
      receivingWalletId: z.string().trim(),
    })
    .superRefine((values, ctx) => {
      const mode = valuationModeForType(values.type)
      const invalidMoney = t('validation.invalidMoney')
      const required = (label: string) => t('validation.required', { label })

      if (mode === 'manual') {
        if (!values.value) {
          ctx.addIssue({ path: ['value'], code: 'custom', message: required(t('assets.form.value')) })
        } else if (!moneyLike.test(values.value)) {
          ctx.addIssue({ path: ['value'], code: 'custom', message: invalidMoney })
        }
      }

      if (mode === 'market_priced') {
        if (!values.symbol) {
          ctx.addIssue({
            path: ['symbol'],
            code: 'custom',
            message: required(t('assets.form.symbol')),
          })
        }
        const quantity = parseRawDecimal(values.quantity)
        if (!values.quantity) {
          ctx.addIssue({
            path: ['quantity'],
            code: 'custom',
            message: required(t('assets.form.quantity')),
          })
        } else if (!Number.isFinite(quantity) || quantity < 0) {
          ctx.addIssue({ path: ['quantity'], code: 'custom', message: invalidMoney })
        }
        if (!values.unitPrice) {
          ctx.addIssue({
            path: ['unitPrice'],
            code: 'custom',
            message: required(t('assets.form.unitPrice')),
          })
        } else if (!moneyLike.test(values.unitPrice)) {
          ctx.addIssue({ path: ['unitPrice'], code: 'custom', message: invalidMoney })
        }
      }

      if (mode === 'formula_calculated') {
        if (!values.principal) {
          ctx.addIssue({
            path: ['principal'],
            code: 'custom',
            message: required(t('assets.form.principal')),
          })
        } else if (!moneyLike.test(values.principal)) {
          ctx.addIssue({ path: ['principal'], code: 'custom', message: invalidMoney })
        }
        const rate = parseRawDecimal(values.interestRate)
        if (!values.interestRate || !Number.isFinite(rate) || rate < 0) {
          ctx.addIssue({
            path: ['interestRate'],
            code: 'custom',
            message: required(t('assets.form.interestRate')),
          })
        }
        if (!values.startDate) {
          ctx.addIssue({ path: ['startDate'], code: 'custom', message: t('validation.requiredDate') })
        }
        // Non-term (early-withdrawal) rate is required for saving deposits.
        if (values.type === 'saving_deposit') {
          const nonTerm = parseRawDecimal(values.nonTermRate)
          if (!values.nonTermRate || !Number.isFinite(nonTerm) || nonTerm < 0) {
            ctx.addIssue({
              path: ['nonTermRate'],
              code: 'custom',
              message: required(t('assets.form.nonTermRate')),
            })
          } else if (Number.isFinite(rate) && nonTerm > rate) {
            ctx.addIssue({
              path: ['nonTermRate'],
              code: 'custom',
              message: t('assets.form.nonTermRateTooHigh'),
            })
          }
          // A wallet destination needs a receiving wallet.
          if (values.interestDestination === 'wallet' && !values.receivingWalletId) {
            ctx.addIssue({
              path: ['receivingWalletId'],
              code: 'custom',
              message: required(t('assets.form.receivingWallet')),
            })
          }
        }
      }
    })
}

export function modeSuffix(mode: ValuationMode): 'Manual' | 'Market' | 'Formula' {
  if (mode === 'market_priced') return 'Market'
  if (mode === 'formula_calculated') return 'Formula'
  return 'Manual'
}
