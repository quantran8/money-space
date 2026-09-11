import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'

import { Button, Screen } from '@/components/ui'

import type { ErrorBoundaryProps } from 'expo-router'

/**
 * What renders when a screen throws, instead of the red box in dev and a blank
 * frame in production.
 *
 * Expo Router picks this up from a layout's `ErrorBoundary` export and scopes
 * it to that layout's segment, so a screen that throws does not take the tab
 * bar with it. `retry` re-mounts the segment without reloading the app, so the
 * query cache — and the household's picture — survives a transient failure.
 */
export function RouteErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTranslation()

  return (
    <Screen withoutTabBar>
      <View className="flex-1 items-center justify-center gap-4 px-6 py-16">
        <Text className="t-subtitle text-center text-ink">
          {t('common.errorBoundary.title')}
        </Text>
        <Text className="t-body text-center text-ink2">
          {t('common.errorBoundary.description')}
        </Text>
        <Button onPress={retry}>{t('common.errorBoundary.retry')}</Button>

        {/* For whoever is debugging, never for the household. Dev only. */}
        {__DEV__ && (
          <Text className="t-caption mt-4 text-ink3" selectable>
            {error.message}
          </Text>
        )}
      </View>
    </Screen>
  )
}
