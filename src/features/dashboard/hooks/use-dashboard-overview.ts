import { useQuery } from '@tanstack/react-query'

import { useAssets } from '@/features/assets/hooks/use-assets'
import { getDashboard, listAttentionItems } from '@/features/dashboard/api/dashboard.repository'
import { useGoals } from '@/features/goals/hooks/use-goals'
import { queryKeys } from '@/shared/api/query-keys'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'

/**
 * Home's data fan-out.
 *
 * Trimmed in Phase 9: the v3.1 Home reads its forecast, flexible-money,
 * financial-state and freshness figures from those slices' own hooks, so this
 * no longer pulls debts, events or the cashflow compat shim. Blocking Home's
 * skeleton on queries nothing on the page renders would just make it slower.
 */
export function useDashboardOverview() {
  const { activeHouseholdId } = useActiveHousehold()
  const assets = useAssets()
  const goals = useGoals()

  const dashboardQuery = useQuery({
    queryKey: activeHouseholdId
      ? queryKeys.dashboard(activeHouseholdId)
      : ['dashboard', 'inactive'],
    queryFn: () => getDashboard(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })

  const attentionQuery = useQuery({
    queryKey: activeHouseholdId
      ? queryKeys.attentionItems(activeHouseholdId)
      : ['attention-items', 'inactive'],
    queryFn: () => listAttentionItems(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })

  return {
    snapshot: dashboardQuery.data,
    goals: goals.goals,
    assets: assets.assets,
    assetGroups: assets.summary?.groups ?? [],
    attentionItems: attentionQuery.data?.items ?? [],
    assetTrend: assets.snapshots,
    isLoading:
      dashboardQuery.isLoading ||
      attentionQuery.isLoading ||
      assets.isLoading ||
      goals.isLoading,
  }
}
