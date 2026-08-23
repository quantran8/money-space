import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { Controller } from 'react-hook-form'
import { Link } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useSignupPage } from '@money-space/core/features/auth/hooks/use-auth-page'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field } from '@/components/ui/field'

export default function SignupScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { form, submit } = useSignupPage()
  const {
    control,
    formState: { errors, isSubmitting },
  } = form

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-app"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-5">
          <Text className="text-[19px] font-medium text-ink">{t('auth.signup.title')}</Text>
          <Text className="mt-1.5 text-[13px] leading-5 text-ink2">
            {t('auth.signup.description')}
          </Text>

          <View className="mt-6 rounded-panel bg-panel p-5">
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
            <Text className="text-[13px] text-ink2">{t('auth.signup.haveAccount')}</Text>
            <Link href="/auth" className="text-[13px] font-medium text-interactive">
              {t('auth.tabs.login')}
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
