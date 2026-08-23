import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

import { apiRequest } from '#/shared/api/http'
import { queryKeys } from '#/shared/api/query-keys'
import { useAppStore } from '#/shared/stores/household-store'
import { setDisplayCurrency } from '#/shared/lib/format-money'

export type HouseholdSummary = {
  id: string
  name: string
  currency: string
  updateFrequency: string
  /**
   * Profile id of whoever created the household. The backend refuses to delete
   * this member's row (it is what the invite/remove/delete guard resolves
   * against), so the client uses it to hide the action rather than offer one
   * that always fails.
   */
  createdBy: string
  createdAt: string
}

type HouseholdListResponse = {
  items: HouseholdSummary[]
  total: number
}

export function useActiveHousehold() {
  const activeHouseholdId = useAppStore((state) => state.activeHouseholdId)
  const setActiveHouseholdId = useAppStore((state) => state.setActiveHouseholdId)

  const householdsQuery = useQuery({
    queryKey: queryKeys.households,
    queryFn: () => apiRequest<HouseholdListResponse>('/households'),
  })

  useEffect(() => {
    if (activeHouseholdId || !householdsQuery.data?.items.length) return
    setActiveHouseholdId(householdsQuery.data.items[0].id)
  }, [activeHouseholdId, householdsQuery.data?.items, setActiveHouseholdId])

  const activeHousehold =
    householdsQuery.data?.items.find((item) => item.id === activeHouseholdId) ??
    householdsQuery.data?.items[0] ??
    null

  useEffect(() => {
    setDisplayCurrency(activeHousehold?.currency)
  }, [activeHousehold?.currency])

  return {
    activeHousehold,
    activeHouseholdId: activeHousehold?.id ?? null,
    households: householdsQuery.data?.items ?? [],
    ...householdsQuery,
  }
}
