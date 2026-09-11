import { useQuery } from '@tanstack/react-query'

import { fetchEntitlement } from '#/features/billing/api/billing.repository'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'

/**
 * What the household's plan currently allows.
 *
 * Every ceiling comes from the server's `limits`, so nothing here hardcodes a
 * number — `limits.goals` is read, never the literal 2.
 */
export function useEntitlement() {
  const { activeHouseholdId } = useActiveHousehold()

  const query = useQuery({
    queryKey: activeHouseholdId
      ? queryKeys.entitlement(activeHouseholdId)
      : ['billing', 'entitlement', 'inactive'],
    queryFn: () => fetchEntitlement(activeHouseholdId!),
    enabled: !!activeHouseholdId,
    /**
     * Five minutes. A plan barely changes within a session, and the two things
     * that do change it — redeeming and paying — write the new value into the
     * cache directly. Without this, every tab switch would re-ask for an
     * answer that had not moved.
     */
    staleTime: 5 * 60 * 1000,
  })

  const entitlement = query.data
  const isPremium =
    entitlement?.tier === 'premium' && entitlement.status === 'active'

  return {
    entitlement: entitlement ?? null,
    isPremium,
    /**
     * Treat "still loading" as allowed, on purpose: flashing a paywall that
     * then disappears is a worse experience than a free household seeing a
     * button work for half a second before the server refuses it — and the
     * server is always the last word.
     */
    isPremiumOrLoading: isPremium || query.isLoading,
    /** `null` until loaded — every consumer must tolerate that. */
    limits: entitlement?.limits ?? null,
    usage: entitlement?.usage ?? null,
    activeHouseholdId,
    ...query,
  }
}
