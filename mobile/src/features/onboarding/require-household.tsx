import { Redirect } from 'expo-router'

import { useMyHouseholds } from '@money-space/core/features/onboarding/hooks/use-my-households'

import type { ReactNode } from 'react'

/**
 * Gate for the main app: an authenticated user with no household is sent to
 * onboarding to create one or join one. Assumes an auth gate runs above it.
 */
export function RequireHousehold({ children }: { children: ReactNode }) {
  const { data, isLoading, isError } = useMyHouseholds()

  // Render nothing while loading, to avoid a flash of the wrong screen.
  if (isLoading) return null
  // On error let the app through, so the user sees the real failure rather than
  // a redirect loop between here and onboarding.
  if (!isError && data && data.total === 0) {
    return <Redirect href="/onboarding" />
  }

  return <>{children}</>
}
