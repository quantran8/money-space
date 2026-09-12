import { googleCallback } from '#/features/auth/api/auth.repository'
import { useAuthStore } from '#/shared/stores/auth-store'

type Translate = (key: string, params?: Record<string, unknown>) => string

export type GoogleCallbackParams = {
  code: string | null
  state: string | null
  error: string | null
}

/** Pull the OAuth result off a callback URL. Native reads it from a returned
 * URL string; the web reads the same names off its own query. */
export function readGoogleCallbackParams(callbackUrl: string): GoogleCallbackParams {
  const query = new URL(callbackUrl).searchParams
  return {
    code: query.get('code'),
    state: query.get('state'),
    error: query.get('error_description') ?? query.get('error'),
  }
}

/**
 * Exchange the OAuth code for a session and store it.
 *
 * `state` is required: without it the backend cannot find the PKCE verifier,
 * so there is nothing to exchange the code against.
 */
export async function exchangeGoogleCode(
  { code, state }: GoogleCallbackParams,
  t: Translate,
) {
  if (!code || !state) throw new Error(t('auth.errors.googleFailed'))
  const result = await googleCallback(code, state)
  if (!result.session) throw new Error(t('auth.errors.googleFailed'))
  useAuthStore.getState().setAuth(result.user, result.session)
  return result
}
