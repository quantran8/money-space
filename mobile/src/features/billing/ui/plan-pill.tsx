import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useEntitlement } from '@money-space/core/features/billing/hooks/use-entitlement'
import { usePaywallStore } from '@money-space/core/shared/stores/paywall-store'

import { Skeleton } from '@/components/ui'
import { colors } from '@/theme/tokens'

/**
 * What plan the space is on, as one word. Opens the paywall sheet — the plan
 * picker already lives there and is reachable from every screen, so this is one
 * more door into it rather than a second copy of the same list.
 */
export function PlanPill() {
  const { t } = useTranslation()
  const { entitlement, isPremium, isLoading } = useEntitlement()
  const openPaywall = usePaywallStore((store) => store.openPaywall)

  if (isLoading) return <Skeleton height={36} className="w-24 rounded-pill" />
  if (!entitlement) return null

  // A lapsed plan gets the sheet's "hết hạn ngày X" headline, not the generic one.
  const hasLapsed = entitlement.tier === 'premium' && entitlement.status === 'expired'
  // Lifetime has nothing to buy, so the pill states the fact and stops being a
  // control — the sheet would offer plans to someone who already owns forever.
  const isStatic = entitlement.isLifetime
  // The crown is on the pill either way; the TONE is what changes — amber
  // offers the plan, neutral states it.
  const hasPremium = isPremium || entitlement.isLifetime || entitlement.isTrial

  const label = entitlement.isLifetime
    ? t('settings.billing.lifetime')
    : entitlement.isTrial
      ? t('settings.billing.trial')
      : isPremium
        ? t('settings.billing.premium')
        : t('settings.billing.free')

  const content = (
    <>
      <MaterialCommunityIcons
        name="crown-outline"
        size={14}
        color={hasPremium ? colors.ink2 : colors.attentionInk}
      />
      <Text className={hasPremium ? 't-caption text-ink2' : 't-caption text-attention-ink'}>
        {label}
      </Text>
    </>
  )

  if (isStatic) {
    return (
      <View
        className="flex-row items-center gap-1.5 rounded-pill bg-wash px-3"
        style={{ minHeight: 36 }}
      >
        {content}
      </View>
    )
  }

  return (
    <Pressable
      onPress={() =>
        openPaywall({ reason: hasLapsed ? 'expired' : isPremium ? 'manage' : 'general' })
      }
      accessibilityRole="button"
      accessibilityLabel={t('settings.billing.viewPlan', { plan: label })}
      // Amber INK on the card surface, never on `attention-soft`: that pairing
      // is 4.4:1, just under AA, and this is 12px text.
      style={{
        minHeight: 36,
        backgroundColor: hasPremium ? colors.wash : colors.card,
        borderWidth: hasPremium ? 0 : 1,
        borderColor: colors.attention,
      }}
      className="flex-row items-center gap-1.5 rounded-pill px-3 active:opacity-70"
    >
      {content}
    </Pressable>
  )
}
