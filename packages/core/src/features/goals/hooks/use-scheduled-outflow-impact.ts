import { useQuery } from '@tanstack/react-query'

import { getScheduledOutflowImpact } from '#/features/goals/api/goals.repository'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'

/**
 * What money already scheduled to leave this goal's wallets will cost it.
 *
 * `null` — and therefore nothing rendered — when nothing is scheduled that
 * touches them. The goal screen asks this ONCE and explains it in one section,
 * rather than hanging a projected figure off every metric a bill happens to move.
 */
export function useScheduledOutflowImpact(goalId?: string) {
  const { activeHouseholdId } = useActiveHousehold()
  const canQuery = Boolean(activeHouseholdId && goalId)

  const query = useQuery({
    queryKey:
      activeHouseholdId && goalId
        ? queryKeys.goalScheduledOutflowImpact(activeHouseholdId, goalId)
        : ['goal-scheduled-outflow-impact', 'inactive'],
    queryFn: () => getScheduledOutflowImpact(activeHouseholdId!, goalId!),
    enabled: canQuery,
  })

  return {
    impact: query.data ?? null,
    isLoading: query.isLoading && canQuery,
  }
}
