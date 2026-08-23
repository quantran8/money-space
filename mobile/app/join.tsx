import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useJoinInvite } from '@money-space/core/features/invites/hooks/use-join-invite'

import { Button } from '@/components/ui'

import { RequireAuth } from '@/features/auth/require-auth'

/**
 * Where a scanned invite QR lands: `moneyspace://join?household=…&token=…`.
 *
 * Authenticated but deliberately OUTSIDE the household gate. Whoever scans an
 * invite usually has no household yet, and that gate would push them into the
 * create-a-household screen — the exact opposite of joining one.
 */
export default function JoinScreen() {
  return (
    <RequireAuth>
      <JoinContent />
    </RequireAuth>
  )
}

function JoinContent() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const {
    isMissingToken,
    preview,
    isLoading,
    loadError,
    isAccepting,
    isAutoJoining,
    acceptJoin,
  } = useJoinInvite()

  return (
    <ScrollView
      className="flex-1 bg-app"
      contentContainerStyle={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }}
    >
      <View className="px-5">
        <Text className="text-[11px] font-medium uppercase text-ink3" style={{ letterSpacing: 0.66 }}>
          {t('invites.join.eyebrow')}
        </Text>

        <View className="mt-4 rounded-panel bg-panel p-5">
          {isAutoJoining ? (
            <View className="items-center py-6">
              <ActivityIndicator />
              <Text className="mt-3 text-[14px] text-ink">
                {preview?.householdName
                  ? t('invites.join.autoJoiningNamed', { name: preview.householdName })
                  : t('invites.join.autoJoining')}
              </Text>
              <Text className="mt-1 text-[14px] text-ink2">
                {t('invites.join.autoJoiningHint')}
              </Text>
            </View>
          ) : isMissingToken ? (
            <Text className="text-[14px] leading-5 text-ink">{t('invites.join.notFound')}</Text>
          ) : isLoading ? (
            <View className="items-center py-6">
              <ActivityIndicator />
            </View>
          ) : loadError ? (
            <Text className="text-[14px] leading-5 text-alert">{loadError}</Text>
          ) : (
            <>
              <Text className="text-[19px] font-medium leading-6 text-ink">
                {t('invites.join.title', { name: preview?.householdName ?? '' })}
              </Text>
              <Text className="mt-2 text-[14px] leading-5 text-ink2">
                {preview?.invitedByName
                  ? t('invites.join.invitedBy', { name: preview.invitedByName })
                  : t('invites.join.invitedByUnknown')}
              </Text>
              <Text className="mt-3 text-[14px] leading-5 text-ink2">
                {t('invites.join.equalMembers')}
              </Text>

              <Button className="mt-6" onPress={acceptJoin} loading={isAccepting}>
                {t('invites.join.accept')}
              </Button>
              <Button className="mt-2" variant="ghost" onPress={() => router.replace('/')}>
                {t('invites.join.later')}
              </Button>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  )
}
