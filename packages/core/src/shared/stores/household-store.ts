import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { storage } from '#/shared/storage'

type AppState = {
  activeHouseholdId: string | null
  setActiveHouseholdId: (householdId: string | null) => void
}

/**
 * The active household, and nothing else.
 *
 * This used to also drive a nine-screen onboarding wizard (`onboardingStep`,
 * `ONBOARDING_STEPS`, advance/goBack). Onboarding is now a single choice —
 * create a household, or join one by link or QR — so there is no step to
 * remember: both branches finish in one screen and hand off to the app. The
 * wizard's steps were setup for features that each already own their own entry
 * point, and keeping a resumable position through them meant a user who closed
 * the tab was pinned back into setup instead of being let into the app.
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeHouseholdId: null,
      setActiveHouseholdId: (activeHouseholdId) => set({ activeHouseholdId }),
    }),
    {
      name: 'money-space-household',
      /**
       * Route persistence through core's injected adapter rather than
       * zustand's default.
       *
       * The default is `localStorage`, which does not exist in React Native —
       * it resolved to `undefined` and the first write threw
       * `Cannot read property 'setItem' of undefined` before any screen could
       * render. The adapter is already async, which is what `createJSONStorage`
       * expects.
       */
      storage: createJSONStorage(() => storage),
      // Only what must survive a reload. Everything else is derived.
      partialize: (state) => ({ activeHouseholdId: state.activeHouseholdId }),
      /**
       * v2 drops `onboardingStep`. It has to be actively deleted rather than
       * ignored: a stored step used to divert its owner to `/onboarding` on every
       * load, and anyone who was mid-wizard when this shipped would otherwise
       * carry that value forever — pinned to a screen that no longer exists,
       * with the gate that reads it gone and nothing left to clear it.
       */
      version: 2,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<AppState> & { onboardingStep?: unknown }
        return { activeHouseholdId: state.activeHouseholdId ?? null } as AppState
      },
    },
  ),
)
