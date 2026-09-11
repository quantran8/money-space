import { useQuery } from '@tanstack/react-query'

import { fetchPlans } from '#/features/billing/api/billing.repository'
import { queryKeys } from '#/shared/api/query-keys'

/**
 * What is currently for sale, at today's prices.
 *
 * Fetched rather than hardcoded so a price change or a discount campaign is a
 * backend config change — never a release on two app stores. A plan that is
 * switched off (lifetime, say) simply does not come back.
 */
export function usePlans() {
  const query = useQuery({
    queryKey: queryKeys.plans(),
    queryFn: fetchPlans,
    // Prices are the same for everyone and change rarely; an hour avoids
    // re-asking on every paywall open within a session.
    staleTime: 60 * 60 * 1000,
  })

  return {
    plans: query.data?.items ?? [],
    ...query,
  }
}
