import type { UseFormReturn } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { AuthDivider, GoogleButton } from '@/features/auth/ui/components/google-button'
import { PasswordInput } from '@/features/auth/ui/components/password-input'
import type { SignupForm } from '@money-space/core/features/auth/model/auth-form'

type SignupViewProps = {
  form: UseFormReturn<SignupForm>
  onSubmit: () => void
  onGoogle: () => void
  googlePending: boolean
}

export function SignupView({ form, onSubmit, onGoogle, googlePending }: SignupViewProps) {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  // Same reason as on the login side: `next` must survive the hop back.
  const next = searchParams.get('next')
  const loginPath = next ? `/auth?next=${encodeURIComponent(next)}` : '/auth'

  return (
    <div>
      <div>
        <p className="text-[13px] font-medium text-accent">{t('auth.signup.eyebrow')}</p>
        <h2 className="mt-2 text-[34px] font-medium leading-tight tracking-[-0.035em]">
          {t('auth.signup.title')}
        </h2>
        <p className="mt-3 text-[14px] leading-6 text-ink2">{t('auth.signup.description')}</p>
      </div>

      <GoogleButton
        label={t('auth.signup.googleCta')}
        pending={googlePending}
        onClick={onGoogle}
      />

      <AuthDivider />

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
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
          <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-5 text-ink2">
            <Checkbox className="mt-0.5" {...register('agreeTerms')} />
            <span>
              <Trans
                i18nKey="auth.signup.agree"
                components={{
                  terms: <a href="#" className="font-medium text-accent hover:underline" />,
                  privacy: <a href="#" className="font-medium text-accent hover:underline" />,
                }}
              />
            </span>
          </label>
          {errors.agreeTerms?.message ? (
            <p className="mt-1.5 text-xs font-medium text-alert">
              {errors.agreeTerms.message}
            </p>
          ) : null}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t('auth.signup.submitting') : t('auth.signup.submit')}
        </Button>
      </form>

      <p className="mt-7 text-center text-[13px] text-ink2">
        {t('auth.signup.haveAccount')}{' '}
        <Link to={loginPath} className="font-medium text-accent hover:underline">
          {t('auth.tabs.login')}
        </Link>
      </p>
    </div>
  )
}
