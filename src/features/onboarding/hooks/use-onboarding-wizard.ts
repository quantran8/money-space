import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { queryKeys } from '@/shared/api/query-keys'
import {
  ONBOARDING_STEPS,
  useAppStore,
  type OnboardingStep,
} from '@/shared/stores/household-store'

/**
 * Drives the 10-screen onboarding wizard.
 *
 * The step lives in the persisted household store, not local state, so closing
 * the tab mid-setup resumes where the user left off. `activeHouseholdId` is set
 * by the first screen; every later screen writes through the normal feature
 * slices, so nothing here duplicates their logic.
 */
export function useOnboardingWizard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const step = useAppStore((state) => state.onboardingStep)
  const setStep = useAppStore((state) => state.setOnboardingStep)
  const advance = useAppStore((state) => state.advanceOnboarding)
  const goBack = useAppStore((state) => state.goBackOnboarding)
  const activeHouseholdId = useAppStore((state) => state.activeHouseholdId)

  // A user who lands here with no step recorded starts at the beginning.
  const currentStep: OnboardingStep = step ?? 'household'
  const index = ONBOARDING_STEPS.indexOf(currentStep)

  async function finish() {
    setStep(null)
    if (activeHouseholdId) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.households })
    }
    navigate('/', { replace: true })
  }

  return {
    step: currentStep,
    stepIndex: index,
    stepCount: ONBOARDING_STEPS.length,
    isFirstStep: index === 0,
    isLastStep: index === ONBOARDING_STEPS.length - 1,
    activeHouseholdId,
    setStep,
    advance,
    goBack,
    finish,
    /** Steps after the first need a household to write against. */
    canProceed: currentStep === 'household' || !!activeHouseholdId,
  }
}
