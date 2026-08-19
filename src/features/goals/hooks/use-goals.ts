import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createGoal,
  createGoalAllocation,
  deleteGoal,
  deleteGoalAllocation,
  listGoals,
  updateGoal,
  updateGoalAllocation,
  type CreateGoalPayload,
  type GoalAllocationPayload,
  type GoalPayload,
} from '@/features/goals/api/goals.repository'
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

  /**
   * NOT awaited. `invalidateQueries` resolves only once the refetches it
   * triggers have COMPLETED, so awaiting it inside `onSuccess` keeps
   * `mutateAsync` pending until every round-trip lands — the dialog stays on
   * "Đang lưu..." long after the write itself succeeded. The save is done when
   * the POST returns; refetches are background bookkeeping and each list shows
   * its own loading state.
   *
   * These two were also awaited SEQUENTIALLY, so the dashboard refetch did not
   * even start until the goals refetch had finished.
   */
  const invalidate = () => {
    if (!activeHouseholdId) return
    for (const queryKey of [
      // `goals(...)` is a PREFIX of `goalAllocations(...)`, so this one call
      // also refreshes every open allocation panel — which it must, since an
      // allocation IS an asset-backed goal's progress.
      queryKeys.goals(activeHouseholdId),
      queryKeys.dashboard(activeHouseholdId),
    ]) {
      void queryClient.invalidateQueries({ queryKey })
    }
  }

  return {
    goals: query.data?.items ?? [],
    activeHouseholdId,
    ...query,
    createGoal: useMutation({
      mutationFn: (payload: CreateGoalPayload) => createGoal(activeHouseholdId!, payload),
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
    /**
     * Allocation writes invalidate the same keys: an asset-backed goal's
     * progress IS its allocations, so the goal list and the dashboard's
     * set-aside split both move when one changes.
     */
    createAllocation: useMutation({
      mutationFn: ({ goalId, payload }: { goalId: string; payload: GoalAllocationPayload }) =>
        createGoalAllocation(activeHouseholdId!, goalId, payload),
      onSuccess: invalidate,
    }),
    updateAllocation: useMutation({
      mutationFn: ({
        goalId,
        allocationId,
        payload,
      }: {
        goalId: string
        allocationId: string
        payload: Partial<Omit<GoalAllocationPayload, 'assetId'>>
      }) => updateGoalAllocation(activeHouseholdId!, goalId, allocationId, payload),
      onSuccess: invalidate,
    }),
    deleteAllocation: useMutation({
      mutationFn: ({ goalId, allocationId }: { goalId: string; allocationId: string }) =>
        deleteGoalAllocation(activeHouseholdId!, goalId, allocationId),
      onSuccess: invalidate,
    }),
  }
}
