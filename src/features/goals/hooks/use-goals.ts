import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createGoal, deleteGoal, listGoals, updateGoal, type GoalPayload } from '@/features/goals/api/goals.repository'
import { queryKeys } from '@/shared/api/query-keys'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'

export function useGoals() {
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()

  const query = useQuery({
    queryKey: activeHouseholdId ? queryKeys.goals(activeHouseholdId) : ['goals', 'inactive'],
    queryFn: () => listGoals(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })

  const invalidate = async () => {
    if (!activeHouseholdId) return
    await queryClient.invalidateQueries({ queryKey: queryKeys.goals(activeHouseholdId) })
    await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(activeHouseholdId) })
  }

  return {
    goals: query.data?.items ?? [],
    activeHouseholdId,
    ...query,
    createGoal: useMutation({
      mutationFn: (payload: GoalPayload) => createGoal(activeHouseholdId!, payload),
      onSuccess: invalidate,
    }),
    updateGoal: useMutation({
      mutationFn: ({ goalId, payload }: { goalId: string; payload: Partial<GoalPayload> }) =>
        updateGoal(activeHouseholdId!, goalId, payload),
      onSuccess: invalidate,
    }),
    deleteGoal: useMutation({
      mutationFn: (goalId: string) => deleteGoal(activeHouseholdId!, goalId),
      onSuccess: invalidate,
    }),
  }
}
