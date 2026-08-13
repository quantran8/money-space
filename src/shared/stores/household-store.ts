import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Onboarding is 12 spec steps folded into 10 screens (04 §onboarding).
 *
 * The step is **persisted** alongside the household id so a user who closes the
 * tab mid-setup resumes where they were rather than starting over — the wizard
 * asks for a lot, and losing it once is enough to lose the user.
 */
export type OnboardingStep =
  | 'household'
  | 'financial_mode'
  | 'invite'
  | 'money_sources'
  | 'reserve'
  | 'recurring_income'
  | 'obligations'
  | 'main_goal'
  | 'first_picture'
  | 'first_whatif'

export const ONBOARDING_STEPS: OnboardingStep[] = [
  'household',
  'financial_mode',
  'invite',
  'money_sources',
  'reserve',
  'recurring_income',
  'obligations',
  'main_goal',
  'first_picture',
  'first_whatif',
]

type AppState = {
  activeHouseholdId: string | null
  setActiveHouseholdId: (householdId: string | null) => void
  /** Where the user got to. `null` once onboarding is finished. */
  onboardingStep: OnboardingStep | null
  setOnboardingStep: (step: OnboardingStep | null) => void
  advanceOnboarding: () => void
  goBackOnboarding: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeHouseholdId: null,
      setActiveHouseholdId: (activeHouseholdId) => set({ activeHouseholdId }),

      onboardingStep: null,
      setOnboardingStep: (onboardingStep) => set({ onboardingStep }),

      advanceOnboarding: () => {
        const current = get().onboardingStep
        if (!current) return
        const next = ONBOARDING_STEPS[ONBOARDING_STEPS.indexOf(current) + 1]
        // Past the last screen means done — clear it rather than pinning the
        // user on the final step forever.
        set({ onboardingStep: next ?? null })
      },

      goBackOnboarding: () => {
        const current = get().onboardingStep
        if (!current) return
        const index = ONBOARDING_STEPS.indexOf(current)
        if (index <= 0) return
        set({ onboardingStep: ONBOARDING_STEPS[index - 1] })
      },
    }),
    {
      name: 'money-space-household',
      // Only what must survive a reload. Everything else is derived.
      partialize: (state) => ({
        activeHouseholdId: state.activeHouseholdId,
        onboardingStep: state.onboardingStep,
      }),
    },
  ),
)
