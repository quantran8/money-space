import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { Controller } from 'react-hook-form'
import { Link } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useLoginPage } from '@money-space/core/features/auth/hooks/use-auth-page'

import { Button, Field } from '@/components/ui'


/**
 * Sign in.
 *
 * Google sign-in is deliberately absent for now: it needs expo-auth-session
 * plus a registered deep-link redirect, and email/password already reaches
 * every screen. `useLoginPage` still exposes `onGoogle` — the button is what is
 * missing, not the wiring.
 */
export default function AuthScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { form, submit } = useLoginPage()
  const {
    control,
    formState: { errors, isSubmitting },
  } = form

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-5">
          <Text className="t-subtitle text-ink">{t('auth.login.title')}</Text>
          <Text className="mt-1.5 t-body-sm leading-5 text-ink2">
            {t('auth.login.description')}
          </Text>

          <View className="mt-6 rounded-card bg-card p-5">
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Field
                  label={t('auth.fields.email')}
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
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.password?.message}
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="password"
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
            <Link href="/signup" className="t-body-sm font-medium text-action">
              {t('auth.tabs.signup')}
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
