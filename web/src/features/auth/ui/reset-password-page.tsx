import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useResetPasswordPage } from '@money-space/core/features/auth/hooks/use-password-reset'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { AuthLayout } from '@/features/auth/ui/auth-page'
import { PasswordInput } from '@/features/auth/ui/components/password-input'

/**
 * Supabase returns the recovery token in the URL **fragment**
 * (`#access_token=…&type=recovery`), not the query string — a fragment never
 * reaches a server, which is the point. Read once at mount: the token is spent
 * on submit and re-reading a stale hash later would only resurrect it.
 */
function readAccessTokenFromHash(): string | null {
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash) return null
  const params = new URLSearchParams(hash)
  return params.get('access_token')
}

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const [accessToken] = useState(readAccessTokenFromHash)
  const { form, submit, hasToken } = useResetPasswordPage(accessToken)
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  if (!hasToken) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <KeyRound className="size-7 text-ink3" strokeWidth={1.5} aria-hidden />
          <h2 className="t-title">{t('auth.resetPassword.invalidTitle')}</h2>
          <p className="max-w-[46ch] t-body-sm leading-6 text-ink2">
            {t('auth.resetPassword.invalidDescription')}
          </p>
          <Button asChild className="mt-2">
            <Link to="/auth/forgot-password">
              {t('auth.resetPassword.requestAgain')}
            </Link>
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div>
        <h2 className="t-figure leading-tight">{t('auth.resetPassword.title')}</h2>
        <p className="mt-3 t-body-sm leading-6 text-ink2">
          {t('auth.resetPassword.description')}
        </p>

        <form className="mt-7 space-y-5" onSubmit={submit} noValidate>
          <FormField label={t('auth.fields.password')} error={errors.password?.message}>
            <PasswordInput
              autoComplete="new-password"
              placeholder={t('auth.fields.newPasswordPlaceholder')}
              aria-invalid={!!errors.password}
              {...register('password')}
            />
          </FormField>

          <FormField
            label={t('auth.fields.confirmPassword')}
            error={errors.confirmPassword?.message}
          >
            <PasswordInput
              autoComplete="new-password"
              placeholder={t('auth.fields.confirmPasswordPlaceholder')}
              aria-invalid={!!errors.confirmPassword}
              {...register('confirmPassword')}
            />
          </FormField>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? t('auth.resetPassword.submitting')
              : t('auth.resetPassword.submit')}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}
