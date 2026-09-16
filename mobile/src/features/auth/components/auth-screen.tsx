import { LinearGradient } from 'expo-linear-gradient'
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { TOUCH_TARGET } from '@/theme/tokens'

import type { ReactNode } from 'react'

/** Placeholder until the marketing site ships the two pages. */
const LEGAL_URLS = {
  terms: 'https://oursight.app/terms',
  privacy: 'https://oursight.app/privacy',
}

/** The canvas warms upward into the card, so the sky is deepest behind the brand. */
const CANVAS_GRADIENT = ['#C2D7EE', '#DDE8F3', '#EDF3F8', '#EDF3F8'] as const
const CANVAS_STOPS = [0, 0.3, 0.66, 1] as const

/** The scaffolding every auth screen shares: gradient, brand, centred card. */
export function AuthScreenShell({
  children,
  footer,
}: {
  children: ReactNode
  /** Sits below the card, outside it — sign-in/sign-up hop, legal links. */
  footer?: ReactNode
}) {
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()

  // The card centres in whatever is left between brand and footer; `minHeight`
  // is what gives `flex-1` something to centre inside a scroll view.
  const contentMinHeight = height - insets.top - insets.bottom - 36

  // `style`, not `className`: NativeWind does not interop third-party views.
  return (
    <LinearGradient colors={CANVAS_GRADIENT} locations={CANVAS_STOPS} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: Math.max(insets.top, 18),
            paddingBottom: Math.max(insets.bottom, 20),
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-4" style={{ minHeight: contentMinHeight }}>
            <AuthBrand />

            <View className="flex-1 justify-center py-8">
              <View className="rounded-card bg-card p-5">{children}</View>
            </View>

            {footer ? <View className="pb-1">{footer}</View> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

/** The wordmark above the card: ink dot plus the app name. */
function AuthBrand() {
  const { t } = useTranslation()

  return (
    <View className="flex-row items-center gap-2" style={{ minHeight: TOUCH_TARGET }}>
      <View className="h-8 w-8 items-center justify-center rounded-pill bg-action">
        <Text className="t-caption font-medium text-action-inverse">O</Text>
      </View>
      <Text className="t-body-sm font-medium text-ink">{t('auth.brand.appName')}</Text>
    </View>
  )
}

/** Eyebrow + title, matching the web's auth header. */
export function AuthHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description?: string
}) {
  return (
    <View>
      {eyebrow ? <Text className="t-body-sm font-medium text-action">{eyebrow}</Text> : null}
      <Text className={eyebrow ? 'mt-2 t-metric text-ink' : 't-metric text-ink'}>{title}</Text>
      {description ? (
        <Text className="mt-2 t-body-sm leading-5 text-ink2">{description}</Text>
      ) : null}
    </View>
  )
}

/** The terms/privacy links under the login card. */
export function AuthLegalLinks() {
  const { t } = useTranslation()

  return (
    <View
      className="flex-row items-center justify-center gap-4"
      style={{ minHeight: TOUCH_TARGET }}
    >
      <LegalLink label={t('auth.terms')} url={LEGAL_URLS.terms} />
      <View className="h-1 w-1 rounded-pill bg-committed" />
      <LegalLink label={t('auth.privacy')} url={LEGAL_URLS.privacy} />
    </View>
  )
}

function LegalLink({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      onPress={() => void Linking.openURL(url)}
      accessibilityRole="link"
      hitSlop={8}
      className="active:opacity-70"
    >
      <Text className="t-caption text-ink3">{label}</Text>
    </Pressable>
  )
}
