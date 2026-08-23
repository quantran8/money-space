import { create } from 'zustand'

import { storage } from '#/shared/storage'

import type { AuthSession, AuthUser } from '#/features/auth/model/auth.types'

const STORAGE_KEY = 'money-space-auth'

type PersistedAuth = {
  user: AuthUser
  session: AuthSession
}

function parsePersisted(raw: string | null): PersistedAuth | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as PersistedAuth
    if (!parsed?.session?.accessToken) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Writes are fire-and-forget: nothing in the app awaits them, and a failed
 * write must not break a sign-in that already succeeded in memory.
 */
function persist(value: PersistedAuth | null) {
  if (value) {
    void storage.setItem(STORAGE_KEY, JSON.stringify(value)).catch(() => {})
  } else {
    void storage.removeItem(STORAGE_KEY).catch(() => {})
  }
}

type AuthState = {
  user: AuthUser | null
  session: AuthSession | null
  /**
   * Whether the initial persisted-session read has completed.
   *
   * Starts `false` and every auth gate must wait on it. On the web the read
   * settles within the first tick; on native it is a real round trip to
   * SecureStore, and a gate that did not wait would redirect a signed-in user
   * to the login screen on every cold start.
   */
  hydrated: boolean
  setAuth: (user: AuthUser, session: AuthSession) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  hydrated: false,
  setAuth: (user, session) => {
    persist({ user, session })
    set({ user, session })
  },
  clearAuth: () => {
    persist(null)
    set({ user: null, session: null })
  },
}))

let hydration: Promise<void> | null = null

/**
 * Read the persisted session into the store. Idempotent and safe to call from
 * several places at once — concurrent callers share one read.
 *
 * A session written while this was in flight wins: the store is only filled if
 * it is still empty, so a fast sign-in is never clobbered by a slow disk read.
 */
export function hydrateAuth(): Promise<void> {
  if (hydration) return hydration
  hydration = (async () => {
    try {
      const persisted = parsePersisted(await storage.getItem(STORAGE_KEY))
      if (persisted && useAuthStore.getState().session === null) {
        useAuthStore.setState({ user: persisted.user, session: persisted.session })
      }
    } catch {
      // An unreadable store is the same as an empty one: start signed out.
    } finally {
      useAuthStore.setState({ hydrated: true })
    }
  })()
  return hydration
}

/** Non-reactive access to the current access token (for the HTTP layer). */
export function getAccessToken(): string | null {
  return useAuthStore.getState().session?.accessToken ?? null
}

/** Non-reactive access to the current refresh token (for the HTTP layer). */
export function getRefreshToken(): string | null {
  return useAuthStore.getState().session?.refreshToken ?? null
}

/**
 * Treat a token as expired this many seconds before it actually is, so a
 * request that is about to be sent doesn't expire in flight (clock skew plus
 * the round-trip itself).
 */
const EXPIRY_SKEW_SECONDS = 60

/**
 * Whether the persisted access token is expired, or close enough that it
 * should be refreshed before the next request.
 *
 * The session is restored from storage on boot with no regard for age, so
 * without this check the first request of every session-after-an-hour was a
 * guaranteed 401 → refresh → retry — three serial round-trips in front of the
 * whole page. `expiresAt` is Unix seconds, as Supabase issues it; a session
 * without one is assumed usable and left to the 401 fallback.
 */
export function isAccessTokenExpiring(): boolean {
  const session = useAuthStore.getState().session
  if (!session) return false
  if (session.expiresAt === null) return false
  return Date.now() / 1000 >= session.expiresAt - EXPIRY_SKEW_SECONDS
}
