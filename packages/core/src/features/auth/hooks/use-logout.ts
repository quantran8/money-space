import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '#/shared/navigation'

import { logout as logoutRequest } from '#/features/auth/api/auth.repository'
import { useAppStore } from '#/shared/stores/household-store'
import { useAuthStore } from '#/shared/stores/auth-store'

/** Signs the user out: revokes the session on the backend, clears local state, redirects to /auth. */
export function useLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clearAuth = useAuthStore((state) => state.clearAuth)

  return async function logout() {
    // Best-effort server revoke; clear locally regardless of the outcome.
    await logoutRequest().catch(() => undefined)
    clearAuth()
    // The active space is persisted, and it is a MEMBERSHIP rather than a
    // preference. Left behind, the next person to sign in on this device starts
    // pointed at a space they may not belong to — `useActiveHousehold` heals
    // that on the first list response, but not before a render's worth of
    // requests have gone out under someone else's id.
    useAppStore.getState().setActiveHouseholdId(null)
    queryClient.clear()
    navigate('/auth', { replace: true })
  }
}
