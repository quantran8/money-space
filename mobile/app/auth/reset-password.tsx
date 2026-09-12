import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { Controller } from 'react-hook-form'
import { Link } from 'expo-router'
import * as Linking from 'expo-linking'
import { useTranslation } from 'react-i18next'

import { useResetPasswordPage } from '@money-space/core/features/auth/hooks/use-password-reset'

import { Button, Field } from '@/components/ui'
import { AuthHeading, AuthScreenShell } from '@/features/auth/components/auth-screen'
import { colors } from '@/theme/tokens'

/**
 * Supabase puts the recovery token in the URL **fragment**
 * (`#access_token=…&type=recovery`), which `useLocalSearchParams` never sees.
 * Read once from the launch URL: the token is spent on submit, and re-reading
 * a stale link later would only resurrect it.
 */
function readAccessToken(url: string | null): string | null {
  if (!url) return null
  const fragment = url.split('#')[1]
  if (fragment) {
    const token = new URLSearchParams(fragment).get('access_token')
    if (token) return token
  }
  // Some mail clients hand the fragment back as a query instead.
  return Linking.parse(url).queryParams?.access_token as string | null
}

export default function ResetPasswordScreen() {
  const { t } = useTranslation()
  const url = Linking.useLinkingURL()
  const [accessToken] = useState(() => readAccessToken(url ?? null))
  const { form, submit, hasToken } = useResetPasswordPage(accessToken)
  const {
    control,
    formState: { errors, isSubmitting },
  } = form

  if (!hasToken) {
    return (
      <AuthScreenShell>
        <View className="items-center gap-4 rounded-card bg-card p-5 py-8">
          <Ionicons name="key" size={28} color={colors.ink3} />
          <Text className="t-title text-center text-ink">
            {t('auth.resetPassword.invalidTitle')}
          </Text>
          <Text className="text-center t-body-sm leading-5 text-ink2">
            {t('auth.resetPassword.invalidDescription')}
          </Text>
          <Link href="/auth/forgot-password" className="mt-2 t-body-sm font-medium text-action">
            {t('auth.resetPassword.requestAgain')}
          </Link>
        </View>
      </AuthScreenShell>
    )
  }

  return (
    <AuthScreenShell>
      <AuthHeading
        title={t('auth.resetPassword.title')}
        description={t('auth.resetPassword.description')}
      />

      <View className="mt-6 rounded-card bg-card p-5">
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <Field
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

        <Button className="mt-6" onPress={submit} loading={isSubmitting}>
          {t('auth.resetPassword.submit')}
        </Button>
      </View>
    </AuthScreenShell>
  )
}
