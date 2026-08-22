import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { googleCallback } from '@/features/auth/api/auth.repository'
import { authHandoffState, resolveNextPath } from '@/features/auth/model/next-path'
import { useAuthStore } from '@/shared/stores/auth-store'
import { getErrorMessage } from '@/shared/lib/get-error-message'

/**
 * Handles the Google OAuth redirect: reads `?code`, exchanges it for a session
 * via the backend, stores it, then navigates to `?next` — the route the user was
 * originally headed for, an invite QR's `/join?…` above all — falling back home.
 * On error it goes back to /auth, keeping `next` so the retry still lands right.
 */
export function useGoogleCallback() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setAuth = useAuthStore((state) => state.setAuth)
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const oauthError = searchParams.get('error_description') ?? searchParams.get('error')
    const nextPath = resolveNextPath(searchParams.get('next'))
    const authPath =
      nextPath === '/' ? '/auth' : `/auth?next=${encodeURIComponent(nextPath)}`

    if (oauthError) {
      toast.error(oauthError)
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
        toast.success(t('auth.toast.loginSuccess'))
        navigate(nextPath, { replace: true, state: authHandoffState })
      })
      .catch((cause) => {
        toast.error(getErrorMessage(cause, t('auth.errors.googleFailed')))
        navigate(authPath, { replace: true })
      })
  }, [navigate, searchParams, setAuth, t])
}
