/**
 * Asset domain logic for the Money Space MVP.
 *
 * Type ⇒ valuation-mode / liquidity lookup tables and the current-value
 * computation. Types live in `assets.types.ts`; mock prices and seed data
 * live in `../api/assets.repository.ts`.
 */

import { fxToVnd, latestPrice } from '@/features/assets/api/assets.repository'
import type {
  AssetClass,
  AssetLiquidity,
  AssetType,
  Asset,
  CalculationTerm,
  CalculationType,
  MarketPosition,
  AssetSnapshotPoint,
  ValuationMode,
} from '@/features/assets/model/assets.types'

export type {
  AssetClass,
  AssetLiquidity,
  AssetType,
  Asset,
  CalculationTerm,
  CalculationType,
  MarketPosition,
  MarketQuote,
  AssetSnapshotPoint,
  ValuationMode,
} from '@/features/assets/model/assets.types'

// ---------------------------------------------------------------------------
// Type ⇒ valuation mode / liquidity metadata (§23, §34)
// ---------------------------------------------------------------------------

export const assetTypeOrder: AssetType[] = [
  'cash',
  'bank_account',
  'saving_deposit',
  'certificate_of_deposit',
  'bond',
  'loan_receivable',
  'gold',
  'stock',
  'fund',
  'crypto',
  'foreign_currency',
  'real_estate',
  'insurance',
  'investment',
  'other',
]

const valuationModeByType: Record<AssetType, ValuationMode> = {
  cash: 'manual',
  bank_account: 'manual',
  saving_deposit: 'formula_calculated',
  certificate_of_deposit: 'formula_calculated',
  bond: 'formula_calculated',
  loan_receivable: 'formula_calculated',
  gold: 'market_priced',
  stock: 'market_priced',
  fund: 'market_priced',
  crypto: 'market_priced',
  foreign_currency: 'market_priced',
  real_estate: 'manual',
  insurance: 'manual',
  investment: 'manual',
  other: 'manual',
}

/** Default liquidity bucket the app suggests for a given asset type. */
const defaultLiquidityByType: Record<AssetType, AssetLiquidity> = {
  cash: 'usable_now',
  bank_account: 'usable_now',
  saving_deposit: 'not_immediately_usable',
  certificate_of_deposit: 'not_immediately_usable',
  bond: 'not_immediately_usable',
  loan_receivable: 'not_immediately_usable',
  gold: 'long_term',
  stock: 'long_term',
  fund: 'long_term',
  crypto: 'long_term',
  foreign_currency: 'not_immediately_usable',
  real_estate: 'long_term',
  insurance: 'long_term',
  investment: 'long_term',
  other: 'not_immediately_usable',
}

/** The default asset class used to pre-fill a market position for a type. */
const assetClassByType: Partial<Record<AssetType, AssetClass>> = {
  gold: 'gold',
  stock: 'stock',
  fund: 'fund',
  crypto: 'crypto',
  foreign_currency: 'foreign_currency',
}

/** The calculation type used to pre-fill formula terms for a type. */
const calculationTypeByType: Partial<Record<AssetType, CalculationType>> = {
  saving_deposit: 'saving_deposit',
  certificate_of_deposit: 'certificate_of_deposit',
  bond: 'bond',
  loan_receivable: 'loan_receivable',
}

export function valuationModeForType(type: AssetType): ValuationMode {
  return valuationModeByType[type]
}

export function defaultLiquidityForType(type: AssetType): AssetLiquidity {
  return defaultLiquidityByType[type]
}

export function assetClassForType(type: AssetType): AssetClass | undefined {
  return assetClassByType[type]
}

export function calculationTypeForType(type: AssetType): CalculationType | undefined {
  return calculationTypeByType[type]
}

export const liquidityOrder: AssetLiquidity[] = [
  'usable_now',
  'not_immediately_usable',
  'long_term',
]

// ---------------------------------------------------------------------------
// Current-value computation (§24, §25)
// ---------------------------------------------------------------------------

function daysBetween(from: string, to: string): number {
  const start = new Date(from).getTime()
  const end = new Date(to).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return 0
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)))
}

function computeMarketValue(position: MarketPosition): number | null {
  const quote = latestPrice(position.assetClass, position.symbol)
  if (!quote) return null
  const valueInQuote = position.quantity * quote.price
  return valueInQuote * fxToVnd(quote.quoteCurrency)
}

/**
 * Simple accrued-interest model for formula assets (§25).
 * current_value = principal + principal × rate × elapsedYears (capped at maturity).
 */
function computeFormulaValue(term: CalculationTerm, asOf: string): number {
  const rate = term.interestRate / 100
  const effectiveEnd =
    term.maturityDate && new Date(term.maturityDate) < new Date(asOf)
      ? term.maturityDate
      : asOf
  const elapsedDays = daysBetween(term.startDate, effectiveEnd)
  const elapsedYears = elapsedDays / 365
  const accrued = term.principalAmount * rate * elapsedYears
  return term.principalAmount + accrued
}

/**
 * The current value of an asset in the household currency (VND), or `null`
 * when a market-priced asset has no known price for its symbol.
 */
export function computeCurrentValue(asset: Asset, asOf: string): number | null {
  switch (asset.valuationMode) {
    case 'manual':
      return asset.manualValue ?? 0
    case 'market_priced':
      return asset.marketPosition ? computeMarketValue(asset.marketPosition) : 0
    case 'formula_calculated':
      return asset.calculationTerm
        ? computeFormulaValue(asset.calculationTerm, asOf)
        : 0
    default:
      return 0
  }
}

/** Expected value at maturity for a formula asset, for display (§15). */
export function computeMaturityValue(term: CalculationTerm): number | null {
  if (!term.maturityDate) return null
  const rate = term.interestRate / 100
  const years = daysBetween(term.startDate, term.maturityDate) / 365
  return term.principalAmount + term.principalAmount * rate * years
}

/** Total asset value of a snapshot point across all liquidity buckets. */
export function snapshotTotal(point: AssetSnapshotPoint): number {
  return point.usable_now + point.not_immediately_usable + point.long_term
}
