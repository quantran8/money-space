import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { googleCallback } from '@/features/auth/api/auth.repository'
import { useAuthStore } from '@/shared/stores/auth-store'
import { getErrorMessage } from '@/shared/lib/get-error-message'

/**
 * Handles the Google OAuth redirect: reads `?code`, exchanges it for a session
 * via the backend, stores it, then navigates home (or back to /auth on error).
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
    const oauthError = searchParams.get('error_description') ?? searchParams.get('error')

    if (oauthError) {
      toast.error(oauthError)
      navigate('/auth', { replace: true })
      return
    }

    if (!code) {
      navigate('/auth', { replace: true })
      return
    }

    googleCallback(code)
      .then((result) => {
        if (!result.session) throw new Error(t('auth.errors.googleFailed'))
        setAuth(result.user, result.session)
        toast.success(t('auth.toast.loginSuccess'))
        navigate('/', { replace: true })
      })
      .catch((cause) => {
        toast.error(getErrorMessage(cause, t('auth.errors.googleFailed')))
        navigate('/auth', { replace: true })
      })
  }, [navigate, searchParams, setAuth, t])
}
