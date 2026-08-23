import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParam } from '#/shared/navigation'
import { notify } from '#/shared/notify'

import {
  getGoogleAuthUrl,
  login as loginRequest,
  signup as signupRequest,
} from '#/features/auth/api/auth.repository'
import { authHandoffState, resolveNextPath } from '#/features/auth/model/next-path'
import {
  buildLoginSchema,
  buildSignupSchema,
  loginDefaultValues,
  signupDefaultValues,
  type LoginForm,
  type SignupForm,
} from '#/features/auth/model/auth-form'
import { useAuthStore } from '#/shared/stores/auth-store'
import { getErrorMessage } from '#/shared/lib/get-error-message'

const GOOGLE_REDIRECT_PATH = '/auth/callback'

/**
 * The half both auth routes share: where to land after success, and the Google
 * hand-off. Split out so `/auth` never builds the signup form and vice versa.
 */
function useAuthShared() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const setAuth = useAuthStore((state) => state.setAuth)

  /**
   * Set by `RequireAuth` when it bounced the user off a protected route — an
   * invite QR at `/join?…` being the case that matters, since losing it means
   * losing the invitation.
   */
  const nextPath = resolveNextPath(useSearchParam('next'))

  const [googlePending, setGooglePending] = useState(false)

  async function onGoogle() {
    setGooglePending(true)
    try {
      // Carry `next` through the Google round-trip; the callback reads it back
      // off its own URL, since nothing of ours survives the hop otherwise.
      const callback = new URL(GOOGLE_REDIRECT_PATH, window.location.origin)
      if (nextPath !== '/') callback.searchParams.set('next', nextPath)
      const redirectTo = callback.toString()
      const { url } = await getGoogleAuthUrl(redirectTo)
      // Hand off to Google; the browser returns to GOOGLE_REDIRECT_PATH with a code.
      window.location.assign(url)
    } catch (error) {
      notify.error(getErrorMessage(error, t('auth.errors.googleFailed')))
      setGooglePending(false)
    }
  }

  return { t, navigate, setAuth, nextPath, googlePending, onGoogle }
}

export function useLoginPage() {
  const { t, navigate, setAuth, nextPath, googlePending, onGoogle } = useAuthShared()

  const loginSchema = useMemo(() => buildLoginSchema(t), [t])

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaultValues,
    mode: 'onChange',
  })

  async function onLogin(values: LoginForm) {
    try {
      const result = await loginRequest({ email: values.email, password: values.password })
      if (!result.session) throw new Error(t('auth.errors.loginFailed'))
      setAuth(result.user, result.session)
      notify.success(t('auth.toast.loginSuccess'))
      navigate(nextPath, { replace: true, state: authHandoffState })
    } catch (error) {
      notify.error(getErrorMessage(error, t('auth.errors.loginFailed')))
    }
  }

  return {
    googlePending,
    form,
    submit: form.handleSubmit(onLogin),
    onGoogle,
  }
}

export function useSignupPage() {
  const { t, navigate, setAuth, nextPath, googlePending, onGoogle } = useAuthShared()

  const signupSchema = useMemo(() => buildSignupSchema(t), [t])

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: signupDefaultValues,
    mode: 'onChange',
  })

  async function onSignup(values: SignupForm) {
    try {
      const result = await signupRequest({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
      })
      // With email confirmation enabled the backend returns no session yet.
      if (result.session) {
        setAuth(result.user, result.session)
        notify.success(t('auth.toast.signupSuccess', { name: values.fullName }))
        navigate(nextPath, { replace: true, state: authHandoffState })
      } else {
        notify.success(t('auth.toast.confirmEmail'))
        // Send them to the sign-in route to wait for the confirmation mail,
        // preserving `next` so a pending invite still survives the detour.
        navigate(buildLoginPath(nextPath), { replace: true })
      }
    } catch (error) {
      notify.error(getErrorMessage(error, t('auth.errors.signupFailed')))
    }
  }

  return {
    googlePending,
    form,
    submit: form.handleSubmit(onSignup),
    onGoogle,
  }
}

/** `/auth`, carrying `next` forward so a bounced destination is not lost. */
export function buildLoginPath(nextPath: string) {
  return nextPath === '/' ? '/auth' : `/auth?next=${encodeURIComponent(nextPath)}`
}
