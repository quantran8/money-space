import { z } from 'zod'

import {
  assetClassForType,
  assetTypeForForm,
  assetTypeOrder,
  calculationTypeForType,
  liquidityForAsset,
  valuationModeForType,
  type Asset,
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
  /**
   * Only meaningful for `loan_receivable`: money lent to a friend usually earns
   * nothing, so interest is opt-in rather than a field that must be zeroed out.
   * Every other formula type always charges interest.
   */
  hasInterest: boolean
  startDate: string
  maturityDate: string
  interestPayment: 'end_of_term' | 'monthly'
  nonTermRate: string
  interestDestination: 'wallet' | 'principal'
  receivingWalletId: string
  /**
   * Whether this money counts towards tiền linh hoạt. Starts from the type's
   * default and is the user's to change: cash held for someone else is not
   * spendable, and gold they would genuinely sell this month is.
   */
  countsAsFlexible: boolean
  /** Who is responsible for the money — distinct from who entered the record. */
  holderMemberId: string
}

export const defaultAssetFormValues: AssetForm = {
  name: '',
  type: 'cash',
  note: '',
  value: '',
  areaSqm: '',
  symbol: '',
  quantity: '',
  unit: '',
  purchasePrice: '',
  principal: '',
  interestRate: '',
  hasInterest: false,
  startDate: AS_OF,
  maturityDate: '',
  interestPayment: 'end_of_term',
  nonTermRate: '',
  interestDestination: 'principal',
  receivingWalletId: '',
  // `cash` is the default type, and cash is spendable.
  countsAsFlexible: true,
  holderMemberId: '',
}

/** Parse a raw (separator-free) money string like "20000000" into VND. */
export function parseMoneyToVnd(raw: string): number {
  return parseRawMoney(raw)
}

/**
 * Cash and a bank account hold a balance the user reads off an app — a known
 * figure, not an estimate. Calling it "giá trị ước tính" invites them to guess
 * at a number they already know exactly.
 */
const balanceLabelTypes: ReadonlySet<AssetType> = new Set<AssetType>(['cash', 'bank_account'])

export function manualValueLabelKey(type: AssetType): string {
  return balanceLabelTypes.has(type) ? 'assets.form.balance' : 'assets.form.value'
}

/**
 * The units gold is actually held in here. A free-text field produced "chỉ",
 * "Chi", "chi vang" for one and the same unit, which makes a holding
 * incomparable with the next one.
 */
export const goldUnits = ['chỉ', 'lượng', 'gram'] as const

/** Loans (and only loans) can be interest-free — see `AssetForm.hasInterest`. */
export function isInterestOptional(type: AssetType): boolean {
  return type === 'loan_receivable'
}

/** Whether the interest fields apply at all, given the type and the toggle. */
export function chargesInterest(values: Pick<AssetForm, 'type' | 'hasInterest'>): boolean {
  return !isInterestOptional(values.type) || values.hasInterest
}

/** A share is indivisible — quantities for stock are whole numbers only. */
export function isWholeQuantityType(type: AssetType): boolean {
  return type === 'stock'
}

/**
 * The display name for a market-priced holding.
 *
 * A market holding's identifier is also its display name. Asking for another
 * name creates a hidden distinction with no product value, so market assets
 * always derive it from the symbol/kind entered by the user.
 */
export function resolveAssetName(values: AssetForm): string {
  if (valuationModeForType(values.type) === 'market_priced') return values.symbol.trim().toUpperCase()
  return values.name.trim()
}

function resolveMarketUnit(values: AssetForm): string {
  const symbol = values.symbol.trim().toUpperCase()
  if (values.type === 'stock') return 'cổ'
  if (values.type === 'crypto' || values.type === 'foreign_currency') return symbol
  return values.unit.trim()
}

/** Build an Asset from raw form values, or null if inputs are incomplete. */
export function toAsset(id: string, values: AssetForm): Asset | null {
  const mode = valuationModeForType(values.type)
  const base = {
    id,
    name: resolveAssetName(values),
    type: values.type,
    countsAsFlexible: values.countsAsFlexible,
    // Derived here too so the optimistic local asset lands in the same bucket
    // the server will store it in.
    liquidity: liquidityForAsset(values.type, values.countsAsFlexible),
    currency: 'VND',
    note: values.note.trim(),
    holderMemberId: values.holderMemberId || null,
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
        symbol: values.symbol.trim().toUpperCase(),
        quantity,
        unit: resolveMarketUnit(values),
        quoteCurrency: 'VND',
        purchasePrice: Number.isFinite(purchasePrice) ? purchasePrice : undefined,
      },
    }
  }

  // formula_calculated
  const calculationType = calculationTypeForType(values.type)
  const principal = parseMoneyToVnd(values.principal)
  // An interest-free loan is 0%, not a missing rate.
  const earnsInterest = chargesInterest(values)
  const rate = earnsInterest ? parseRawDecimal(values.interestRate) : 0
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
      interestPayment: earnsInterest ? values.interestPayment : 'end_of_term',
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
  // Market names are always derived from their identifier, so no hidden custom
  // name is round-tripped through the form.
  const isMarketPriced = asset.valuationMode === 'market_priced'

  return {
    ...defaultAssetFormValues,
    name: isMarketPriced ? '' : asset.name,
    type: assetTypeForForm(asset.type),
    note: asset.note,
    value: moneyToRaw(asset.manualValue),
    areaSqm: decimalToRaw(asset.areaSqm),
    symbol: asset.marketPosition?.symbol ?? '',
    quantity: decimalToRaw(asset.marketPosition?.quantity),
    unit: asset.marketPosition?.unit ?? '',
    purchasePrice: moneyToRaw(asset.marketPosition?.purchasePrice),
    principal: moneyToRaw(asset.calculationTerm?.principalAmount),
    interestRate: decimalToRaw(asset.calculationTerm?.interestRate),
    // A stored 0% loan reopens with the interest toggle off, the way it was saved.
    hasInterest: (asset.calculationTerm?.interestRate ?? 0) > 0,
    startDate: asset.calculationTerm?.startDate ?? AS_OF,
    maturityDate: asset.calculationTerm?.maturityDate ?? '',
    interestPayment: asset.calculationTerm?.interestPayment ?? 'end_of_term',
    nonTermRate: decimalToRaw(asset.calculationTerm?.nonTermRate),
    interestDestination: asset.calculationTerm?.interestDestination ?? 'principal',
    receivingWalletId: asset.calculationTerm?.receivingWalletId ?? '',
    // Read the bucket, not the override flag: `liquidity` already folds in both
    // the type default and any decision the household made.
    countsAsFlexible: asset.liquidity === 'usable_now',
    holderMemberId: asset.holderMemberId ?? '',
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
      note: localizedOptionalText(t, 120),
      value: z.string().trim(),
      areaSqm: z.string().trim(),
      symbol: z.string().trim(),
      quantity: z.string().trim(),
      unit: z.string().trim(),
      purchasePrice: z.string().trim(),
      principal: z.string().trim(),
      interestRate: z.string().trim(),
      hasInterest: z.boolean(),
      startDate: z.string().trim(),
      maturityDate: z.string().trim(),
      interestPayment: z.enum(['end_of_term', 'monthly']),
      nonTermRate: z.string().trim(),
      interestDestination: z.enum(['wallet', 'principal']),
      receivingWalletId: z.string().trim(),
      countsAsFlexible: z.boolean(),
      holderMemberId: z.string().trim(),
    })
    .superRefine((values, ctx) => {
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
          ctx.addIssue({
            path: ['value'],
            code: 'custom',
            message: required(t(manualValueLabelKey(values.type))),
          })
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
            message: required(t(`assets.form.market.${values.type}.symbol`)),
          })
        }
        const quantity = parseRawDecimal(values.quantity)
        if (!values.quantity) {
          ctx.addIssue({
            path: ['quantity'],
            code: 'custom',
            message: required(t(`assets.form.market.${values.type}.quantity`)),
          })
        } else if (!Number.isFinite(quantity) || quantity < 0) {
          ctx.addIssue({ path: ['quantity'], code: 'custom', message: invalidMoney })
        } else if (isWholeQuantityType(values.type) && !Number.isInteger(quantity)) {
          ctx.addIssue({
            path: ['quantity'],
            code: 'custom',
            message: t(`assets.form.market.${values.type}.quantityInteger`),
          })
        }
        if (!values.purchasePrice) {
          ctx.addIssue({
            path: ['purchasePrice'],
            code: 'custom',
            message: required(t(`assets.form.market.${values.type}.purchasePrice`)),
          })
        } else if (!moneyLike.test(values.purchasePrice)) {
          ctx.addIssue({ path: ['purchasePrice'], code: 'custom', message: invalidMoney })
        }
        if (values.type === 'gold' && !values.unit) {
          ctx.addIssue({
            path: ['unit'],
            code: 'custom',
            message: required(t('assets.form.market.gold.unit')),
          })
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
        // An interest-free loan has no rate to enter, so nothing to require.
        const earnsInterest = chargesInterest(values)
        const rate = earnsInterest ? parseRawDecimal(values.interestRate) : 0
        if (earnsInterest && (!values.interestRate || !Number.isFinite(rate) || rate < 0)) {
          ctx.addIssue({
            path: ['interestRate'],
            code: 'custom',
            message: required(t('assets.form.interestRate')),
          })
        }
        if (!values.startDate) {
          ctx.addIssue({ path: ['startDate'], code: 'custom', message: t('validation.requiredDate') })
        }
        // A due date is often not agreed up front when the money is lent to
        // family, so it stays optional — only its order is checked when given.
        if (
          values.type === 'loan_receivable' &&
          values.maturityDate &&
          values.startDate &&
          values.maturityDate < values.startDate
        ) {
          ctx.addIssue({
            path: ['maturityDate'],
            code: 'custom',
            message: t('assets.form.maturityBeforeStart'),
          })
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
