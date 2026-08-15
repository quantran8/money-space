import { create } from 'zustand'

import type { AuthSession, AuthUser } from '@/features/auth/model/auth.types'

const STORAGE_KEY = 'money-space-auth'

type PersistedAuth = {
  user: AuthUser
  session: AuthSession
}

function loadPersisted(): PersistedAuth | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedAuth
    if (!parsed?.session?.accessToken) return null
    return parsed
  } catch {
    return null
  }
}

function persist(value: PersistedAuth | null) {
  if (typeof window === 'undefined') return
  if (value) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } else {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

type AuthState = {
  user: AuthUser | null
  session: AuthSession | null
  /** Whether the initial persisted-session read has completed. */
  hydrated: boolean
  setAuth: (user: AuthUser, session: AuthSession) => void
  clearAuth: () => void
}

const persisted = loadPersisted()

export const useAuthStore = create<AuthState>((set) => ({
  user: persisted?.user ?? null,
  session: persisted?.session ?? null,
  hydrated: true,
  setAuth: (user, session) => {
    persist({ user, session })
    set({ user, session })
  },
  clearAuth: () => {
    persist(null)
    set({ user: null, session: null })
  },
}))

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
 * The session is restored from localStorage on boot with no regard for age, so
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
