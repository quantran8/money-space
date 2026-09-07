import { apiRequest } from '#/shared/api/http'
import type { AuthResult, AuthUser } from '#/features/auth/model/auth.types'

export type LoginPayload = {
  email: string
  password: string
}

export type SignupPayload = {
  email: string
  password: string
  fullName?: string
}

export function login(payload: LoginPayload) {
  return apiRequest<AuthResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  })
}

export function signup(payload: SignupPayload) {
  return apiRequest<AuthResult>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  })
}

/**
 * Send the recovery email. Resolves the same way whether or not the address has
 * an account — the server will not say, and neither should the UI.
 */
export function requestPasswordReset(email: string, redirectTo?: string) {
  return apiRequest<{ success: true }>('/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify({ email, redirectTo }),
    skipAuth: true,
  })
}

/** Completes a reset with the token carried by the emailed link. */
export function updatePassword(accessToken: string, password: string) {
  return apiRequest<AuthResult>('/auth/password/update', {
    method: 'POST',
    body: JSON.stringify({ accessToken, password }),
    skipAuth: true,
  })
}

/** Returns the Google authorization URL to redirect the browser to. */
export function getGoogleAuthUrl(redirectTo: string) {
  return apiRequest<{ url: string }>(
    '/auth/google',
    { method: 'GET', skipAuth: true },
    { redirectTo },
  )
}

/**
 * Exchange the OAuth `code` (from the redirect) for a session. `state` is what
 * lets the backend find the PKCE verifier it minted when the URL was built.
 */
export function googleCallback(code: string, state: string) {
  return apiRequest<AuthResult>('/auth/google/callback', {
    method: 'POST',
    body: JSON.stringify({ code, state }),
    skipAuth: true,
  })
}

export function refresh(refreshToken: string) {
  return apiRequest<AuthResult>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    skipAuth: true,
    skipRefresh: true,
  })
}

export function logout() {
  return apiRequest<{ success: true }>('/auth/logout', { method: 'POST' })
}

export function getCurrentUser() {
  return apiRequest<AuthUser>('/auth/me', { method: 'GET' })
}
