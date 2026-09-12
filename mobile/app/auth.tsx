import { Text, View } from 'react-native'
import { Controller } from 'react-hook-form'
import { Link, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { useLoginPage } from '@money-space/core/features/auth/hooks/use-auth-page'

import { Button, Checkbox, Field } from '@/components/ui'
import {
  AuthHeading,
  AuthLegalNote,
  AuthScreenShell,
} from '@/features/auth/components/auth-screen'
import { AuthDivider, GoogleButton } from '@/features/auth/components/google-button'

export default function AuthScreen() {
  const { t } = useTranslation()
  const { next } = useLocalSearchParams<{ next?: string }>()
  const { form, submit, onGoogle, googlePending } = useLoginPage()
  const {
    control,
    formState: { errors, isSubmitting },
  } = form

  // `next` is why someone was sent here at all (an invite QR, most often), so
  // it has to survive the hop to signup too. Typed routes cannot see a query
  // built at runtime, hence the annotation.
  const signupHref: '/signup' | `/signup?${string}` = next
    ? `/signup?next=${encodeURIComponent(next)}`
    : '/signup'

  return (
    <AuthScreenShell>
      <AuthHeading
        eyebrow={t('auth.login.eyebrow')}
        title={t('auth.login.title')}
        description={t('auth.login.description')}
      />

      <View className="mt-6 rounded-card bg-card p-5">
        <GoogleButton
          label={t('auth.login.googleCta')}
          pending={googlePending}
          onPress={onGoogle}
        />

        <AuthDivider />

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
              className="mt-4"
              label={t('auth.fields.password')}
              labelAction={
                <Link
                  href="/auth/forgot-password"
                  className="t-body-sm font-medium text-action"
                >
                  {t('auth.login.forgotPassword')}
                </Link>
              }
              placeholder={t('auth.fields.passwordPlaceholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
              secureTextEntry
              revealable
              autoCapitalize="none"
              textContentType="password"
            />
          )}
        />

        <Controller
          control={control}
          name="remember"
          render={({ field }) => (
            <Checkbox
              className="mt-4"
              checked={field.value}
              onChange={field.onChange}
              label={t('auth.login.remember')}
            />
          )}
        />

        {/* Always enabled (§22.10) — pressing it reports what is missing. */}
        <Button className="mt-6" onPress={submit} loading={isSubmitting}>
          {t('auth.login.submit')}
        </Button>
      </View>

      <View className="mt-4 flex-row items-center justify-center gap-1">
        <Text className="t-body-sm text-ink2">{t('auth.login.noAccount')}</Text>
        <Link href={signupHref} className="t-body-sm font-medium text-action">
          {t('auth.tabs.signup')}
        </Link>
      </View>

      <AuthLegalNote />
    </AuthScreenShell>
  )
}
