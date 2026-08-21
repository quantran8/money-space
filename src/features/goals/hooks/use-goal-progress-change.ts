import { useQuery } from '@tanstack/react-query'

import { getGoalProgressChange } from '@/features/goals/api/goals.repository'
import { queryKeys } from '@/shared/api/query-keys'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'

/**
 * Why the goal's figure moved since the last frozen point.
 *
 * `change` is null when nothing moved or there is no earlier point — both mean
 * "nothing to say", and the caller renders nothing rather than a line reading
 * "no change".
 *
 * Nested under the goals key, so assigning or removing an asset refreshes the
 * explanation along with the figure it explains.
 */
export function useGoalProgressChange(goalId?: string) {
  const { activeHouseholdId } = useActiveHousehold()
  const canQuery = Boolean(activeHouseholdId && goalId)

  const query = useQuery({
    queryKey:
      activeHouseholdId && goalId
        ? queryKeys.goalProgressChange(activeHouseholdId, goalId)
        : ['goal-progress-change', 'inactive'],
    queryFn: () => getGoalProgressChange(activeHouseholdId!, goalId!),
    enabled: canQuery,
  })

  return {
    change: query.data?.change ?? null,
    isLoading: query.isLoading && canQuery,
  }
}
