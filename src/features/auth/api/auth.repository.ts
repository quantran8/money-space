import { apiRequest } from '@/shared/api/http'
import type { AuthResult, AuthUser } from '@/features/auth/model/auth.types'

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
  return apiRequest<AuthResult>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  })
}

export function signup(payload: SignupPayload) {
  return apiRequest<AuthResult>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  })
}

/** Returns the Google authorization URL to redirect the browser to. */
export function getGoogleAuthUrl(redirectTo: string) {
  return apiRequest<{ url: string }>(
    '/api/auth/google',
    { method: 'GET', skipAuth: true },
    { redirectTo },
  )
}

/** Exchange the OAuth `code` (from the redirect) for a session. */
export function googleCallback(code: string) {
  return apiRequest<AuthResult>('/api/auth/google/callback', {
    method: 'POST',
    body: JSON.stringify({ code }),
    skipAuth: true,
  })
}

export function refresh(refreshToken: string) {
  return apiRequest<AuthResult>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    skipAuth: true,
    skipRefresh: true,
  })
}

export function logout() {
  return apiRequest<{ success: true }>('/api/auth/logout', { method: 'POST' })
}

export function getCurrentUser() {
  return apiRequest<AuthUser>('/api/auth/me', { method: 'GET' })
}
