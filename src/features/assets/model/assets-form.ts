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
  // formula-calculated
  principal: string
  interestRate: string
  startDate: string
  maturityDate: string
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
  principal: '',
  interestRate: '',
  startDate: AS_OF,
  maturityDate: '',
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
    return {
      ...base,
      valuationMode: 'market_priced',
      marketPosition: {
        assetClass,
        symbol: values.symbol.trim(),
        quantity,
        unit: values.unit.trim() || 'unit',
        quoteCurrency: 'VND',
      },
    }
  }

  // formula_calculated
  const calculationType = calculationTypeForType(values.type)
  const principal = parseMoneyToVnd(values.principal)
  const rate = parseRawDecimal(values.interestRate)
  if (!calculationType || !Number.isFinite(principal) || !Number.isFinite(rate) || !values.startDate)
    return null
  return {
    ...base,
    valuationMode: 'formula_calculated',
    calculationTerm: {
      calculationType,
      principalAmount: principal,
      interestRate: rate,
      startDate: values.startDate,
      maturityDate: values.maturityDate || null,
    },
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
      principal: z.string().trim(),
      interestRate: z.string().trim(),
      startDate: z.string().trim(),
      maturityDate: z.string().trim(),
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
      }
    })
}

export function modeSuffix(mode: ValuationMode): 'Manual' | 'Market' | 'Formula' {
  if (mode === 'market_priced') return 'Market'
  if (mode === 'formula_calculated') return 'Formula'
  return 'Manual'
}
