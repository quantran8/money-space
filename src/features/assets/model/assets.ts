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
  InterestPayment,
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
// Sellable assets (see asset-sale)
// ---------------------------------------------------------------------------

/**
 * Asset types the user can sell ("Bán tài sản"). The first six are market
 * assets (they hold a `marketPosition`, so they're sold by quantity);
 * `real_estate` and `investment` are manual assets sold by VND value.
 */
export const SELLABLE_ASSET_TYPES: Set<AssetType> = new Set([
  'gold',
  'stock',
  'crypto',
  'fund',
  'foreign_currency',
  'bond',
  'real_estate',
  'investment',
])

/** Whether an asset of this type can be sold via the "Bán tài sản" flow. */
export function isSellableAssetType(type: AssetType): boolean {
  return SELLABLE_ASSET_TYPES.has(type)
}

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
  // Prefer the user-entered unit price; fall back to the market-data lookup.
  if (typeof position.unitPrice === 'number' && Number.isFinite(position.unitPrice)) {
    return position.quantity * position.unitPrice * fxToVnd(position.quoteCurrency)
  }
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
  if (typeof asset.currentValue === 'number') {
    return asset.currentValue
  }

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

// ---------------------------------------------------------------------------
// Saving-deposit withdrawal projections (display-only)
//
// Derived on demand from the calculation term; NOT persisted into the stored
// current value. `computeCurrentValue` stays the single source of truth for a
// saving asset's snapshot value.
// ---------------------------------------------------------------------------

export type SavingBreakdown = {
  principal: number
  /** Interest received (negative = clawed back from principal). */
  interest: number
  /** Amount the depositor takes home. */
  total: number
}

/** Term length of a saving deposit in years (derived from start→maturity). */
export function savingTermYears(term: CalculationTerm): number {
  if (!term.maturityDate) return 0
  return daysBetween(term.startDate, term.maturityDate) / 365
}

/** Term length in whole months (for the withdraw-month control). */
export function termMonthsOf(term: CalculationTerm): number {
  return Math.round(savingTermYears(term) * 12)
}

/** Payout when the deposit is held to maturity (rút đúng hạn). */
export function computeSavingOnTime(term: CalculationTerm): SavingBreakdown {
  const principal = term.principalAmount
  const rate = term.interestRate / 100
  const interest = principal * rate * savingTermYears(term)
  // end_of_term and monthly yield the same total interest at maturity; for
  // `monthly` it was already paid out over the term, then principal is returned.
  return { principal, interest, total: principal + interest }
}

/**
 * Payout when the deposit is withdrawn early at month `withdrawMonth`
 * (rút trước hạn). The contracted rate is void — the non-term rate applies to
 * the elapsed period. For a `monthly` payout the bank claws back interest it
 * already paid at the contracted rate.
 */
export function computeSavingEarly(
  term: CalculationTerm,
  withdrawMonth: number,
): SavingBreakdown {
  const principal = term.principalAmount
  const contractRate = term.interestRate / 100
  const nonTerm = term.nonTermRate / 100
  const n = withdrawMonth
  const actualInterest = principal * nonTerm * (n / 12)

  if (term.interestPayment === 'end_of_term') {
    return { principal, interest: actualInterest, total: principal + actualInterest }
  }

  // monthly: interest was paid at the contracted rate; claw back the excess.
  const interestAlreadyPaid = principal * contractRate * (n / 12)
  const clawback = interestAlreadyPaid - actualInterest
  return { principal, interest: -clawback, total: principal - clawback }
}

/** Total asset value of a snapshot point across all liquidity buckets. */
export function snapshotTotal(point: AssetSnapshotPoint): number {
  return point.usable_now + point.not_immediately_usable + point.long_term
}
