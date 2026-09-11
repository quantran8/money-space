import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '#/shared/navigation'
import { notify } from '#/shared/notify'

import {
  requestPasswordReset,
  updatePassword,
} from '#/features/auth/api/auth.repository'
import {
  buildForgotPasswordSchema,
  buildResetPasswordSchema,
  forgotPasswordDefaultValues,
  resetPasswordDefaultValues,
  type ForgotPasswordForm,
  type ResetPasswordForm,
} from '#/features/auth/model/auth-form'
import { authHandoffState } from '#/features/auth/model/next-path'
import { useAuthStore } from '#/shared/stores/auth-store'
import { getErrorMessage } from '#/shared/lib/get-error-message'

/**
 * Ask for a recovery email.
 *
 * `sent` latches true and the form is replaced by a confirmation, deliberately
 * worded so it reads the same whether or not the address has an account: the
 * screen must not become a way to find out who banks here.
 */
export function useForgotPasswordPage(redirectTo?: string) {
  const { t } = useTranslation()
  const [sent, setSent] = useState(false)

  const schema = useMemo(() => buildForgotPasswordSchema(t), [t])
  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(schema),
    defaultValues: forgotPasswordDefaultValues,
    mode: 'onChange',
  })

  async function onSubmit(values: ForgotPasswordForm) {
    try {
      await requestPasswordReset(values.email, redirectTo)
      setSent(true)
    } catch (error) {
      notify.error(getErrorMessage(error, t('auth.errors.resetRequestFailed')))
    }
  }

  return { form, submit: form.handleSubmit(onSubmit), sent, email: form.watch('email') }
}

/**
 * Set a new password from the emailed link.
 *
 * `accessToken` is read from the URL fragment by the host — core never touches
 * `window`, and a fragment is not a query parameter the navigation adapter can
 * see. An absent token means the link was opened wrong or has already been
 * spent; the screen says so rather than showing a form that cannot work.
 */
export function useResetPasswordPage(accessToken: string | null) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const schema = useMemo(() => buildResetPasswordSchema(t), [t])
  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(schema),
    defaultValues: resetPasswordDefaultValues,
    mode: 'onChange',
  })

  async function onSubmit(values: ResetPasswordForm) {
    if (!accessToken) return
    try {
      const result = await updatePassword(accessToken, values.password)
      // The backend signs them in as part of the reset, so there is no second
      // password prompt one screen after they chose it.
      if (result.session) {
        setAuth(result.user, result.session)
        notify.success(t('auth.toast.passwordUpdated'))
        navigate('/', { replace: true, state: authHandoffState })
        return
      }
      notify.success(t('auth.toast.passwordUpdated'))
      navigate('/auth', { replace: true })
    } catch (error) {
      notify.error(getErrorMessage(error, t('auth.errors.resetFailed')))
    }
  }

  return {
    form,
    submit: form.handleSubmit(onSubmit),
    hasToken: Boolean(accessToken),
  }
}
