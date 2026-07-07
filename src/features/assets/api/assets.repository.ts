/**
 * Assets data source (mock).
 *
 * Stands in for the future Supabase-backed asset store and the
 * market_prices / fx_rates caches (§13, §14). The UI reads seed data and
 * mock quotes from here; swap these functions for Supabase queries when the
 * backend is wired up.
 */

import type {
  AssetClass,
  AssetSnapshotPoint,
  Asset,
  MarketQuote,
} from '@/features/assets/model/assets.types'

// ---------------------------------------------------------------------------
// Mock market data (stands in for market_prices / fx_rates cache, §13, §14)
// ---------------------------------------------------------------------------

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
// Snapshot history (frozen totals over time, §10 / §17)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Seed data (a couple's household across all three valuation modes)
// ---------------------------------------------------------------------------

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
