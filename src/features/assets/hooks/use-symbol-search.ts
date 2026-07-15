import { keepPreviousData, useQuery } from '@tanstack/react-query'

import {
  searchSymbols,
  type SymbolAssetClass,
  type SymbolReference,
} from '@/features/assets/api/symbols.repository'
import { queryKeys } from '@/shared/api/query-keys'
import { useDebouncedValue } from '@/shared/lib/use-debounced-value'

const EMPTY: SymbolReference[] = []

/**
 * Symbol picker data for the asset-create form. Debounces the typed query, and
 * only runs for `stock`/`crypto`. An empty query returns the curated default
 * list (shown before the user types); a typed query returns ranked matches.
 * Results are cached per (class, query) and kept while the next query loads.
 */
export function useSymbolSearch(
  assetClass: SymbolAssetClass | undefined,
  query: string,
  enabled: boolean,
) {
  const debouncedQuery = useDebouncedValue(query.trim(), 300)
  const isEnabled = enabled && !!assetClass

  const symbolsQuery = useQuery({
    queryKey: assetClass
      ? queryKeys.symbolSearch(assetClass, debouncedQuery)
      : ['market-data', 'symbols', 'inactive'],
    queryFn: () => searchSymbols(assetClass!, debouncedQuery),
    enabled: isEnabled,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })

  return {
    symbols: symbolsQuery.data ?? EMPTY,
    isLoading: symbolsQuery.isLoading,
    isFetching: symbolsQuery.isFetching,
  }
}
