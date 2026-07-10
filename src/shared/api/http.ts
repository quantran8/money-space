import { env } from '@/shared/api/env'

type ApiEnvelope<T> = {
  data: T
  message: string
  path: string
  statusCode: number
  success: true
  timestamp: string
}

export class ApiError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}

export type ApiRequestInit = RequestInit & {
  /** Do not attach the Authorization header (used by the auth endpoints themselves). */
  skipAuth?: boolean
  /** Do not attempt a token refresh on 401 (used by the refresh endpoint itself). */
  skipRefresh?: boolean
}

/**
 * Injected by the auth layer to avoid a circular import between the HTTP client
 * and the auth store / repository. `getToken` returns the current access token;
 * `refresh` attempts a silent token refresh and returns true on success.
 */
type AuthBridge = {
  getToken: () => string | null
  refresh: () => Promise<boolean>
  onAuthLost: () => void
}

let authBridge: AuthBridge | null = null

export function configureAuthBridge(bridge: AuthBridge) {
  authBridge = bridge
}

function buildUrl(path: string, query?: Record<string, string | number | undefined | null>) {
  const url = new URL(path, env.apiBaseUrl)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function performFetch(url: string, init: ApiRequestInit | undefined, token: string | null) {
  return fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })
}

export async function apiRequest<T>(
  path: string,
  init?: ApiRequestInit,
  query?: Record<string, string | number | undefined | null>,
) {
  const url = buildUrl(path, query)
  const useAuth = !init?.skipAuth

  let token = useAuth ? (authBridge?.getToken() ?? null) : null
  let response = await performFetch(url, init, token)

  // On 401, attempt a single silent refresh, then retry once.
  if (response.status === 401 && useAuth && !init?.skipRefresh && authBridge) {
    const refreshed = await authBridge.refresh()
    if (refreshed) {
      token = authBridge.getToken()
      response = await performFetch(url, init, token)
    } else {
      authBridge.onAuthLost()
    }
  }

  const raw = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | { message?: string }
    | null

  if (!response.ok) {
    throw new ApiError(
      typeof raw?.message === 'string' ? raw.message : 'API request failed',
      response.status,
    )
  }

  return (raw as ApiEnvelope<T>).data
}
