import { create } from 'zustand'

/**
 * Where the user opened the what-if from. Used to prefill sensibly and to tag
 * the analytics event — never to change the calculation.
 */
export type WhatIfSource = 'home' | 'upcoming' | 'goal' | 'goal-detail' | 'onboarding' | 'other'

export type WhatIfPrefill = {
  amount?: number
  plannedDate?: string
  goalId?: string
  source?: WhatIfSource
}

type WhatIfState = {
  open: boolean
  prefill: WhatIfPrefill
  /**
   * Open the global what-if sheet. Spec v3.1: what-if is a contextual action
   * available from anywhere, deliberately NOT a nav tab — so it lives in a
   * store with a single sheet mounted in AppShell rather than on a route.
   */
  openWhatIf: (prefill?: WhatIfPrefill) => void
  close: () => void
}

export const useWhatIfStore = create<WhatIfState>((set) => ({
  open: false,
  prefill: {},
  openWhatIf: (prefill = {}) => set({ open: true, prefill }),
  close: () => set({ open: false }),
}))
