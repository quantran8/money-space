import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useMyHouseholds } from '@/features/onboarding/hooks/use-my-households'
import { useAppStore } from '@/shared/stores/household-store'

/**
 * Gate for the main app: an authenticated user with no household is sent to
 * /onboarding to create their first one. Assumes an auth gate runs above it.
 */
export function RequireHousehold({ children }: { children: ReactNode }) {
  const { data, isLoading, isError } = useMyHouseholds()
  const onboardingStep = useAppStore((state) => state.onboardingStep)

  // While loading, render nothing to avoid a flash of the wrong screen.
  if (isLoading) return null
  // On error, let the app render so the user sees the real failure, not a redirect loop.
  if (!isError && data && data.total === 0) {
    return <Navigate to="/onboarding" replace />
  }

  // A half-finished wizard also belongs back in onboarding. After step 1 the
  // user HAS a household, so the count check above would wave them through and
  // strand the remaining steps.
  if (onboardingStep !== null) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
