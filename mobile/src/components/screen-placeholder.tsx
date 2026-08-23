import { ScrollView, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/**
 * Stand-in for a screen whose feature has not been ported yet.
 *
 * It states plainly that the screen is not built, rather than showing an empty
 * panel — v4.2 §23 is explicit that "no data yet" and "nothing here" must never
 * be confusable, and that rule starts with the scaffolding.
 */
export function ScreenPlaceholder({ title }: { title: string }) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      className="flex-1 bg-app"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 24 }}
    >
      <View className="px-5">
        <Text className="text-[19px] font-medium text-ink">{title}</Text>

        <View className="mt-4 rounded-panel bg-panel p-5">
          <Text className="text-[13px] leading-5 text-ink2">{t('common.comingSoon')}</Text>
        </View>
      </View>
    </ScrollView>
  )
}
