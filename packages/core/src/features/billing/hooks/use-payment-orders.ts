import { useQuery } from '@tanstack/react-query'

import { fetchPaymentOrders } from '#/features/billing/api/billing.repository'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'

/**
 * What the household has bought.
 *
 * The same `queryKeys.paymentOrders` the return page already writes into after
 * a payment settles, so a fresh order appears in the history without a refetch.
 */
export function usePaymentOrders() {
  const { activeHouseholdId } = useActiveHousehold()

  const query = useQuery({
    queryKey: activeHouseholdId
      ? queryKeys.paymentOrders(activeHouseholdId)
      : ['billing', 'orders', 'inactive'],
    queryFn: () => fetchPaymentOrders(activeHouseholdId!),
    enabled: !!activeHouseholdId,
    // Receipts are history: once written they do not change. What does change
    // is a pending order settling, and the return page invalidates this key
    // itself when that happens.
    staleTime: 5 * 60 * 1000,
  })

  return {
    orders: query.data?.items ?? [],
    ...query,
  }
}
