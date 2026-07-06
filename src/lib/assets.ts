/**
 * Asset domain model for the Money Space MVP.
 *
 * Mirrors the backend spec (see "Backend Tables & Relationships"):
 * every asset has a `type`, an auto-derived `valuation_mode`, and a
 * `liquidity` bucket. Depending on the valuation mode the app knows the
 * current value differently:
 *
 *   - manual              → user enters an estimated value
 *   - market_priced       → app derives value from quantity × market price
 *   - formula_calculated  → app derives value from principal + interest terms
 *
 * The frontend computes these locally against mock prices / simple-interest
 * formulas so the flow can be exercised without a live pricing API.
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
// Mock market data (stands in for market_prices / fx_rates cache, §13, §14)
// ---------------------------------------------------------------------------

type MarketQuote = {
  /** Price of one `unit` expressed in `quoteCurrency`. */
  price: number
  unit: string
  quoteCurrency: string
}

/** Latest prices keyed by asset class + symbol (uppercased). */
const mockPrices: Record<string, MarketQuote> = {
  'gold:SJC': { price: 7_400_000, unit: 'chi', quoteCurrency: 'VND' },
  'gold:9999': { price: 7_250_000, unit: 'chi', quoteCurrency: 'VND' },
  'crypto:BTC': { price: 62_000, unit: 'BTC', quoteCurrency: 'USD' },
  'crypto:ETH': { price: 3_100, unit: 'ETH', quoteCurrency: 'USD' },
  'stock:FPT': { price: 132_000, unit: 'shares', quoteCurrency: 'VND' },
  'stock:VNM': { price: 68_000, unit: 'shares', quoteCurrency: 'VND' },
  'fund:VESAF': { price: 28_500, unit: 'units', quoteCurrency: 'VND' },
  'foreign_currency:USD': { price: 1, unit: 'USD', quoteCurrency: 'USD' },
  'foreign_currency:EUR': { price: 1.08, unit: 'EUR', quoteCurrency: 'USD' },
}

/** FX rates into VND (household base currency for the MVP). */
const mockFxToVnd: Record<string, number> = {
  VND: 1,
  USD: 25_400,
  EUR: 27_450,
}

export function latestPrice(assetClass: AssetClass, symbol: string): MarketQuote | null {
  return mockPrices[`${assetClass}:${symbol.trim().toUpperCase()}`] ?? null
}

export function fxToVnd(currency: string): number {
  return mockFxToVnd[currency.trim().toUpperCase()] ?? 1
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

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** Format a VND amount as a short "M" figure, matching the app's money style. */
export function formatVndShort(value: number): string {
  const millions = value / 1_000_000
  const rounded = Math.round(millions * 10) / 10
  return `${String(rounded).replace('.', ',')}M`
}

// ---------------------------------------------------------------------------
// Seed data (a couple's household across all three valuation modes)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Liquidity-group chart palette (validated categorical, see dataviz skill)
// ---------------------------------------------------------------------------

/** One hue per liquidity bucket, in `liquidityOrder`. Text tokens elsewhere. */
export const liquidityColors: Record<AssetLiquidity, string> = {
  usable_now: 'hsl(142 71% 45%)', // status-green — spendable
  not_immediately_usable: 'hsl(211 100% 50%)', // accent/blue — reserve
  long_term: 'hsl(35 100% 50%)', // status-orange — long hold
}

// ---------------------------------------------------------------------------
// Snapshot history (frozen totals over time, §10 / §17)
// ---------------------------------------------------------------------------

export type AssetSnapshotPoint = {
  /** ISO date of the snapshot. */
  date: string
  usable_now: number
  not_immediately_usable: number
  long_term: number
}

/** Total asset value of a snapshot point across all liquidity buckets. */
export function snapshotTotal(point: AssetSnapshotPoint): number {
  return point.usable_now + point.not_immediately_usable + point.long_term
}

/**
 * Six months of frozen household snapshots leading up to `AS_OF`. Values are in
 * VND and trend upward as savings accrue and gold/crypto move — the last point
 * lines up with the computed current totals of `seedAssets`.
 */
export const seedSnapshots: AssetSnapshotPoint[] = [
  { date: '2026-02-01', usable_now: 18_000_000, not_immediately_usable: 86_400_000, long_term: 96_000_000 },
  { date: '2026-03-01', usable_now: 21_500_000, not_immediately_usable: 86_800_000, long_term: 101_000_000 },
  { date: '2026-04-01', usable_now: 19_000_000, not_immediately_usable: 87_100_000, long_term: 108_500_000 },
  { date: '2026-05-01', usable_now: 26_000_000, not_immediately_usable: 87_500_000, long_term: 112_000_000 },
  { date: '2026-06-01', usable_now: 23_000_000, not_immediately_usable: 87_900_000, long_term: 110_500_000 },
  { date: '2026-07-06', usable_now: 24_500_000, not_immediately_usable: 88_300_000, long_term: 115_700_000 },
]

export const seedAssets: Asset[] = [
  {
    id: 'a1',
    name: 'Tiền mặt ở nhà',
    type: 'cash',
    valuationMode: 'manual',
    liquidity: 'usable_now',
    currency: 'VND',
    note: 'Chi tiêu hằng ngày',
    manualValue: 4_500_000,
  },
  {
    id: 'a2',
    name: 'VCB Family',
    type: 'bank_account',
    valuationMode: 'manual',
    liquidity: 'usable_now',
    currency: 'VND',
    note: 'Tài khoản chung',
    manualValue: 20_000_000,
  },
  {
    id: 'a3',
    name: 'Sổ tiết kiệm ACB',
    type: 'saving_deposit',
    valuationMode: 'formula_calculated',
    liquidity: 'not_immediately_usable',
    currency: 'VND',
    note: 'Quỹ dự phòng 6 tháng',
    calculationTerm: {
      calculationType: 'saving_deposit',
      principalAmount: 86_000_000,
      interestRate: 5.2,
      startDate: '2026-01-01',
      maturityDate: '2027-01-01',
    },
  },
  {
    id: 'a4',
    name: 'Vàng SJC',
    type: 'gold',
    valuationMode: 'market_priced',
    liquidity: 'long_term',
    currency: 'VND',
    note: 'Giữ dài hạn',
    marketPosition: {
      assetClass: 'gold',
      symbol: 'SJC',
      quantity: 5,
      unit: 'chi',
      quoteCurrency: 'VND',
    },
  },
  {
    id: 'a5',
    name: 'Bitcoin',
    type: 'crypto',
    valuationMode: 'market_priced',
    liquidity: 'long_term',
    currency: 'VND',
    note: 'Đầu tư nhỏ',
    marketPosition: {
      assetClass: 'crypto',
      symbol: 'BTC',
      quantity: 0.05,
      unit: 'BTC',
      quoteCurrency: 'USD',
    },
  },
]
