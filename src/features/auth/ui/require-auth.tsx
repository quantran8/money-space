import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useSession } from '@/features/auth/hooks/use-session'

/**
 * Gate for authenticated routes. Redirects to /auth when there is no session.
 *
 * The path being blocked is handed to `/auth` as `?next=`, so signing in returns
 * the user to where they were headed instead of the dashboard. This exists for
 * the invite QR: someone scanning `/join?household=…&token=…` on their phone is
 * almost never signed in on that device, and dropping the URL on the way to the
 * login screen would silently discard the invitation.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useSession()
  const location = useLocation()

  if (isLoading) return null
  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/auth?next=${encodeURIComponent(next)}`} replace />
  }

  return <>{children}</>
}
