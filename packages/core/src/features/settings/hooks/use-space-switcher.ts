import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '#/shared/api/query-keys'
import {
  useActiveHousehold,
  type HouseholdSummary,
} from '#/shared/hooks/use-active-household'
import { useAppStore } from '#/shared/stores/household-store'
import { useWhatIfStore } from '#/shared/stores/whatif-store'

export type SpaceSwitcher = {
  /** Every space this account belongs to, oldest first — the backend's order. */
  spaces: HouseholdSummary[]
  activeSpaceId: string | null
  activeSpace: HouseholdSummary | null
  /** False for the one-space household, which is most of them. */
  canSwitch: boolean
  isLoading: boolean
  switchTo: (householdId: string) => void
}

/**
 * Moving between spaces.
 *
 * A membership is many-to-many on the server and always has been: the access
 * guard resolves `(householdId, userId)` per request and the token carries no
 * space at all, so every space a member belongs to stays reachable. This hook
 * is the client side of that — the one deliberate write to `activeHouseholdId`,
 * plus the piece of global state that is scoped to a space without living in
 * the query cache.
 *
 * ## Why nothing is evicted
 *
 * Every household-scoped key is `['households', id, …]`, so a switch changes
 * every key in play: the new space's entries are served or fetched, the old
 * space's sit untouched and make switching back instant. Evicting them would
 * buy nothing and cost a full refetch on the return trip.
 *
 * It would also be easy to get catastrophically wrong. `queryKeys.households`
 * is `['households']` — a PREFIX of every household-scoped key — and TanStack
 * matches prefixes, so any non-exact call against it sweeps the whole cache
 * rather than the list. Hence the one call here is `exact`.
 */
export function useSpaceSwitcher(): SpaceSwitcher {
  const queryClient = useQueryClient()
  const setActiveHouseholdId = useAppStore((state) => state.setActiveHouseholdId)
  const { households, activeHousehold, activeHouseholdId, isLoading } = useActiveHousehold()

  const switchTo = useCallback(
    (householdId: string) => {
      if (householdId === activeHouseholdId) return
      // Only ever activate an id the server has already confirmed as a
      // membership: `useActiveHousehold` answers `null` for anything else,
      // which would blank the app until its healing effect fired.
      if (!households.some((item) => item.id === householdId)) return

      /**
       * The what-if sheet is mounted once in the shell and outlives everything,
       * including the remount a switch triggers. Its prefill carries a `goalId`
       * belonging to the space being left, while `useWhatIf` posts to the
       * ACTIVE space — so a sheet left open across a switch would send one
       * space's goal to another space's endpoint.
       *
       * Closed rather than cleared: `close` is the store's own exit, and the
       * next `openWhatIf` replaces `prefill` wholesale, so nothing survives to
       * leak. Read imperatively because this reacts to an event; subscribing
       * would re-render every switcher whenever the sheet opened.
       */
      useWhatIfStore.getState().close()

      setActiveHouseholdId(householdId)

      // EXACT. Refresh the list itself so a name or currency changed on another
      // device is current the moment its space opens — this is the one key a
      // switch does not change, so nothing else would refetch it. Without
      // `exact` this line would invalidate every space's every query instead.
      void queryClient.invalidateQueries({ queryKey: queryKeys.households, exact: true })
    },
    [activeHouseholdId, households, queryClient, setActiveHouseholdId],
  )

  return {
    spaces: households,
    activeSpaceId: activeHouseholdId,
    activeSpace: activeHousehold,
    // A picker holding one option is a control that cannot do anything, and it
    // would sit above the panel naming the space it cannot change. The
    // platforms render nothing rather than a dead row.
    canSwitch: households.length > 1,
    isLoading,
    switchTo,
  }
}
