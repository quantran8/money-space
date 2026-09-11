import { env } from '#/shared/api/env'

type ApiEnvelope<T> = {
  data: T
  message: string
  path: string
  statusCode: number
  success: true
  timestamp: string
}

/**
 * The `premium` block a 402 carries: which limit was hit, and what the current
 * plan allows.
 *
 * Forwarded onto the error because a status code alone cannot say which paywall
 * to open, and parsing `message` for it would make a copy string load-bearing.
 */
export type PremiumErrorMeta = {
  reason: string
  currentTier: 'free' | 'premium'
  status: 'active' | 'expired'
  limits?: Record<string, unknown>
  /** Present on counted quotas: what the ceiling is and how much is used. */
  limit?: number
  used?: number
}

/**
 * `message` is a DIAGNOSTIC, never copy — it holds the server's own words, which
 * may be English, carry an id, or quote Prisma. What the user reads comes from
 * `getErrorMessage`. `code` is the machine-readable reason, when the server
 * sends one. See memory/error-handling.md.
 */
export class ApiError extends Error {
  statusCode: number
  /** Stable reason a client may branch on, e.g. `asset_in_use`. */
  code?: string
  /** Only on a 402. */
  premium?: PremiumErrorMeta

  constructor(
    message: string,
    statusCode: number,
    premium?: PremiumErrorMeta,
    code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.premium = premium
    this.code = code
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
  /**
   * The token to send, refreshed first if it has already expired. Concurrent
   * callers share one refresh.
   */
  ensureFreshToken: () => Promise<string | null>
  refresh: () => Promise<boolean>
  onAuthLost: () => void
}

let authBridge: AuthBridge | null = null

export function configureAuthBridge(bridge: AuthBridge) {
  authBridge = bridge
}

/**
 * The versioned API root. Repositories pass version-free paths
 * (`/households/:id/debts`) and the prefix is applied here, so moving to a
 * future v2 is one edit rather than one per call site.
 */
const API_PREFIX = '/api/v1'

function buildUrl(path: string, query?: Record<string, string | number | undefined | null>) {
  const url = new URL(`${API_PREFIX}${path}`, env.apiBaseUrl)
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

  // Refresh up front when the stored token has already aged out, rather than
  // spending a 401 to discover it. The retry below still covers a token the
  // server rejects for any other reason.
  let token = useAuth ? ((await authBridge?.ensureFreshToken()) ?? null) : null
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
    | { message?: string; code?: string; premium?: PremiumErrorMeta }
    | null

  if (!response.ok) {
    const failure = raw as {
      message?: string
      code?: string
      premium?: PremiumErrorMeta
    } | null

    throw new ApiError(
      typeof failure?.message === 'string' ? failure.message : 'API request failed',
      response.status,
      failure?.premium,
      failure?.code,
    )
  }

  return (raw as ApiEnvelope<T>).data
}

export type ApiFile = {
  blob: Blob
  /** From `Content-Disposition`, so the server names the download. */
  filename: string
}

/**
 * Fetch a file rather than an envelope.
 *
 * A sibling of `apiRequest` and not a flag on it: that function's whole
 * contract is "parse JSON, unwrap `data`, throw on failure", and a download has
 * none of those. What IS shared is the part worth sharing — the auth header,
 * the up-front refresh, and the single 401 retry.
 *
 * The error path still parses JSON: a failure is an ordinary API error (a 402
 * from the premium guard, most usefully), not a file.
 */
export async function apiFileRequest(
  path: string,
  query?: Record<string, string | number | undefined | null>,
): Promise<ApiFile> {
  const url = buildUrl(path, query)

  let token = (await authBridge?.ensureFreshToken()) ?? null
  let response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (response.status === 401 && authBridge) {
    const refreshed = await authBridge.refresh()
    if (refreshed) {
      token = authBridge.getToken()
      response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    } else {
      authBridge.onAuthLost()
    }
  }

  if (!response.ok) {
    const raw = (await response.json().catch(() => null)) as {
      message?: string
      code?: string
      premium?: PremiumErrorMeta
    } | null

    throw new ApiError(
      typeof raw?.message === 'string' ? raw.message : 'API request failed',
      response.status,
      raw?.premium,
      raw?.code,
    )
  }

  return {
    blob: await response.blob(),
    filename: filenameFromDisposition(response.headers.get('Content-Disposition')),
  }
}

/** `attachment; filename="oursight-….csv"` → the filename, or '' if absent. */
function filenameFromDisposition(header: string | null): string {
  if (!header) return ''
  return /filename="?([^";]+)"?/.exec(header)?.[1]?.trim() ?? ''
}
