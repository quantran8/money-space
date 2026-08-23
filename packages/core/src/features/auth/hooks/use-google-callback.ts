import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParam } from '#/shared/navigation'
import { notify } from '#/shared/notify'

import { googleCallback } from '#/features/auth/api/auth.repository'
import { authHandoffState, resolveNextPath } from '#/features/auth/model/next-path'
import { useAuthStore } from '#/shared/stores/auth-store'
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
  const setAuth = useAuthStore((state) => state.setAuth)
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
      notify.error(oauthError)
      navigate(authPath, { replace: true })
      return
    }

    // `state` is required: without it the backend cannot find the PKCE verifier,
    // so there is nothing to exchange the code against.
    if (!code || !state) {
      navigate(authPath, { replace: true })
      return
    }

    googleCallback(code, state)
      .then((result) => {
        if (!result.session) throw new Error(t('auth.errors.googleFailed'))
        setAuth(result.user, result.session)
        notify.success(t('auth.toast.loginSuccess'))
        navigate(nextPath, { replace: true, state: authHandoffState })
      })
      .catch((cause) => {
        notify.error(getErrorMessage(cause, t('auth.errors.googleFailed')))
        navigate(authPath, { replace: true })
      })
  }, [codeParam, stateParam, errorDescriptionParam, errorParam, nextParam, navigate, setAuth, t])
}
