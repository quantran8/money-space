import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { ReactNode } from 'react'

/** The scaffolding every auth screen shares: insets, keyboard avoidance, card. */
export function AuthScreenShell({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-5">{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

/** Eyebrow + title + description, matching the web's auth header. */
export function AuthHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description: string
}) {
  return (
    <View>
      {eyebrow ? <Text className="t-body-sm font-medium text-action">{eyebrow}</Text> : null}
      <Text className="mt-2 t-subtitle text-ink">{title}</Text>
      <Text className="mt-1.5 t-body-sm leading-5 text-ink2">{description}</Text>
    </View>
  )
}

/** The terms/privacy footnote under both auth forms. */
export function AuthLegalNote() {
  const { t } = useTranslation()
  return (
    <Text className="mt-8 text-center t-caption-sm leading-5 text-ink3">{t('auth.legal')}</Text>
  )
}
