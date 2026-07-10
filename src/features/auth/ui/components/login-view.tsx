import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthDivider, GoogleButton } from '@/features/auth/ui/components/google-button'
import { PasswordInput } from '@/features/auth/ui/components/password-input'
import type { LoginForm } from '@/features/auth/model/auth-form'

type LoginViewProps = {
  form: UseFormReturn<LoginForm>
  onSubmit: () => void
  onGoogle: () => void
  googlePending: boolean
  onSwitchToSignup: () => void
}

export function LoginView({
  form,
  onSubmit,
  onGoogle,
  googlePending,
  onSwitchToSignup,
}: LoginViewProps) {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  return (
    <div className="mt-8">
      <div>
        <p className="text-sm font-medium text-[hsl(var(--accent))]">{t('auth.login.eyebrow')}</p>
        <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em]">{t('auth.login.title')}</h2>
        <p className="mt-3 text-[15px] leading-6 text-[hsl(var(--muted-foreground))]">
          {t('auth.login.description')}
        </p>
      </div>

      <GoogleButton
        label={t('auth.login.googleCta')}
        pending={googlePending}
        onClick={onGoogle}
      />

      <AuthDivider />

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
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
          <div className="flex items-center justify-between gap-4">
            <Label>{t('auth.fields.password')}</Label>
            <button type="button" className="text-sm font-medium text-[hsl(var(--accent))] hover:underline">
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
            <p className="text-xs font-medium text-[hsl(var(--status-red))]">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
          <Checkbox {...register('remember')} />
          {t('auth.login.remember')}
        </label>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
        {t('auth.login.noAccount')}{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-semibold text-[hsl(var(--accent))] hover:underline"
        >
          {t('auth.tabs.signup')}
        </button>
      </p>
    </div>
  )
}
