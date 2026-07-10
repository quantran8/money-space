import type { UseFormReturn } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { AuthDivider, GoogleButton } from '@/features/auth/ui/components/google-button'
import { PasswordInput } from '@/features/auth/ui/components/password-input'
import type { SignupForm } from '@/features/auth/model/auth-form'

type SignupViewProps = {
  form: UseFormReturn<SignupForm>
  onSubmit: () => void
  onGoogle: () => void
  googlePending: boolean
  onSwitchToLogin: () => void
}

export function SignupView({
  form,
  onSubmit,
  onGoogle,
  googlePending,
  onSwitchToLogin,
}: SignupViewProps) {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  return (
    <div className="mt-8">
      <div>
        <p className="text-sm font-medium text-[hsl(var(--accent))]">{t('auth.signup.eyebrow')}</p>
        <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em]">{t('auth.signup.title')}</h2>
        <p className="mt-3 text-[15px] leading-6 text-[hsl(var(--muted-foreground))]">
          {t('auth.signup.description')}
        </p>
      </div>

      <GoogleButton
        label={t('auth.signup.googleCta')}
        pending={googlePending}
        onClick={onGoogle}
      />

      <AuthDivider />

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <FormField label={t('auth.fields.fullName')} error={errors.fullName?.message}>
          <Input
            autoComplete="name"
            placeholder={t('auth.fields.fullNamePlaceholder')}
            aria-invalid={!!errors.fullName}
            {...register('fullName')}
          />
        </FormField>

        <FormField label={t('auth.fields.email')} error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder={t('auth.fields.emailPlaceholder')}
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </FormField>

        <FormField label={t('auth.fields.password')} error={errors.password?.message}>
          <PasswordInput
            autoComplete="new-password"
            placeholder={t('auth.fields.newPasswordPlaceholder')}
            aria-invalid={!!errors.password}
            {...register('password')}
          />
        </FormField>

        <FormField label={t('auth.fields.confirmPassword')} error={errors.confirmPassword?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder={t('auth.fields.confirmPasswordPlaceholder')}
            aria-invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
        </FormField>

        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-[hsl(var(--muted-foreground))]">
            <Checkbox className="mt-0.5" {...register('agreeTerms')} />
            <span>
              <Trans
                i18nKey="auth.signup.agree"
                components={{
                  terms: <a href="#" className="font-medium text-[hsl(var(--accent))] hover:underline" />,
                  privacy: <a href="#" className="font-medium text-[hsl(var(--accent))] hover:underline" />,
                }}
              />
            </span>
          </label>
          {errors.agreeTerms?.message ? (
            <p className="mt-1.5 text-xs font-medium text-[hsl(var(--status-red))]">
              {errors.agreeTerms.message}
            </p>
          ) : null}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t('auth.signup.submitting') : t('auth.signup.submit')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
        {t('auth.signup.haveAccount')}{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-[hsl(var(--accent))] hover:underline"
        >
          {t('auth.tabs.login')}
        </button>
      </p>
    </div>
  )
}
