import { useAuthStore } from '@/shared/stores/auth-store'

type SessionState = {
  user: ReturnType<typeof useAuthStore.getState>['user']
  isAuthenticated: boolean
  isLoading: boolean
}

/**
 * Reads the current auth session from the store. The session is hydrated
 * synchronously from localStorage on store creation, so there is no async
 * loading window; `isLoading` stays false unless hydration is pending.
 */
export function useSession(): SessionState {
  const user = useAuthStore((state) => state.user)
  const session = useAuthStore((state) => state.session)
  const hydrated = useAuthStore((state) => state.hydrated)

  return {
    user,
    isAuthenticated: session !== null,
    isLoading: !hydrated,
  }
}
