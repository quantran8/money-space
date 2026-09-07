import { MailCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useForgotPasswordPage } from '@money-space/core/features/auth/hooks/use-password-reset'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { AuthLayout } from '@/features/auth/ui/auth-page'

/** Where the emailed link lands. Absolute, because Supabase requires one. */
const RESET_REDIRECT_PATH = '/auth/reset-password'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const { form, submit, sent, email } = useForgotPasswordPage(
    new URL(RESET_REDIRECT_PATH, window.location.origin).toString(),
  )
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  return (
    <AuthLayout>
      {sent ? (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <MailCheck className="size-7 text-action" strokeWidth={1.5} aria-hidden />
          <h2 className="t-title">{t('auth.forgotPassword.sentTitle')}</h2>
          <p className="max-w-[46ch] t-body-sm leading-6 text-ink2">
            {t('auth.forgotPassword.sentDescription', { email })}
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link to="/auth">{t('auth.forgotPassword.backToLogin')}</Link>
          </Button>
        </div>
      ) : (
        <div>
          <h2 className="t-figure leading-tight">{t('auth.forgotPassword.title')}</h2>
          <p className="mt-3 t-body-sm leading-6 text-ink2">
            {t('auth.forgotPassword.description')}
          </p>

          <form className="mt-7 space-y-5" onSubmit={submit} noValidate>
            <FormField label={t('auth.fields.email')} error={errors.email?.message}>
              <Input
                type="email"
                autoComplete="email"
                placeholder={t('auth.fields.emailPlaceholder')}
                aria-invalid={!!errors.email}
                {...register('email')}
              />
            </FormField>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? t('auth.forgotPassword.submitting')
                : t('auth.forgotPassword.submit')}
            </Button>
          </form>

          <p className="mt-7 text-center t-body-sm">
            <Link to="/auth" className="font-medium text-action hover:underline">
              {t('auth.forgotPassword.backToLogin')}
            </Link>
          </p>
        </div>
      )}
    </AuthLayout>
  )
}
