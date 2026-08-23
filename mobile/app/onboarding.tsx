import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useOnboardingPage } from '@money-space/core/features/onboarding/hooks/use-onboarding-page'
import { currencyOptions } from '@money-space/core/features/onboarding/model/onboarding-form'

import { Button, Field, Segmented } from '@/components/ui'

import { RequireAuth } from '@/features/auth/require-auth'
import { TOUCH_TARGET } from '@/theme/tokens'

/**
 * Onboarding is ONE question with two answers: start a household, or join one.
 *
 * It is deliberately not a wizard — the nine-step version was setup for
 * features that each already own their own entry point, and remembering a
 * position in it pinned anyone who closed the app back into setup.
 */
export default function OnboardingScreen() {
  const [mode, setMode] = useState<'choose' | 'create'>('choose')

  return (
    <RequireAuth>
      {mode === 'choose' ? (
        <ChooseStep onCreate={() => setMode('create')} />
      ) : (
        <CreateStep onBack={() => setMode('choose')} />
      )}
    </RequireAuth>
  )
}

function ChooseStep({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      className="flex-1 bg-app"
      contentContainerStyle={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }}
    >
      <View className="px-5">
        <Text className="text-[19px] font-medium text-ink">{t('onboarding.choose.title')}</Text>

        <Pressable
          onPress={onCreate}
          accessibilityRole="button"
          style={{ minHeight: TOUCH_TARGET }}
          className="mt-6 rounded-panel bg-panel p-5 active:opacity-80"
        >
          <Text className="text-[16px] font-medium text-ink">
            {t('onboarding.choose.create.title')}
          </Text>
        </Pressable>

        {/* Joining happens by scanning the inviter's QR, which deep-links
            straight to /join — so this only has to explain where that is. */}
        <View className="mt-3 rounded-panel bg-panel p-5">
          <Text className="text-[16px] font-medium text-ink">
            {t('onboarding.choose.join.title')}
          </Text>
          <Text className="mt-1.5 text-[13px] leading-5 text-ink2">
            {t('invites.joinByCode.scanHint')}
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

function CreateStep({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { form, submit, isCreating } = useOnboardingPage()
  const {
    control,
    formState: { errors },
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
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            style={{ minHeight: TOUCH_TARGET }}
            className="justify-center"
          >
            <Text className="text-[13px] font-medium text-interactive">
              {t('onboarding.choose.back')}
            </Text>
          </Pressable>

          <Text className="mt-2 text-[19px] font-medium text-ink">
            {t('onboarding.form.title')}
          </Text>

          <View className="mt-6 rounded-panel bg-panel p-5">
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <Field
                  label={t('onboarding.form.nameLabel')}
                  placeholder={t('onboarding.form.namePlaceholder')}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <Segmented
                  className="mt-4"
                  label={t('onboarding.form.currencyLabel')}
                  value={field.value}
                  options={currencyOptions.map((code) => ({ value: code, label: code }))}
                  onChange={field.onChange}
                />
              )}
            />

            <Button className="mt-6" onPress={submit} loading={isCreating}>
              {t('onboarding.form.submit')}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
