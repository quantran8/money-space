import { Text, View } from 'react-native'
import { Controller } from 'react-hook-form'
import { Link, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { useSignupPage } from '@money-space/core/features/auth/hooks/use-auth-page'

import { Button, Checkbox, Field } from '@/components/ui'
import {
  AuthHeading,
  AuthLegalNote,
  AuthScreenShell,
} from '@/features/auth/components/auth-screen'
import { AuthDivider, GoogleButton } from '@/features/auth/components/google-button'

export default function SignupScreen() {
  const { t } = useTranslation()
  const { next } = useLocalSearchParams<{ next?: string }>()
  const { form, submit, onGoogle, googlePending } = useSignupPage()
  const {
    control,
    formState: { errors, isSubmitting },
  } = form

  const loginHref: '/auth' | `/auth?${string}` = next
    ? `/auth?next=${encodeURIComponent(next)}`
    : '/auth'

  return (
    <AuthScreenShell>
      <AuthHeading
        eyebrow={t('auth.signup.eyebrow')}
        title={t('auth.signup.title')}
        description={t('auth.signup.description')}
      />

      <View className="mt-6 rounded-card bg-card p-5">
        <GoogleButton
          label={t('auth.signup.googleCta')}
          pending={googlePending}
          onPress={onGoogle}
        />

        <AuthDivider />

        <Controller
          control={control}
          name="fullName"
          render={({ field }) => (
            <Field
              label={t('auth.fields.fullName')}
              placeholder={t('auth.fields.fullNamePlaceholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.fullName?.message}
              autoComplete="name"
              textContentType="name"
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Field
              className="mt-4"
              label={t('auth.fields.email')}
              placeholder={t('auth.fields.emailPlaceholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.email?.message}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <Field
              className="mt-4"
              label={t('auth.fields.password')}
              placeholder={t('auth.fields.newPasswordPlaceholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
              secureTextEntry
              revealable
              autoCapitalize="none"
              textContentType="newPassword"
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <Field
              className="mt-4"
              label={t('auth.fields.confirmPassword')}
              placeholder={t('auth.fields.confirmPasswordPlaceholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.confirmPassword?.message}
              secureTextEntry
              revealable
              autoCapitalize="none"
              textContentType="newPassword"
            />
          )}
        />

        <Controller
          control={control}
          name="agreeTerms"
          render={({ field }) => (
            <Checkbox
              className="mt-4"
              checked={field.value}
              onChange={field.onChange}
              // The web renders <terms>/<privacy> as links; there is nowhere
              // to link to on the phone yet, so the tags are stripped rather
              // than shown raw.
              label={t('auth.signup.agree').replace(/<\/?(terms|privacy)>/g, '')}
              error={errors.agreeTerms?.message}
            />
          )}
        />

        <Button className="mt-6" onPress={submit} loading={isSubmitting}>
          {t('auth.signup.submit')}
        </Button>
      </View>

      <View className="mt-4 flex-row items-center justify-center gap-1">
        <Text className="t-body-sm text-ink2">{t('auth.signup.haveAccount')}</Text>
        <Link href={loginHref} className="t-body-sm font-medium text-action">
          {t('auth.tabs.login')}
        </Link>
      </View>

      <AuthLegalNote />
    </AuthScreenShell>
  )
}
