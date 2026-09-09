/**
 * Asset domain logic for the Oursight MVP.
 *
 * Type ⇒ valuation-mode / liquidity lookup tables and the current-value
 * computation. Types live in `assets.types.ts`; mock prices and seed data
 * live in `../api/assets.repository.ts`.
 */

import { fxToVnd, latestPrice } from '#/features/assets/api/assets.repository'
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
} from '#/features/assets/model/assets.types'

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
} from '#/features/assets/model/assets.types'

// ---------------------------------------------------------------------------
// Type ⇒ valuation mode / liquidity metadata (§23, §34)
// ---------------------------------------------------------------------------

/**
 * Assets that hold a spendable cash balance the app can move.
 *
 * `creditManualAsset` / `debitManualAsset` on the backend return early for
 * every other type — a stock or a gold bar is valued from a price, not from a
 * stored balance — so pointing a settlement at one moves nothing.
 */
export const WALLET_ASSET_TYPES: readonly AssetType[] = ['cash', 'bank_account']

/**
 * Is this a wallet type? The single answer to "cash or bank account", so a new
 * wallet type is one edit here rather than a hunt through every picker.
 */
export function isWalletAssetType(type: string | undefined | null): boolean {
  return !!type && (WALLET_ASSET_TYPES as readonly string[]).includes(type)
}

/**
 * Can this asset settle a cashflow event — i.e. does confirming against it
 * actually move a balance?
 *
 * Two conditions, and both are the backend's (`assertSettlementAsset`):
 * it must count as flexible money (`usable_now`, the household's own answer to
 * "is this spendable"), and it must be a wallet type. Kept here so the picker
 * offers exactly what the API will accept rather than surfacing a 400.
 */
export function canSettleCashflow(asset: {
  type: AssetType
  liquidity: AssetLiquidity
  status?: string | null
}): boolean {
  return (
    (!asset.status || asset.status === 'active') &&
    asset.liquidity === 'usable_now' &&
    isWalletAssetType(asset.type)
  )
}

/**
 * The form's type picker groups the choices by how the value is arrived at:
 * a balance you hold, a price the market sets, everything else. Keeps the
 * flat list of ten from reading as one undifferentiated wall.
 */
export const assetTypeGroups: { id: 'wallet' | 'market' | 'other'; types: AssetType[] }[] = [
  { id: 'wallet', types: ['cash', 'bank_account'] },
  { id: 'market', types: ['gold', 'stock', 'crypto', 'foreign_currency'] },
  { id: 'other', types: ['real_estate', 'saving_deposit', 'loan_receivable', 'other'] },
]

/** Derived from the groups so the form schema can never offer a type the picker hides. */
export const assetTypeOrder: AssetType[] = assetTypeGroups.flatMap((group) => group.types)

/**
 * Old records keep their original type in storage and history. When one is
 * edited, fold retired choices into the closest type still offered by the form.
 */
const formAssetTypeByLegacyType: Partial<Record<AssetType, AssetType>> = {
  certificate_of_deposit: 'saving_deposit',
  bond: 'loan_receivable',
  fund: 'stock',
  insurance: 'other',
  investment: 'other',
}

export function assetTypeForForm(type: AssetType): AssetType {
  return formAssetTypeByLegacyType[type] ?? type
}

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

/** Canonical liquidity bucket derived from the asset type. */
const liquidityByType: Record<AssetType, AssetLiquidity> = {
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

/** The bucket a type falls into when the household has not said otherwise. */
export function liquidityForAssetType(type: AssetType): AssetLiquidity {
  return liquidityByType[type]
}

/** Whether a type counts towards flexible money before the user decides. */
export function flexibleByDefaultForAssetType(type: AssetType): boolean {
  return liquidityByType[type] === 'usable_now'
}

/**
 * The bucket, given the type and the household's explicit decision. Mirrors
 * `liquidityForAsset` in the backend (`common/utils/money-space.utils.ts`) —
 * the server owns the stored value; this keeps the optimistic local `Asset`
 * (and the form's consequence sentence) in step with what will come back.
 */
export function liquidityForAsset(
  type: AssetType,
  countsAsFlexible?: boolean | null,
): AssetLiquidity {
  const derived = liquidityByType[type]
  if (countsAsFlexible === true) return 'usable_now'
  // Excluded cash is money the household has but does not count on — the
  // middle bucket, never `long_term`.
  if (countsAsFlexible === false && derived === 'usable_now') {
    return 'not_immediately_usable'
  }
  return derived
}

export function assetClassForType(type: AssetType): AssetClass | undefined {
  return assetClassByType[type]
}

/**
 * Classes the symbol picker has a real instrument list for.
 *
 * `fund` is a market-priced class but has no listing behind it — the providers
 * quote funds as equities without a distinct catalogue — so a fund's symbol
 * stays free text rather than opening a combobox that can only ever say "not
 * found".
 */
const searchableClasses: AssetClass[] = [
  'stock',
  'crypto',
  'gold',
  'foreign_currency',
]

export type SearchableAssetClass = Extract<
  AssetClass,
  'stock' | 'crypto' | 'gold' | 'foreign_currency'
>

/** The picker's class for a type, or undefined when it has no instrument list. */
export function searchableAssetClassForType(
  type: AssetType,
): SearchableAssetClass | undefined {
  const assetClass = assetClassByType[type]
  return assetClass && searchableClasses.includes(assetClass)
    ? (assetClass as SearchableAssetClass)
    : undefined
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
// List sections
// ---------------------------------------------------------------------------

/**
 * The groups the sources list is broken into.
 *
 * Not the same thing as liquidity, and deliberately so. `other` is the catch-all
 * type — an odd holding nobody has a better word for — and it derives
 * `not_immediately_usable`, which the UI labels "Tiết kiệm". A household reading
 * that card saw its miscellaneous holdings filed under savings, which is a claim
 * about them that is simply not true.
 *
 * So the list splits that bucket in two: the savings card keeps the deposits and
 * the receivables that genuinely are a reserve, and `other` gets its own card.
 * Totals, the donut and the liquidity filter still work in the three real
 * buckets — this is a heading, not a fourth bucket.
 */
export type AssetSection = AssetLiquidity | 'other'

/** Which section's card an asset's row belongs in. */
export function sectionForAsset(asset: {
  type: AssetType
  liquidity: AssetLiquidity
}): AssetSection {
  return asset.type === 'other' && asset.liquidity === 'not_immediately_usable'
    ? 'other'
    : asset.liquidity
}

export const sectionOrder: AssetSection[] = [
  'usable_now',
  'not_immediately_usable',
  'long_term',
  'other',
]

/**
 * Does the liquidity filter let this section's card through?
 *
 * The filter still asks a liquidity question, so narrowing to "Tiết kiệm" keeps
 * both cards carved out of that bucket — hiding the `other` card there would
 * lose rows the filter did select.
 */
export function sectionMatchesLiquidity(
  section: AssetSection,
  filter: AssetLiquidity | 'all',
): boolean {
  if (filter === 'all') return true
  if (section === 'other') return filter === 'not_immediately_usable'
  return section === filter
}

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

/** Assets whose price/value can be refreshed manually from the detail page. */
export const MANUAL_PRICE_ASSET_TYPES: ReadonlySet<AssetType> = new Set([
  'stock',
  'crypto',
  'bond',
  'gold',
  'fund',
  'foreign_currency',
])

export function canUpdatePriceManually(type: AssetType): boolean {
  return MANUAL_PRICE_ASSET_TYPES.has(type)
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

/** `2026-09-06` + n months, clamped to the month's length (31/01 → 28/02). */
function addMonthsIso(isoDate: string, months: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return isoDate
  const day = d.getUTCDate()
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1))
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate()
  target.setUTCDate(Math.min(day, lastDay))
  return target.toISOString().slice(0, 10)
}

/**
 * Whole monthly anniversaries elapsed — i.e. how many monthly payouts have
 * fallen due. Mirrors `wholeMonthsBetween` in the backend's money-space.utils.ts.
 */
function wholeMonthsBetween(startDate: string, asOf: string): number {
  if (asOf < startDate) return 0
  let months = 0
  while (months < 1200 && addMonthsIso(startDate, months + 1) <= asOf) {
    months += 1
  }
  return months
}

function computeMarketValue(position: MarketPosition): number | null {
  // A manually recorded latest price wins. Otherwise prefer the market cache;
  // the original purchase price is only the final fallback/cost basis.
  if (typeof position.lastPrice === 'number' && Number.isFinite(position.lastPrice)) {
    return position.quantity * position.lastPrice * fxToVnd(position.quoteCurrency)
  }
  const quote = latestPrice(position.assetClass, position.symbol)
  if (quote) {
    const valueInQuote = position.quantity * quote.price
    return valueInQuote * fxToVnd(quote.quoteCurrency)
  }
  if (
    typeof position.purchasePrice === 'number' &&
    Number.isFinite(position.purchasePrice)
  ) {
    return position.quantity * position.purchasePrice * fxToVnd(position.quoteCurrency)
  }
  return null
}

/**
 * Accrued-interest model for formula assets (§25), by payout schedule.
 *
 * `end_of_term` is worth its principal until it actually pays: break such a
 * passbook early and the bank pays the NON-TERM rate on the elapsed days, not
 * the contracted one, so a daily-accrued figure is money that will never exist.
 * `monthly` keeps accruing — its interest genuinely falls due each month, and a
 * `principal` destination capitalizes it into the balance for real.
 *
 * Mirrors `computeCurrentValue` in the backend's money-space.utils.ts; the two
 * must agree or the form and the server will quote different numbers.
 * See memory/asset-valuation.md.
 */
function computeFormulaValue(term: CalculationTerm, asOf: string): number {
  const rate = term.interestRate / 100

  if (term.interestPayment === 'end_of_term') {
    const matured = !!term.maturityDate && new Date(term.maturityDate) <= new Date(asOf)
    if (!matured) return term.principalAmount
    const years = daysBetween(term.startDate, term.maturityDate as string) / 365
    return term.principalAmount + term.principalAmount * rate * years
  }

  // `monthly`: interest lands on the deposit's own day each month, so the value
  // STEPS on each anniversary rather than sloping daily. Gửi ngày 06 means
  // nothing is added until the 06th of the next month.
  const horizon =
    term.maturityDate && new Date(term.maturityDate) < new Date(asOf)
      ? term.maturityDate
      : asOf
  const elapsedPayouts = wholeMonthsBetween(term.startDate, horizon)
  const monthly = (term.principalAmount * rate) / 12
  return term.principalAmount + monthly * elapsedPayouts
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
