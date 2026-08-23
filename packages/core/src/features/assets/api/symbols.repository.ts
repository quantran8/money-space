import { apiRequest } from '#/shared/api/http'

/**
 * Asset classes the symbol picker supports (mirrors the backend).
 *
 * `gold` covers silver too — the app has one precious-metal class, and both are
 * held, priced and sold the same way.
 */
export type SymbolAssetClass = 'stock' | 'crypto' | 'gold' | 'foreign_currency'

/** One searchable instrument returned by the market-data symbols endpoint. */
export type SymbolReference = {
  assetClass: SymbolAssetClass
  symbol: string
  name: string
  /** Venue (stock) or dealer brand (gold/silver); empty for crypto and FX. */
  exchange: string
  currency: string
  unit: string
}

/** A live market quote for one instrument. */
export type MarketQuote = {
  assetClass: string
  symbol: string
  /** Price of one `unit`, expressed in `quoteCurrency`. */
  price: number
  unit: string
  quoteCurrency: string
  /** ISO timestamp the quote was observed. */
  priceTime: string
  /** Upstream that supplied it, e.g. `vnstock`, `coinmarketcap`, `btmc`. */
  source: string
}

type SearchSymbolsResponse = {
  assetClass: SymbolAssetClass | null
  query: string
  items: SymbolReference[]
  total: number
}

type QuoteResponse = { quote: MarketQuote | null }

/**
 * Search symbols for the asset-create picker. An empty `query` returns the
 * curated default list; a non-empty query returns ranked matches.
 */
export async function searchSymbols(
  assetClass: SymbolAssetClass,
  query: string,
): Promise<SymbolReference[]> {
  const response = await apiRequest<SearchSymbolsResponse>(
    '/api/market-data/symbols',
    undefined,
    { assetClass, q: query || undefined },
  )
  return response.items
}

/**
 * Price one instrument on demand.
 *
 * Distinct from the prices endpoint, which only covers positions the household
 * already holds — a symbol being added for the first time is not in that set.
 * Resolves to `null` when the symbol cannot be priced, so the form falls back
 * to a typed price rather than blocking creation.
 */
export async function fetchQuote(
  assetClass: SymbolAssetClass,
  symbol: string,
  market?: string,
  quoteCurrency?: string,
): Promise<MarketQuote | null> {
  const response = await apiRequest<QuoteResponse>(
    '/api/market-data/quote',
    undefined,
    {
      assetClass,
      symbol,
      market: market || undefined,
      quoteCurrency: quoteCurrency || undefined,
    },
  )
  return response.quote
}
