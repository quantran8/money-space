import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createAsset,
  deleteAsset,
  getAssetSnapshots,
  getAssetSummary,
  listAssets,
  updateAsset,
  type AssetPayload,
} from '@/features/assets/api/assets.repository'
import type { Asset, AssetSnapshotPoint } from '@/features/assets/model/assets.types'
import { queryKeys } from '@/shared/api/query-keys'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'

const EMPTY_ASSETS: Asset[] = []
const EMPTY_SNAPSHOTS: AssetSnapshotPoint[] = []

export function useAssets() {
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()

  const assetsQuery = useQuery({
    queryKey: activeHouseholdId ? queryKeys.assets(activeHouseholdId) : ['assets', 'inactive'],
    queryFn: () => listAssets(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })
  const summaryQuery = useQuery({
    queryKey: activeHouseholdId ? queryKeys.assetSummary(activeHouseholdId) : ['asset-summary', 'inactive'],
    queryFn: () => getAssetSummary(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })
  const snapshotsQuery = useQuery({
    queryKey: activeHouseholdId ? queryKeys.assetSnapshots(activeHouseholdId) : ['asset-snapshots', 'inactive'],
    queryFn: () => getAssetSnapshots(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })

  /**
   * Mark everything an asset write affects as stale.
   *
   * NOT awaited, deliberately. `invalidateQueries` resolves only once the
   * refetches it triggers have COMPLETED, so awaiting it inside `onSuccess`
   * keeps `mutateAsync` pending until all seven round-trips finish — the
   * dialog sat on "Đang lưu..." for seconds after the write itself had already
   * succeeded. The save is done when the POST returns; the refetches are
   * background bookkeeping, and each list shows its own loading state.
   *
   * `void` on each call marks the floating promise as intentional. Failures
   * are not swallowed silently — a failed refetch surfaces through the
   * consuming query's own error state, exactly as a background refetch does.
   */
  const invalidate = () => {
    if (!activeHouseholdId) return
    const keys = [
      // PREFIX MATCH. `['households', id, 'assets']` already covers the summary
      // (`…, 'assets', 'summary'`), the snapshots (`…, 'assets', 'snapshots'`)
      // and each per-asset value history (`…, 'assets', <id>, 'value-history'`).
      // Listing those explicitly as well invalidated them TWICE, which is why
      // the network panel showed two `summary` and two `snapshots` calls per
      // save. One key, one refetch each.
      queryKeys.assets(activeHouseholdId),
      queryKeys.dashboard(activeHouseholdId),
      // A create/update/delete asset can log an `asset_update` revaluation money
      // event (see asset-valuation), so refresh the events list too.
      queryKeys.events(activeHouseholdId),
      // An asset moves liquid money, so the flexible-money figure the forms
      // quote back (§22.7) is stale until this refetches.
      ['households', activeHouseholdId, 'flexible-money'],
      ['households', activeHouseholdId, 'forecast'],
    ]
    for (const queryKey of keys) void queryClient.invalidateQueries({ queryKey })
  }

  return {
    assets: assetsQuery.data?.items ?? EMPTY_ASSETS,
    asOf: assetsQuery.data?.asOf ?? '',
    household: assetsQuery.data?.household,
    summary: summaryQuery.data,
    snapshots: snapshotsQuery.data?.items ?? EMPTY_SNAPSHOTS,
    activeHouseholdId,
    isLoading: assetsQuery.isLoading || summaryQuery.isLoading || snapshotsQuery.isLoading,
    error: assetsQuery.error ?? summaryQuery.error ?? snapshotsQuery.error,
    createAsset: useMutation({
      mutationFn: (payload: AssetPayload) => createAsset(activeHouseholdId!, payload),
      onSuccess: invalidate,
    }),
    updateAsset: useMutation({
      mutationFn: ({ assetId, payload }: { assetId: string; payload: Partial<AssetPayload> }) =>
        updateAsset(activeHouseholdId!, assetId, payload),
      onSuccess: invalidate,
    }),
    deleteAsset: useMutation({
      mutationFn: (assetId: string) => deleteAsset(activeHouseholdId!, assetId),
      onSuccess: invalidate,
    }),
  }
}
