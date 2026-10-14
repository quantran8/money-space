import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  DEFAULT_DASHBOARD_LAYOUT,
  sanitizeDashboardLayout,
  type DashboardWidgetItem,
} from '#/features/dashboard/model/dashboard-layout'
import { updateHouseholdConfig } from '#/features/settings/api/settings.repository'
import { useDashboardLayoutStore } from '#/shared/stores/dashboard-layout-store'
import { queryKeys } from '#/shared/api/query-keys'
import {
  useActiveHousehold,
  type HouseholdListResponse,
} from '#/shared/hooks/use-active-household'

let hydrated = false

/** Home layout: this device's own choice, else the household's, else the default. */
export function useDashboardLayout() {
  const queryClient = useQueryClient()
  if (!hydrated) {
    hydrated = true
    void useDashboardLayoutStore.persist.rehydrate()
  }
  const { activeHousehold, activeHouseholdId } = useActiveHousehold()
  const local = useDashboardLayoutStore((s) =>
    activeHouseholdId ? s.localByHousehold[activeHouseholdId] : undefined,
  )

  const stored = activeHousehold?.config?.dashboardLayout
  const sharedLayout = stored ? sanitizeDashboardLayout(stored) : DEFAULT_DASHBOARD_LAYOUT
  const layout = local ?? sharedLayout

  const save = useMutation({
    mutationFn: (next: DashboardWidgetItem[] | null) =>
      updateHouseholdConfig(activeHouseholdId!, { dashboardLayout: next }),
    // Show the change at once; the refetch below settles it.
    onMutate: (next) => {
      queryClient.setQueryData<HouseholdListResponse>(
        queryKeys.households,
        (old) =>
          old && {
            ...old,
            items: old.items.map((h) =>
              h.id === activeHouseholdId
                ? { ...h, config: { ...h.config, dashboardLayout: next ?? undefined } }
                : h,
            ),
          },
      )
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.households, exact: true }),
  })

  return {
    layout,
    sharedLayout,
    hasLocal: !!local,
    /** Only this device; the household is untouched. */
    saveLocal: (next: DashboardWidgetItem[]) => {
      if (activeHouseholdId) useDashboardLayoutStore.getState().setLocal(activeHouseholdId, next)
    },
    /** Everyone in the household; drops this device's override so it follows. */
    saveShared: (next: DashboardWidgetItem[]) => {
      if (!activeHouseholdId) return
      useDashboardLayoutStore.getState().clearLocal(activeHouseholdId)
      save.mutate(next)
    },
    /** Back to the shared layout on this device. */
    clearLocal: () => {
      if (activeHouseholdId) useDashboardLayoutStore.getState().clearLocal(activeHouseholdId)
    },
  }
}
