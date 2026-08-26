import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthDivider, GoogleButton } from '@/features/auth/ui/components/google-button'
import { AuthLegalNote } from '@/features/auth/ui/components/auth-legal-note'
import { PasswordInput } from '@/features/auth/ui/components/password-input'
import type { LoginForm } from '@money-space/core/features/auth/model/auth-form'

type LoginViewProps = {
  form: UseFormReturn<LoginForm>
  onSubmit: () => void
  onGoogle: () => void
  googlePending: boolean
}

export function LoginView({ form, onSubmit, onGoogle, googlePending }: LoginViewProps) {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  // `next` is why someone was sent here at all (an invite QR, most often), so
  // it has to survive the hop to signup too.
  const next = searchParams.get('next')
  const signupPath = next ? `/auth/signup?next=${encodeURIComponent(next)}` : '/auth/signup'

  return (
    <div>
      <div>
        <p className="t-body-sm font-medium text-action">{t('auth.login.eyebrow')}</p>
        <h2 className="mt-2 t-figure leading-tight">
          {t('auth.login.title')}
        </h2>
        <p className="mt-3 t-body-sm leading-6 text-ink2">{t('auth.login.description')}</p>
      </div>

      <GoogleButton
        label={t('auth.login.googleCta')}
        pending={googlePending}
        onClick={onGoogle}
      />

      <AuthDivider />

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <FormField label={t('auth.fields.email')} error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder={t('auth.fields.emailPlaceholder')}
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </FormField>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label>{t('auth.fields.password')}</Label>
            <button type="button" className="t-body-sm font-medium text-action hover:underline">
              {t('auth.login.forgotPassword')}
            </button>
          </div>
          <PasswordInput
            autoComplete="current-password"
            placeholder={t('auth.fields.passwordPlaceholder')}
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password?.message ? (
            <p className="t-caption font-medium text-alert">{errors.password.message}</p>
          ) : null}
        </div>

        <label className="flex cursor-pointer items-start gap-3 t-body-sm text-ink2">
          <Checkbox className="mt-[2px]" {...register('remember')} />
          <span>{t('auth.login.remember')}</span>
        </label>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>
      </form>

      <p className="mt-7 text-center t-body-sm text-ink2">
        {t('auth.login.noAccount')}{' '}
        <Link to={signupPath} className="font-medium text-action hover:underline">
          {t('auth.tabs.signup')}
        </Link>
      </p>

      <AuthLegalNote />
    </div>
  )
}
