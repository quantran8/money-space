import { useQuery } from '@tanstack/react-query'

import { useAssets } from '@/features/assets/hooks/use-assets'
import { getDashboard, listAttentionItems } from '@/features/dashboard/api/dashboard.repository'
import { useDebts } from '@/features/debts/hooks/use-debts'
import { useEvents } from '@/features/events/hooks/use-events'
import { useGoals } from '@/features/goals/hooks/use-goals'
import { usePayments } from '@/features/payments/hooks/use-payments'
import { queryKeys } from '@/shared/api/query-keys'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'

export function useDashboardOverview() {
  const { activeHouseholdId } = useActiveHousehold()
  const assets = useAssets()
  const payments = usePayments()
  const goals = useGoals()
  const debts = useDebts()
  const events = useEvents()

  const dashboardQuery = useQuery({
    queryKey: activeHouseholdId ? queryKeys.dashboard(activeHouseholdId) : ['dashboard', 'inactive'],
    queryFn: () => getDashboard(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })

  const attentionQuery = useQuery({
    queryKey: activeHouseholdId ? queryKeys.attentionItems(activeHouseholdId) : ['attention-items', 'inactive'],
    queryFn: () => listAttentionItems(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })

  return {
    snapshot: dashboardQuery.data,
    payments: payments.payments,
    debts: debts.debts,
    goals: goals.goals,
    assetGroups: assets.summary?.groups ?? [],
    attentionItems: attentionQuery.data?.items ?? [],
    recentEvents: events.events,
    assetTrend: assets.snapshots,
    isLoading:
      dashboardQuery.isLoading ||
      attentionQuery.isLoading ||
      assets.isLoading ||
      payments.isLoading ||
      goals.isLoading ||
      debts.isLoading ||
      events.isLoading,
  }
}
