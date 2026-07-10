import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createDebt, deleteDebt, listDebts, updateDebt, type DebtPayload } from '@/features/debts/api/debts.repository'
import { queryKeys } from '@/shared/api/query-keys'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'

export function useDebts() {
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()

  const query = useQuery({
    queryKey: activeHouseholdId ? queryKeys.debts(activeHouseholdId) : ['debts', 'inactive'],
    queryFn: () => listDebts(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })

  const invalidate = async () => {
    if (!activeHouseholdId) return
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.debts(activeHouseholdId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(activeHouseholdId) }),
    ])
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
