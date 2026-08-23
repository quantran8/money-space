import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createDebt, deleteDebt, listDebts, updateDebt, type DebtPayload } from '#/features/debts/api/debts.repository'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'

export function useDebts() {
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()

  const query = useQuery({
    queryKey: activeHouseholdId ? queryKeys.debts(activeHouseholdId) : ['debts', 'inactive'],
    queryFn: () => listDebts(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })

  // NOT awaited — see the note in `use-assets.ts`.
  const invalidate = () => {
    if (!activeHouseholdId) return
    for (const queryKey of [
      queryKeys.debts(activeHouseholdId),
      queryKeys.dashboard(activeHouseholdId),
      // An effective-from-now / disbursement / reconcile update logs a money
      // event, so the events timeline (and the debt detail history) must refetch.
      queryKeys.events(activeHouseholdId),
      // A debt write moves the repayment schedule, which the forecast and the
      // flexible-money figure are computed from. One prefix key covers every
      // horizon and all three readings — they share a cache entry.
      queryKeys.forecastBundleAll(activeHouseholdId),
    ]) {
      void queryClient.invalidateQueries({ queryKey })
    }
  }

  return {
    debts: query.data?.items ?? [],
    activeHouseholdId,
    ...query,
    createDebt: useMutation({
      mutationFn: (payload: DebtPayload) => createDebt(activeHouseholdId!, payload),
      onSuccess: invalidate,
    }),
    updateDebt: useMutation({
      mutationFn: ({ debtId, payload }: { debtId: string; payload: Partial<DebtPayload> }) =>
        updateDebt(activeHouseholdId!, debtId, payload),
      onSuccess: invalidate,
    }),
    deleteDebt: useMutation({
      mutationFn: (debtId: string) => deleteDebt(activeHouseholdId!, debtId),
      onSuccess: invalidate,
    }),
  }
}
