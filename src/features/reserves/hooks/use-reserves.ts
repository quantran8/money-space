import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createReserve,
  listReserves,
  updateReserve,
} from '@/features/reserves/api/reserves.repository'
import {
  EMERGENCY_FUND_NAME,
  type ProtectedReserve,
} from '@/features/reserves/model/reserves.types'
import { queryKeys } from '@/shared/api/query-keys'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'

const EMPTY_RESERVES: ProtectedReserve[] = []

/**
 * The emergency fund as ONE number.
 *
 * The API still stores a list (see `protected_reserves`), but the product has a
 * single floor per household — named pots are goals, not reserves. Collapsing
 * the list here keeps that contract in one place instead of every caller having
 * to remember to sum and filter.
 */
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
  /** Only `active` rows raise the floor; `archived` keeps history out of today. */
  const active = reserves.filter((reserve) => reserve.status === 'active')
  const primary = active[0] ?? null

  return {
    /**
     * The floor the forecast compares against. Summed rather than read off
     * `primary` so a household with legacy multi-row data keeps the same number
     * it had before this screen collapsed to one input.
     */
    emergencyFund: active.reduce((sum, reserve) => sum + reserve.amount, 0),
    /** `false` once the household has declared a floor — drives empty copy. */
    hasEmergencyFund: active.length > 0,
    activeHouseholdId,
    ...query,
    setEmergencyFund: useMutation({
      mutationFn: async (amount: number) => {
        if (!primary) {
          await createReserve(activeHouseholdId!, { name: EMERGENCY_FUND_NAME, amount })
          return
        }
        await updateReserve(activeHouseholdId!, primary.id, { amount })
        // Legacy rows would keep adding to the floor behind the single input, so
        // the typed number would not be the number applied. Archiving (not
        // deleting) folds them away while keeping the record.
        for (const extra of active.slice(1)) {
          await updateReserve(activeHouseholdId!, extra.id, { status: 'archived' })
        }
      },
      onSuccess: invalidate,
    }),
  }
}
