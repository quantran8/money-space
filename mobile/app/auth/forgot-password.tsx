import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { Controller } from 'react-hook-form'
import { Link } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { useForgotPasswordPage } from '@money-space/core/features/auth/hooks/use-password-reset'
import { oauth } from '@money-space/core/shared/oauth'

import { Button, Field } from '@/components/ui'
import { AuthHeading, AuthScreenShell } from '@/features/auth/components/auth-screen'
import { colors } from '@/theme/tokens'

/**
 * The emailed link opens the app at `/auth/reset-password`. Supabase needs an
 * absolute URL, and on a phone that is the deep link — same builder the Google
 * round-trip uses.
 */
const RESET_REDIRECT_PATH = '/auth/reset-password'

export default function ForgotPasswordScreen() {
  const { t } = useTranslation()
  const { form, submit, sent, email } = useForgotPasswordPage(
    oauth.buildRedirectUri(RESET_REDIRECT_PATH),
  )
  const {
    control,
    formState: { errors, isSubmitting },
  } = form

  if (sent) {
    return (
      <AuthScreenShell>
        <View className="items-center gap-4 rounded-card bg-card p-5 py-8">
          <Ionicons name="mail-open" size={28} color={colors.action} />
          <Text className="t-title text-center text-ink">
            {t('auth.forgotPassword.sentTitle')}
          </Text>
          <Text className="text-center t-body-sm leading-5 text-ink2">
            {t('auth.forgotPassword.sentDescription', { email })}
          </Text>
          <Link href="/auth" className="mt-2 t-body-sm font-medium text-action">
            {t('auth.forgotPassword.backToLogin')}
          </Link>
        </View>
      </AuthScreenShell>
    )
  }

  return (
    <AuthScreenShell>
      <AuthHeading
        title={t('auth.forgotPassword.title')}
        description={t('auth.forgotPassword.description')}
      />

      <View className="mt-6 rounded-card bg-card p-5">
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

        <Button className="mt-6" onPress={submit} loading={isSubmitting}>
          {t('auth.forgotPassword.submit')}
        </Button>
      </View>

      <View className="mt-4 items-center">
        <Link href="/auth" className="t-body-sm font-medium text-action">
          {t('auth.forgotPassword.backToLogin')}
        </Link>
      </View>
    </AuthScreenShell>
  )
}
