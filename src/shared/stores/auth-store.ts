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
