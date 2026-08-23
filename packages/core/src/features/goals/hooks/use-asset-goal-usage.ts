import { useQuery } from '@tanstack/react-query'

import { getAssetGoalUsage } from '#/features/goals/api/goals.repository'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'

/**
 * Which goals one asset is backing, and how much of it is still free.
 *
 * The mirror of a goal's allocation panel, for the asset detail page. Keyed
 * under the goals prefix, so any allocation write refreshes it too — the answer
 * changes when a goal claims the asset, not when the asset itself changes.
 */
export function useAssetGoalUsage(assetId?: string) {
  const { activeHouseholdId } = useActiveHousehold()
  const canQuery = Boolean(activeHouseholdId && assetId)

  const query = useQuery({
    queryKey:
      activeHouseholdId && assetId
        ? queryKeys.assetGoalUsage(activeHouseholdId, assetId)
        : ['asset-goal-usage', 'inactive'],
    queryFn: () => getAssetGoalUsage(activeHouseholdId!, assetId!),
    enabled: canQuery,
  })

  return {
    items: query.data?.items ?? [],
    assetValue: query.data?.assetValue ?? 0,
    claimedAmount: query.data?.claimedAmount ?? 0,
    freeAmount: query.data?.freeAmount ?? 0,
    committedAmount: query.data?.committedAmount ?? 0,
    unassignedAmount: query.data?.unassignedAmount ?? 0,
    isLoading: query.isLoading && canQuery,
  }
}
