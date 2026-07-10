import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useSession } from '@/features/auth/hooks/use-session'

/**
 * Gate for authenticated routes. Redirects to /auth when there is no session.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useSession()

  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/auth" replace />

  return <>{children}</>
}
