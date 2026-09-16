import { Text, View } from 'react-native'
import { Controller } from 'react-hook-form'
import { Link, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { useSignupPage } from '@money-space/core/features/auth/hooks/use-auth-page'

import { Button, Checkbox, Field } from '@/components/ui'
import { AuthHeading, AuthScreenShell } from '@/features/auth/components/auth-screen'

export default function SignupScreen() {
  const { t } = useTranslation()
  const { next } = useLocalSearchParams<{ next?: string }>()
  const { form, submit } = useSignupPage()
  const {
    control,
    formState: { errors, isSubmitting },
  } = form

  const loginHref: '/auth' | `/auth?${string}` = next
    ? `/auth?next=${encodeURIComponent(next)}`
    : '/auth'

  return (
    <AuthScreenShell
      footer={
        <View className="flex-row items-center justify-center gap-1">
          <Text className="t-body-sm text-ink3">{t('auth.signup.haveAccount')}</Text>
          <Link href={loginHref} className="t-body-sm font-medium text-action">
            {t('auth.tabs.login')}
          </Link>
        </View>
      }
    >
      <AuthHeading title={t('auth.signup.title')} />

      <View className="mt-6 gap-5">
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
              label={t('auth.fields.password')}
              placeholder={t('auth.fields.passwordPlaceholder')}
              // The length rule is a standing requirement, not an error, so it
              // sits under the field rather than in the placeholder.
              hint={t('auth.fields.newPasswordPlaceholder')}
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

        <Button onPress={submit} loading={isSubmitting}>
          {t('auth.signup.submit')}
        </Button>
      </View>
    </AuthScreenShell>
  )
}
