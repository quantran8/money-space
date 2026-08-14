import {
  DEFAULT_FINANCIAL_NATURE,
  DEFAULT_VISIBILITY_LEVEL,
  type FinancialNature,
  type VisibilityLevel,
} from '@/features/assets/model/asset-classification'
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
import { localizedOptionalText } from '@/shared/lib/validation'

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
  areaSqm: string
  // market-priced
  symbol: string
  quantity: string
  unit: string
  purchasePrice: string
  // formula-calculated
  principal: string
  interestRate: string
  startDate: string
  maturityDate: string
  interestPayment: 'end_of_term' | 'monthly'
  nonTermRate: string
  interestDestination: 'wallet' | 'principal'
  receivingWalletId: string
  // --- classification (§11, §30) — Phase 11 -------------------------------
  /** Whose money this fundamentally IS. */
  financialNature: FinancialNature
  /** How much of it other members SEE. Independent of `financialNature`. */
  visibilityLevel: VisibilityLevel
  /** Who holds it — distinct from who entered it and who owns its privacy. */
  holderMemberId: string
  /** Required when `visibilityLevel` is `private` (§30). */
  privacyOwnerMemberId: string
}

export const defaultAssetFormValues: AssetForm = {
  name: '',
  type: 'cash',
  liquidity: 'usable_now',
  note: '',
  value: '',
  areaSqm: '',
  symbol: '',
  quantity: '',
  unit: '',
  purchasePrice: '',
  principal: '',
  interestRate: '',
  startDate: AS_OF,
  maturityDate: '',
  interestPayment: 'end_of_term',
  nonTermRate: '',
  interestDestination: 'principal',
  receivingWalletId: '',
  financialNature: DEFAULT_FINANCIAL_NATURE,
  visibilityLevel: DEFAULT_VISIBILITY_LEVEL,
  holderMemberId: '',
  privacyOwnerMemberId: '',
}

/** Parse a raw (separator-free) money string like "20000000" into VND. */
export function parseMoneyToVnd(raw: string): number {
  return parseRawMoney(raw)
}

/**
 * The display name for a market-priced holding.
 *
 * For stock / crypto / gold the symbol IS the name — asking for both makes the
 * user type "FPT" twice. `name` stays the display identity everywhere (list
 * rows, detail title, sale dialog), so it is derived here rather than dropped,
 * and the form hides the field for these types (§22.1: never ask for what the
 * app can derive). A name the user typed explicitly still wins.
 */
export function resolveAssetName(values: AssetForm): string {
  const typed = values.name.trim()
  if (typed) return typed
  if (valuationModeForType(values.type) === 'market_priced') return values.symbol.trim().toUpperCase()
  return typed
}

/** Build an Asset from raw form values, or null if inputs are incomplete. */
export function toAsset(id: string, values: AssetForm): Asset | null {
  const mode = valuationModeForType(values.type)
  const base = {
    id,
    name: resolveAssetName(values),
    type: values.type,
    liquidity: values.liquidity,
    currency: 'VND',
    note: values.note.trim(),
    financialNature: values.financialNature,
    visibilityLevel: values.visibilityLevel,
    holderMemberId: values.holderMemberId || null,
    privacyOwnerMemberId: values.privacyOwnerMemberId || null,
  }

  if (mode === 'manual') {
    const value = parseMoneyToVnd(values.value)
    const areaSqm = parseRawDecimal(values.areaSqm)
    return {
      ...base,
      valuationMode: 'manual',
      manualValue: Number.isFinite(value) ? value : 0,
      areaSqm:
        values.type === 'real_estate' && Number.isFinite(areaSqm) ? areaSqm : undefined,
    }
  }

  if (mode === 'market_priced') {
    const assetClass = assetClassForType(values.type)
    const quantity = parseRawDecimal(values.quantity)
    if (!assetClass || !values.symbol.trim() || !Number.isFinite(quantity)) return null
    const purchasePrice = parseMoneyToVnd(values.purchasePrice)
    return {
      ...base,
      valuationMode: 'market_priced',
      marketPosition: {
        assetClass,
        symbol: values.symbol.trim(),
        quantity,
        unit: values.unit.trim() || 'unit',
        quoteCurrency: 'VND',
        purchasePrice: Number.isFinite(purchasePrice) ? purchasePrice : undefined,
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
  // A stored name equal to the symbol was DERIVED, not typed (see
  // `resolveAssetName`). Round-tripping it into the optional custom-name field
  // would turn a derived name into an explicit one on the next save, so it
  // comes back empty and stays derived.
  const symbol = asset.marketPosition?.symbol ?? ''
  const isDerivedName =
    Boolean(symbol) && asset.name.trim().toUpperCase() === symbol.trim().toUpperCase()

  return {
    ...defaultAssetFormValues,
    name: isDerivedName ? '' : asset.name,
    type: asset.type,
    liquidity: asset.liquidity,
    note: asset.note,
    value: moneyToRaw(asset.manualValue),
    areaSqm: decimalToRaw(asset.areaSqm),
    symbol: asset.marketPosition?.symbol ?? '',
    quantity: decimalToRaw(asset.marketPosition?.quantity),
    unit: asset.marketPosition?.unit ?? '',
    purchasePrice: moneyToRaw(asset.marketPosition?.purchasePrice),
    principal: moneyToRaw(asset.calculationTerm?.principalAmount),
    interestRate: decimalToRaw(asset.calculationTerm?.interestRate),
    startDate: asset.calculationTerm?.startDate ?? AS_OF,
    maturityDate: asset.calculationTerm?.maturityDate ?? '',
    interestPayment: asset.calculationTerm?.interestPayment ?? 'end_of_term',
    nonTermRate: decimalToRaw(asset.calculationTerm?.nonTermRate),
    interestDestination: asset.calculationTerm?.interestDestination ?? 'principal',
    receivingWalletId: asset.calculationTerm?.receivingWalletId ?? '',
    financialNature: asset.financialNature ?? DEFAULT_FINANCIAL_NATURE,
    visibilityLevel: asset.visibilityLevel ?? DEFAULT_VISIBILITY_LEVEL,
    holderMemberId: asset.holderMemberId ?? '',
    privacyOwnerMemberId: asset.privacyOwnerMemberId ?? '',
  }
}

const moneyLike = /^\d+$/

export function buildAssetSchema(t: (key: string, params?: Record<string, unknown>) => string) {
  return z
    .object({
      // Required only where the app cannot derive it — a market-priced holding
      // takes its name from the symbol (see `resolveAssetName`). Enforced in
      // `.superRefine` below rather than here, since it depends on `type`.
      name: localizedOptionalText(t, 120),
      type: z.enum(assetTypeOrder as [AssetType, ...AssetType[]]),
      liquidity: z.enum(['usable_now', 'not_immediately_usable', 'long_term']),
      note: localizedOptionalText(t, 120),
      value: z.string().trim(),
      areaSqm: z.string().trim(),
      symbol: z.string().trim(),
      quantity: z.string().trim(),
      unit: z.string().trim(),
      purchasePrice: z.string().trim(),
      principal: z.string().trim(),
      interestRate: z.string().trim(),
      startDate: z.string().trim(),
      maturityDate: z.string().trim(),
      interestPayment: z.enum(['end_of_term', 'monthly']),
      nonTermRate: z.string().trim(),
      interestDestination: z.enum(['wallet', 'principal']),
      receivingWalletId: z.string().trim(),
      // Classification (§11, §30). All FOUR visibility levels are accepted:
      // the MVP picker offers three, but a record already stored as `grouped`
      // must still validate when edited.
      financialNature: z.enum([
        'household',
        'personal_included',
        'managed_for_household',
        'personal_private',
      ]),
      visibilityLevel: z.enum(['summary_only', 'grouped', 'detail', 'private']),
      holderMemberId: z.string().trim(),
      privacyOwnerMemberId: z.string().trim(),
    })
    .superRefine((values, ctx) => {
      // A `private` record must name whose privacy it is — `created_by` is not
      // a valid substitute (§30).
      if (values.visibilityLevel === 'private' && !values.privacyOwnerMemberId) {
        ctx.addIssue({
          path: ['privacyOwnerMemberId'],
          code: 'custom',
          message: t('validation.required', { label: t('assets.form.privacyOwner') }),
        })
      }

      const mode = valuationModeForType(values.type)
      const invalidMoney = t('validation.invalidMoney')
      const required = (label: string) => t('validation.required', { label })

      // Market-priced holdings derive their name from the symbol, so the field
      // is hidden and empty is valid. Everything else must be named.
      if (mode !== 'market_priced' && !values.name.trim()) {
        ctx.addIssue({
          path: ['name'],
          code: 'custom',
          message: required(t('assets.form.name')),
        })
      }

      if (mode === 'manual') {
        if (!values.value) {
          ctx.addIssue({ path: ['value'], code: 'custom', message: required(t('assets.form.value')) })
        } else if (!moneyLike.test(values.value)) {
          ctx.addIssue({ path: ['value'], code: 'custom', message: invalidMoney })
        }
        if (values.type === 'real_estate') {
          const areaSqm = parseRawDecimal(values.areaSqm)
          if (!values.areaSqm) {
            ctx.addIssue({
              path: ['areaSqm'],
              code: 'custom',
              message: required(t('assets.form.areaSqm')),
            })
          } else if (!Number.isFinite(areaSqm) || areaSqm <= 0) {
            ctx.addIssue({ path: ['areaSqm'], code: 'custom', message: invalidMoney })
          }
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
        if (!values.purchasePrice) {
          ctx.addIssue({
            path: ['purchasePrice'],
            code: 'custom',
            message: required(t('assets.form.purchasePrice')),
          })
        } else if (!moneyLike.test(values.purchasePrice)) {
          ctx.addIssue({ path: ['purchasePrice'], code: 'custom', message: invalidMoney })
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
