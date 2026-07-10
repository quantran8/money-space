import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import {
  getGoogleAuthUrl,
  login as loginRequest,
  signup as signupRequest,
} from '@/features/auth/api/auth.repository'
import {
  buildLoginSchema,
  buildSignupSchema,
  loginDefaultValues,
  signupDefaultValues,
  type AuthTab,
  type LoginForm,
  type SignupForm,
} from '@/features/auth/model/auth-form'
import { useAuthStore } from '@/shared/stores/auth-store'
import { getErrorMessage } from '@/shared/lib/get-error-message'

const GOOGLE_REDIRECT_PATH = '/auth/callback'

export function useAuthPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const [tab, setTab] = useState<AuthTab>('login')
  const [googlePending, setGooglePending] = useState(false)

  const loginSchema = useMemo(() => buildLoginSchema(t), [t])
  const signupSchema = useMemo(() => buildSignupSchema(t), [t])

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaultValues,
    mode: 'onChange',
  })

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: signupDefaultValues,
    mode: 'onChange',
  })

  async function onLogin(values: LoginForm) {
    try {
      const result = await loginRequest({ email: values.email, password: values.password })
      if (!result.session) throw new Error(t('auth.errors.loginFailed'))
      setAuth(result.user, result.session)
      toast.success(t('auth.toast.loginSuccess'))
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error, t('auth.errors.loginFailed')))
    }
  }

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
        toast.success(t('auth.toast.signupSuccess', { name: values.fullName }))
        navigate('/', { replace: true })
      } else {
        toast.success(t('auth.toast.confirmEmail'))
        setTab('login')
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('auth.errors.signupFailed')))
    }
  }

  async function onGoogle() {
    setGooglePending(true)
    try {
      const redirectTo = `${window.location.origin}${GOOGLE_REDIRECT_PATH}`
      const { url } = await getGoogleAuthUrl(redirectTo)
      // Hand off to Google; the browser returns to GOOGLE_REDIRECT_PATH with a code.
      window.location.assign(url)
    } catch (error) {
      toast.error(getErrorMessage(error, t('auth.errors.googleFailed')))
      setGooglePending(false)
    }
  }

  return {
    tab,
    setTab,
    googlePending,
    loginForm,
    signupForm,
    submitLogin: loginForm.handleSubmit(onLogin),
    submitSignup: signupForm.handleSubmit(onSignup),
    onGoogle,
  }
}
