import { refresh as refreshRequest } from '@/features/auth/api/auth.repository'
import { configureAuthBridge } from '@/shared/api/http'
import { getAccessToken, getRefreshToken, useAuthStore } from '@/shared/stores/auth-store'

let inFlightRefresh: Promise<boolean> | null = null

/**
 * Attempt a single silent token refresh. Concurrent 401s share one in-flight
 * refresh so we don't fire multiple refresh calls at once.
 */
async function silentRefresh(): Promise<boolean> {
  if (inFlightRefresh) return inFlightRefresh

  inFlightRefresh = (async () => {
    const token = getRefreshToken()
    if (!token) return false
    try {
      const result = await refreshRequest(token)
      if (!result.session) return false
      useAuthStore.getState().setAuth(result.user, result.session)
      return true
    } catch {
      return false
    } finally {
      inFlightRefresh = null
    }
  })()

  return inFlightRefresh
}

/** Wire the HTTP client to the auth store. Call once at app startup. */
export function installAuthBridge() {
  configureAuthBridge({
    getToken: getAccessToken,
    refresh: silentRefresh,
    onAuthLost: () => useAuthStore.getState().clearAuth(),
  })
}
