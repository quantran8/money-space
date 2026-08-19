import { useQuery } from '@tanstack/react-query'

import { getGoalMonthlyProgress } from '@/features/goals/api/goals.repository'
import { queryKeys } from '@/shared/api/query-keys'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'

/**
 * One goal's month-by-month history, read from the progress frozen into each
 * snapshot. Nested under the goals key, so any goal or allocation write
 * refreshes it too.
 */
export function useGoalMonthlyProgress(goalId?: string) {
  const { activeHouseholdId } = useActiveHousehold()
  const canQuery = Boolean(activeHouseholdId && goalId)

  const query = useQuery({
    queryKey:
      activeHouseholdId && goalId
        ? queryKeys.goalMonthlyProgress(activeHouseholdId, goalId)
        : ['goal-monthly-progress', 'inactive'],
    queryFn: () => getGoalMonthlyProgress(activeHouseholdId!, goalId!),
    enabled: canQuery,
  })

  return {
    months: query.data?.months ?? [],
    plannedMonthlyContribution: query.data?.plannedMonthlyContribution ?? null,
    isLoading: query.isLoading && canQuery,
  }
}
