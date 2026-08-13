import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createReserve,
  deleteReserve,
  listReserves,
  updateReserve,
  type ReservePayload,
} from '@/features/reserves/api/reserves.repository'
import type { ProtectedReserve } from '@/features/reserves/model/reserves.types'
import { queryKeys } from '@/shared/api/query-keys'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'

const EMPTY_RESERVES: ProtectedReserve[] = []

export function useReserves() {
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()

  const query = useQuery({
    queryKey: activeHouseholdId
      ? queryKeys.reserves(activeHouseholdId)
      : ['reserves', 'inactive'],
    queryFn: () => listReserves(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })

  /** A reserve change moves flexible money and the financial state. */
  const invalidate = async () => {
    if (!activeHouseholdId) return
    await Promise.all(
      [
        queryKeys.reserves(activeHouseholdId),
        ['households', activeHouseholdId, 'forecast'],
        ['households', activeHouseholdId, 'flexible-money'],
        ['households', activeHouseholdId, 'financial-state'],
        queryKeys.dashboard(activeHouseholdId),
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    )
  }

  const reserves = query.data?.items ?? EMPTY_RESERVES

  return {
    reserves,
    /** Only `active` reserves constrain the forecast. */
    activeReserveTotal: reserves
      .filter((reserve) => reserve.status === 'active')
      .reduce((sum, reserve) => sum + reserve.amount, 0),
    activeHouseholdId,
    ...query,
    createReserve: useMutation({
      mutationFn: (payload: ReservePayload) => createReserve(activeHouseholdId!, payload),
      onSuccess: invalidate,
    }),
    updateReserve: useMutation({
      mutationFn: ({
        reserveId,
        payload,
      }: {
        reserveId: string
        payload: Partial<ReservePayload>
      }) => updateReserve(activeHouseholdId!, reserveId, payload),
      onSuccess: invalidate,
    }),
    deleteReserve: useMutation({
      mutationFn: (reserveId: string) => deleteReserve(activeHouseholdId!, reserveId),
      onSuccess: invalidate,
    }),
  }
}
