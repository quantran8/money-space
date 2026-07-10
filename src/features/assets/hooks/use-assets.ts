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

  const invalidate = async () => {
    if (!activeHouseholdId) return
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.assets(activeHouseholdId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.assetSummary(activeHouseholdId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.assetSnapshots(activeHouseholdId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(activeHouseholdId) }),
    ])
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
