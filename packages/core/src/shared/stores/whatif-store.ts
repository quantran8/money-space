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
   * Open the global what-if sheet. The sidebar is its single entry point, and
   * the sheet stays mounted once in AppShell rather than living on a route.
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
