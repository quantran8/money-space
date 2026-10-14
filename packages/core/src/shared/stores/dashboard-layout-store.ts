import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import {
  sanitizeDashboardLayout,
  type DashboardWidgetItem,
} from '#/features/dashboard/model/dashboard-layout'
import { storage } from '#/shared/storage'

type State = {
  /** This device's own Home layout per household; overrides the shared one. */
  localByHousehold: Record<string, DashboardWidgetItem[]>
  setLocal: (householdId: string, layout: DashboardWidgetItem[]) => void
  clearLocal: (householdId: string) => void
}

export const useDashboardLayoutStore = create<State>()(
  persist(
    (set) => ({
      localByHousehold: {},
      setLocal: (hid, layout) =>
        set((s) => ({ localByHousehold: { ...s.localByHousehold, [hid]: layout } })),
      clearLocal: (hid) =>
        set((s) => {
          const { [hid]: _dropped, ...rest } = s.localByHousehold
          return { localByHousehold: rest }
        }),
    }),
    {
      name: 'money-space-dashboard-layout',
      // Hydrated on first use: at import time the host's storage may not be configured yet.
      skipHydration: true,
      storage: createJSONStorage(() => storage),
      partialize: (s) => ({ localByHousehold: s.localByHousehold }),
      merge: (persisted, current) => {
        const stored = (persisted as Partial<State> | undefined)?.localByHousehold ?? {}
        return {
          ...current,
          localByHousehold: Object.fromEntries(
            Object.entries(stored).map(([k, v]) => [k, sanitizeDashboardLayout(v)]),
          ),
        }
      },
    },
  ),
)
