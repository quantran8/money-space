import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useMyHouseholds } from '@/features/onboarding/hooks/use-my-households'

/**
 * Gate for the main app: an authenticated user with no household is sent to
 * /onboarding to create their first one. Assumes an auth gate runs above it.
 */
export function RequireHousehold({ children }: { children: ReactNode }) {
  const { data, isLoading, isError } = useMyHouseholds()

  // While loading, render nothing to avoid a flash of the wrong screen.
  if (isLoading) return null
  // On error, let the app render so the user sees the real failure, not a redirect loop.
  if (!isError && data && data.total === 0) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
