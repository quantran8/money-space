import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useEntitlement } from '@money-space/core/features/billing/hooks/use-entitlement'

import { Panel, PanelHeader, Skeleton, StatusChip } from '@/components/ui'

/** `2027-12-31T00:00:00Z` → `31/12/2027`. */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN')
}

/**
 * What plan the household is on, on the Gia đình hub.
 *
 * Read-only for now — redeeming a code and renewing arrive with their own
 * screen. Every figure comes from the server's `limits`, never a literal, so
 * moving a ceiling is a backend edit and this follows without a release.
 */
export function SubscriptionSection() {
  const { t } = useTranslation()
  const { entitlement, isPremium, isLoading } = useEntitlement()

  if (isLoading) {
    return (
      <Panel>
        <Skeleton height={24} className="w-32" />
        <Skeleton height={20} className="mt-4 w-48" />
      </Panel>
    )
  }
  if (!entitlement) return null

  const { isLifetime, isTrial, status, expiresAt, daysRemaining, limits } = entitlement

  const title = isLifetime
    ? t('settings.billing.lifetime')
    : isTrial
      ? t('settings.billing.trial')
      : isPremium
        ? t('settings.billing.premium')
        : t('settings.billing.free')

  // A lapsed plan names the day it ended rather than reporting "Free": the
  // household had Premium, and the date is what makes renewing an obvious step.
  const hasLapsed = entitlement.tier === 'premium' && status === 'expired'

  return (
    <Panel>
      <PanelHeader
        title={t('settings.billing.eyebrow')}
        right={
          <Text className="t-caption text-ink3">{t('settings.billing.forBothOfYou')}</Text>
        }
      />

      <Text className="mt-4 t-subtitle text-ink">{title}</Text>

      {isLifetime ? null : hasLapsed && expiresAt ? (
        <View className="mt-2">
          <StatusChip
            tone="attention"
            label={t('settings.billing.expiredOn', { date: formatDate(expiresAt) })}
          />
        </View>
      ) : isPremium && expiresAt ? (
        <Text className="mt-2 t-body-sm leading-5 text-ink2">
          {t('settings.billing.activeUntil', { date: formatDate(expiresAt) })}
          {daysRemaining !== null
            ? ` · ${t('settings.billing.daysRemaining', { count: daysRemaining })}`
            : ''}
        </Text>
      ) : null}

      {!isPremium ? (
        <Text className="mt-2 t-body-sm leading-5 text-ink2">
          {limits && limits.goals !== null && limits.whatIfPerMonth !== null
            ? t('settings.billing.freeDescription', {
                goals: limits.goals,
                whatIf: limits.whatIfPerMonth,
              })
            : t('settings.billing.freeDescriptionUnlimited')}
        </Text>
      ) : null}
    </Panel>
  )
}
