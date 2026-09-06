import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useMyHouseholds } from '@money-space/core/features/onboarding/hooks/use-my-households'

/**
 * The mirror of `RequireHousehold`, guarding `/onboarding`.
 *
 * Onboarding asks the one question the app cannot start without — create a
 * space or join one — so it is a dead end **by design**: someone who has just
 * left their only household stays here until they answer it. There is no link
 * back into the app, because there is no app to go back to. Signing out is the
 * only other way off this screen, and the header holds it.
 *
 * What this gate adds is the opposite case: someone who DOES have a household
 * and reaches `/onboarding` anyway — a stale tab, a bookmark, the browser's
 * back button after joining — is sent into the app rather than being asked to
 * create a second space they did not want.
 *
 * It reads the same query as `RequireHousehold` and treats it the same way:
 * render nothing while loading (a flash of the wrong screen here is a flash of
 * "create a household" at someone who has one), and on error let the screen
 * render so the failure is visible instead of becoming a redirect loop.
 */
export function RequireNoHousehold({ children }: { children: ReactNode }) {
  const { data, isLoading, isError } = useMyHouseholds()

  if (isLoading) return null
  if (!isError && data && data.total > 0) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
