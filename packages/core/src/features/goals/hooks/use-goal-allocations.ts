import { useQuery } from '@tanstack/react-query'

import { listGoalAllocations } from '#/features/goals/api/goals.repository'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'

/**
 * The assets behind one `asset_backed` goal.
 *
 * Only fetched when the goal is actually asset-backed — an earmark goal has no
 * allocations, and asking for them would 400.
 */
export function useGoalAllocations(goalId?: string, enabled = true) {
  const { activeHouseholdId } = useActiveHousehold()
  const canQuery = Boolean(activeHouseholdId && goalId && enabled)

  const query = useQuery({
    queryKey:
      activeHouseholdId && goalId
        ? queryKeys.goalAllocations(activeHouseholdId, goalId)
        : ['goal-allocations', 'inactive'],
    queryFn: () => listGoalAllocations(activeHouseholdId!, goalId!),
    enabled: canQuery,
  })

  return {
    allocations: query.data?.items ?? [],
    isLoading: query.isLoading && canQuery,
  }
}
