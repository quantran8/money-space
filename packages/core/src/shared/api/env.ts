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
  /**
   * Which client this is. Attached to a feedback report so a bug can be
   * reproduced on the platform it happened on.
   */
  platform: 'web' | 'ios' | 'android' | 'unknown'
  /** The host app's version. '0.0.0' until the apps start stamping a real one. */
  appVersion: string
}

const config: EnvConfig = {
  apiBaseUrl: DEFAULT_API_BASE_URL,
  platform: 'unknown',
  appVersion: '0.0.0',
}

/**
 * Set the API base URL, and what the host app is. An empty or whitespace-only
 * value is ignored so a missing env var falls back to the default rather than
 * producing a broken relative URL — or, for the other two, a blank string in a
 * bug report.
 */
export function configureEnv(next: {
  apiBaseUrl?: string | null
  platform?: EnvConfig['platform'] | null
  appVersion?: string | null
}) {
  const apiBaseUrl = next.apiBaseUrl?.trim()
  if (apiBaseUrl) config.apiBaseUrl = apiBaseUrl
  if (next.platform) config.platform = next.platform
  const appVersion = next.appVersion?.trim()
  if (appVersion) config.appVersion = appVersion
}

/**
 * Read as `env.apiBaseUrl` at call time, never destructured at module scope —
 * the value is not known until the host has configured it.
 */
export const env = config
