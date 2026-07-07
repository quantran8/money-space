/**
 * Asset domain types for the Money Space MVP.
 *
 * Mirrors the backend spec (see "Backend Tables & Relationships"):
 * every asset has a `type`, an auto-derived `valuation_mode`, and a
 * `liquidity` bucket. Depending on the valuation mode the app knows the
 * current value differently:
 *
 *   - manual              → user enters an estimated value
 *   - market_priced       → app derives value from quantity × market price
 *   - formula_calculated  → app derives value from principal + interest terms
 */

export type AssetType =
  | 'cash'
  | 'bank_account'
  | 'saving_deposit'
  | 'bond'
  | 'gold'
  | 'stock'
  | 'fund'
  | 'crypto'
  | 'foreign_currency'
  | 'real_estate'
  | 'insurance'
  | 'loan_receivable'
  | 'certificate_of_deposit'
  | 'investment'
  | 'other'

export type ValuationMode = 'manual' | 'market_priced' | 'formula_calculated'

export type AssetLiquidity = 'usable_now' | 'not_immediately_usable' | 'long_term'

export type AssetClass = 'gold' | 'crypto' | 'stock' | 'fund' | 'foreign_currency'

export type CalculationType =
  | 'saving_deposit'
  | 'bond'
  | 'loan_receivable'
  | 'certificate_of_deposit'

/** Inputs the user gives for a market-priced asset (§12, §24). */
export type MarketPosition = {
  assetClass: AssetClass
  symbol: string
  quantity: number
  unit: string
  quoteCurrency: string
}

/** Inputs the user gives for a formula-calculated asset (§15, §25). */
export type CalculationTerm = {
  calculationType: CalculationType
  principalAmount: number
  /** Annual interest / coupon rate as a percentage, e.g. 5 means 5%/year. */
  interestRate: number
  startDate: string
  maturityDate: string | null
}

export type Asset = {
  id: string
  name: string
  type: AssetType
  valuationMode: ValuationMode
  liquidity: AssetLiquidity
  currency: string
  note: string
  /** Present for manual assets — the user-entered estimated value (VND). */
  manualValue?: number
  /** Present for market-priced assets. */
  marketPosition?: MarketPosition
  /** Present for formula-calculated assets. */
  calculationTerm?: CalculationTerm
}

/** Price of one `unit` expressed in `quoteCurrency`. */
export type MarketQuote = {
  price: number
  unit: string
  quoteCurrency: string
}

export type AssetSnapshotPoint = {
  /** ISO date of the snapshot. */
  date: string
  usable_now: number
  not_immediately_usable: number
  long_term: number
}
