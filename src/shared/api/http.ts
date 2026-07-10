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

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  query?: Record<string, string | number | undefined | null>,
) {
  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

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
