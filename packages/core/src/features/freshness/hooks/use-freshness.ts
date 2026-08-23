import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  confirmAssetsUnchanged,
  getDataFreshness,
} from '#/features/freshness/api/freshness.repository'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'

export function useFreshness() {
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()

  const query = useQuery({
    queryKey: activeHouseholdId
      ? queryKeys.freshness(activeHouseholdId)
      : ['freshness', 'inactive'],
    queryFn: () => getDataFreshness(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })

  /**
   * Confirming freshness changes no value, so the forecast numbers stay put —
   * but the staleness ASSUMPTION they carry does change, so the forecast
   * family is invalidated too.
   */
  // NOT awaited — see the note in `use-assets.ts`.
  const invalidate = () => {
    if (!activeHouseholdId) return
    for (const queryKey of [
      queryKeys.freshness(activeHouseholdId),
      queryKeys.assets(activeHouseholdId),
      queryKeys.forecastBundleAll(activeHouseholdId),
      queryKeys.dashboard(activeHouseholdId),
    ]) {
      void queryClient.invalidateQueries({ queryKey })
    }
  }

  return {
    freshness: query.data,
    activeHouseholdId,
    ...query,
    confirmUnchanged: useMutation({
      mutationFn: (assetIds?: string[]) =>
        confirmAssetsUnchanged(activeHouseholdId!, assetIds),
      onSuccess: invalidate,
    }),
  }
}
