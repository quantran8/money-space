import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParam } from '#/shared/navigation'
import { notify } from '#/shared/notify'

import { exchangeGoogleCode } from '#/features/auth/model/google-exchange'
import { authHandoffState, resolveNextPath } from '#/features/auth/model/next-path'
import { getErrorMessage } from '#/shared/lib/get-error-message'

/**
 * Handles the Google OAuth redirect: reads `?code`, exchanges it for a session
 * via the backend, stores it, then navigates to `?next` — the route the user was
 * originally headed for, an invite QR's `/join?…` above all — falling back home.
 * On error it goes back to /auth, keeping `next` so the retry still lands right.
 */
export function useGoogleCallback() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const handled = useRef(false)

  // Read at render, not inside the effect: these are hooks and must run in the
  // same order on every pass.
  const codeParam = useSearchParam('code')
  const stateParam = useSearchParam('state')
  const errorDescriptionParam = useSearchParam('error_description')
  const errorParam = useSearchParam('error')
  const nextParam = useSearchParam('next')

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const code = codeParam
    const state = stateParam
    const oauthError = errorDescriptionParam ?? errorParam
    const nextPath = resolveNextPath(nextParam)
    const authPath =
      nextPath === '/' ? '/auth' : `/auth?next=${encodeURIComponent(nextPath)}`

    if (oauthError) {
      // Google's own `error_description` is a diagnostic, not copy.
      notify.error(getErrorMessage(oauthError, t('auth.errors.googleFailed')))
      navigate(authPath, { replace: true })
      return
    }

    // Nothing to exchange without both halves; the backend finds the PKCE
    // verifier by `state`.
    if (!code || !state) {
      navigate(authPath, { replace: true })
      return
    }

    exchangeGoogleCode({ code, state, error: null }, t)
      .then(() => {
        notify.success(t('auth.toast.loginSuccess'))
        navigate(nextPath, { replace: true, state: authHandoffState })
      })
      .catch((cause) => {
        notify.error(getErrorMessage(cause, t('auth.errors.googleFailed')))
        navigate(authPath, { replace: true })
      })
  }, [codeParam, stateParam, errorDescriptionParam, errorParam, nextParam, navigate, t])
}
