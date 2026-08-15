import { refresh as refreshRequest } from '@/features/auth/api/auth.repository'
import { configureAuthBridge } from '@/shared/api/http'
import {
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpiring,
  useAuthStore,
} from '@/shared/stores/auth-store'

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

/**
 * The token to send with the next request, refreshed first if it has expired
 * (or is about to).
 *
 * This is the *proactive* half of token handling; the 401 retry in `http.ts`
 * stays as the fallback for a token the server rejects for some other reason.
 * Without it, the first request after the token aged out always burned three
 * serial round-trips — 401, refresh, retry — before the page could start
 * loading, and every parallel request on that page waited behind it.
 *
 * Concurrent callers share `silentRefresh`'s in-flight promise, so a page that
 * fires a dozen requests at once still refreshes exactly once.
 */
async function ensureFreshToken(): Promise<string | null> {
  if (isAccessTokenExpiring()) {
    await silentRefresh()
  }
  return getAccessToken()
}

/** Wire the HTTP client to the auth store. Call once at app startup. */
export function installAuthBridge() {
  configureAuthBridge({
    getToken: getAccessToken,
    ensureFreshToken,
    refresh: silentRefresh,
    onAuthLost: () => useAuthStore.getState().clearAuth(),
  })
}
