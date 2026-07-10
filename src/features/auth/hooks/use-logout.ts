import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { logout as logoutRequest } from '@/features/auth/api/auth.repository'
import { useAuthStore } from '@/shared/stores/auth-store'

/** Signs the user out: revokes the session on the backend, clears local state, redirects to /auth. */
export function useLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clearAuth = useAuthStore((state) => state.clearAuth)

  return async function logout() {
    // Best-effort server revoke; clear locally regardless of the outcome.
    await logoutRequest().catch(() => undefined)
    clearAuth()
    queryClient.clear()
    navigate('/auth', { replace: true })
  }
}
