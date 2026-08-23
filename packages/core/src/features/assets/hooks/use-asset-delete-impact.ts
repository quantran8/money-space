import { useQuery } from '@tanstack/react-query'

import { assetDeleteImpact } from '#/features/assets/api/assets.repository'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'

/**
 * What deleting this asset would take with it — the goals whose claims would
 * go, and the events and debts that would lose their wallet pointer.
 *
 * Fetched when the delete dialog opens, so the confirmation can state the cost
 * instead of asking the household to guess. Assets are soft-deleted and nothing
 * cascades, so the server refuses the delete while any of this exists; without
 * the answer here, the household would meet that refusal as a bare error.
 */
export function useAssetDeleteImpact(assetId?: string | null) {
  const { activeHouseholdId } = useActiveHousehold()
  const canQuery = Boolean(activeHouseholdId && assetId)

  const query = useQuery({
    queryKey:
      activeHouseholdId && assetId
        ? queryKeys.assetDeleteImpact(activeHouseholdId, assetId)
        : ['asset-delete-impact', 'inactive'],
    queryFn: () => assetDeleteImpact(activeHouseholdId!, assetId!),
    enabled: canQuery,
  })

  return {
    impact: query.data,
    /**
     * Treated as "nothing to warn about" until the answer arrives. The dialog
     * only uses this to decide whether to show the extra warning; the server
     * still refuses a delete that needs confirming, so a slow read cannot let
     * an unconfirmed cascade through.
     */
    isClear: query.data?.isClear ?? true,
    isLoading: query.isLoading && canQuery,
  }
}
