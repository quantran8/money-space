import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

import type { DashboardWidgetItem } from '#/features/dashboard/model/dashboard-layout'
import { apiRequest } from '#/shared/api/http'
import { queryKeys } from '#/shared/api/query-keys'
import { useAuthStore } from '#/shared/stores/auth-store'
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
  config?: { dashboardLayout?: DashboardWidgetItem[] }
}

/** Free spaces this account created, against its ceiling. See memory/billing.md. */
export type SpaceQuota = { used: number; limit: number }

export type HouseholdListResponse = {
  items: HouseholdSummary[]
  total: number
  spaceQuota?: SpaceQuota
}

export function useActiveHousehold() {
  const activeHouseholdId = useAppStore((state) => state.activeHouseholdId)
  const setActiveHouseholdId = useAppStore((state) => state.setActiveHouseholdId)
  const userId = useAuthStore((state) => state.user?.id)
  const lastId = useAppStore((state) => (userId ? state.lastByUser[userId] : undefined))

  const householdsQuery = useQuery({
    queryKey: queryKeys.households,
    queryFn: () => apiRequest<HouseholdListResponse>('/households'),
  })

  const items = householdsQuery.data?.items

  /**
   * Picks a space, and heals a stored id that no longer names one.
   *
   * Two cases, deliberately one effect: nothing stored yet, and a stored id
   * that has stopped being a membership — the space was deleted, this member
   * was removed from it, or it belongs to a DIFFERENT user who signed in on
   * this device. Both end the same way: the user's last-picked space, else the oldest, the list being
   * `createdAt: asc`.
   *
   * An empty list is left alone. Nobody-has-a-space is `RequireHousehold`'s
   * question, and writing `null` here would fight the leave flow, which sets
   * `null` on purpose.
   */
  useEffect(() => {
    if (!items?.length) return
    if (activeHouseholdId && items.some((item) => item.id === activeHouseholdId)) return
    const remembered = items.find((item) => item.id === lastId)
    setActiveHouseholdId((remembered ?? items[0]).id)
  }, [activeHouseholdId, items, lastId, setActiveHouseholdId])

  /**
   * Strict: the stored id, or nothing.
   *
   * A `?? items[0]` fallback used to fill the gap between switching to another
   * space and its row reaching this list. During it the hook answered with the
   * OLDEST space while the store named the new one, so every consumer keyed its
   * queries to the space the user had just left — and `useSettingsPage` could
   * hold one space's name in a form whose submit posted to another. `null` is
   * the honest answer for that render; the effect above is what turns a
   * genuinely stale id into a valid one.
   */
  const activeHousehold = items?.find((item) => item.id === activeHouseholdId) ?? null

  useEffect(() => {
    setDisplayCurrency(activeHousehold?.currency)
  }, [activeHousehold?.currency])

  return {
    activeHousehold,
    activeHouseholdId: activeHousehold?.id ?? null,
    households: items ?? [],
    spaceQuota: householdsQuery.data?.spaceQuota ?? null,
    ...householdsQuery,
  }
}
