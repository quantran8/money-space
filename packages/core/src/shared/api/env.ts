/**
 * Runtime configuration, injected by the host app at startup.
 *
 * Core cannot read it itself: the web app has `import.meta.env` (Vite) and the
 * mobile app has `process.env.EXPO_PUBLIC_*` (Expo), and neither expression is
 * valid in the other's bundler. So the host calls `configureEnv` before the
 * first request — the same injection shape `configureAuthBridge` already uses
 * for the auth layer.
 */

const DEFAULT_API_BASE_URL = 'http://localhost:3000'

type EnvConfig = {
  apiBaseUrl: string
}

const config: EnvConfig = {
  apiBaseUrl: DEFAULT_API_BASE_URL,
}

/**
 * Set the API base URL. An empty or whitespace-only value is ignored so a
 * missing env var falls back to localhost rather than producing a broken
 * relative URL.
 */
export function configureEnv(next: { apiBaseUrl?: string | null }) {
  const apiBaseUrl = next.apiBaseUrl?.trim()
  if (apiBaseUrl) config.apiBaseUrl = apiBaseUrl
}

/**
 * Read as `env.apiBaseUrl` at call time, never destructured at module scope —
 * the value is not known until the host has configured it.
 */
export const env = config
