import { useQuery } from '@tanstack/react-query'

import {
  fetchQuote,
  type SymbolAssetClass,
} from '#/features/assets/api/symbols.repository'
import { queryKeys } from '#/shared/api/query-keys'

/**
 * The live market price for the symbol currently chosen in the asset form.
 *
 * Only runs once a symbol is actually selected — there is nothing to price
 * before that. `quoteCurrency` asks the backend to price in that currency: the
 * form's money fields are đồng, so a class that would otherwise quote in USD
 * (crypto, foreign equities) asks for VND and gets a figure it can prefill.
 * A gold quote carries `unitPrices` — the same figure in chỉ, lượng and gram —
 * so switching the form's unit is a lookup, not another request.
 *
 * A symbol the providers cannot quote resolves to `null` rather than an error,
 * so the form shows "no price available" and the user carries on typing their
 * own figures instead of being blocked.
 */
export function useMarketQuote(
  assetClass: SymbolAssetClass | undefined,
  symbol: string,
  market?: string,
  quoteCurrency?: string,
) {
  const trimmed = symbol.trim()
  const enabled = !!assetClass && trimmed.length > 0

  const quoteQuery = useQuery({
    queryKey: assetClass
      ? queryKeys.marketQuote(
          assetClass,
          trimmed.toUpperCase(),
          market ?? '',
          quoteCurrency ?? '',
        )
      : ['market-data', 'quote', 'inactive'],
    queryFn: () => fetchQuote(assetClass!, trimmed, market, quoteCurrency),
    enabled,
    // Quotes move; the backend caches them for 5 minutes, so match that rather
    // than re-asking on every field focus.
    staleTime: 5 * 60 * 1000,
  })

  return {
    quote: quoteQuery.data ?? null,
    isLoading: enabled && quoteQuery.isLoading,
    /** True while any fetch is in flight, including a user-triggered refresh. */
    isFetching: enabled && quoteQuery.isFetching,
    /** True once a lookup finished and the symbol turned out unpriceable. */
    isUnavailable: enabled && quoteQuery.isSuccess && quoteQuery.data === null,
    /**
     * Re-ask for the price now, ignoring `staleTime`. For a user-driven
     * "refresh" action — the server still caches for 5 minutes, so this returns
     * that cached figure rather than hitting the provider on every click.
     */
    refetch: quoteQuery.refetch,
  }
}
