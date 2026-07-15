import { apiRequest } from '@/shared/api/http'

/** Asset classes the symbol picker supports (mirrors the backend). */
export type SymbolAssetClass = 'stock' | 'crypto'

/** One searchable instrument returned by the market-data symbols endpoint. */
export type SymbolReference = {
  assetClass: SymbolAssetClass
  symbol: string
  name: string
  exchange: string
  currency: string
  unit: string
}

type SearchSymbolsResponse = {
  assetClass: SymbolAssetClass | null
  query: string
  items: SymbolReference[]
  total: number
}

/**
 * Search stock/crypto symbols for the asset-create picker. An empty `query`
 * returns the curated default list; a non-empty query returns ranked matches.
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
