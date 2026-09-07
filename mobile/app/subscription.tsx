import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useEntitlement } from '@money-space/core/features/billing/hooks/use-entitlement'
import { usePlans } from '@money-space/core/features/billing/hooks/use-plans'
import { formatMoney } from '@money-space/core/shared/lib/format-money'
import { useNavigate } from '@money-space/core/shared/navigation'

import {
  BackLink,
  Panel,
  PanelHeader,
  Screen,
  Sections,
  Skeleton,
  StatusChip,
} from '@/components/ui'
import { RedeemCodeForm } from '@/features/billing/ui/redeem-code-form'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN')
}

/**
 * `/subscription` — the plan, reached from Gia đình.
 *
 * Not a sixth tab: the bar is capped at five (§13), and this is an occasional
 * question rather than a destination people live in.
 *
 * **Deliberately shows prices but sells nothing.** There is no button to a
 * payment page, because the App Store rejects apps that link out to purchase.
 * A code field is fine — entering one is not a transaction — and the renewal
 * line names the website in plain words rather than as a tappable link.
 */
export default function SubscriptionScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { entitlement, isPremium, isLoading, refetch, isRefetching } =
    useEntitlement()
  const { plans, isLoading: plansLoading } = usePlans()

  return (
    <Screen
      title={t('settings.billing.eyebrow')}
      withoutTabBar
      onRefresh={() => void refetch()}
      refreshing={isRefetching}
    >
      <BackLink label={t('nav.household')} onPress={() => navigate('/household')} />

      <Sections>
        <Panel>
          <PanelHeader
            title={t('settings.billing.eyebrow')}
            right={
              <Text className="t-caption text-ink3">
                {t('settings.billing.forBothOfYou')}
              </Text>
            }
          />

          {isLoading || !entitlement ? (
            <Skeleton height={24} className="mt-4 w-40" />
          ) : (
            <View className="mt-4">
              <Text className="t-subtitle text-ink">
                {entitlement.isLifetime
                  ? t('settings.billing.lifetime')
                  : entitlement.isTrial
                    ? t('settings.billing.trial')
                    : isPremium
                      ? t('settings.billing.premium')
                      : t('settings.billing.free')}
              </Text>

              {entitlement.isLifetime ? null : entitlement.tier === 'premium' &&
                entitlement.status === 'expired' &&
                entitlement.expiresAt ? (
                <View className="mt-2">
                  <StatusChip
                    tone="attention"
                    label={t('settings.billing.expiredOn', {
                      date: formatDate(entitlement.expiresAt),
                    })}
                  />
                </View>
              ) : isPremium && entitlement.expiresAt ? (
                <Text className="mt-2 t-body-sm leading-5 text-ink2">
                  {t('settings.billing.activeUntil', {
                    date: formatDate(entitlement.expiresAt),
                  })}
                  {entitlement.daysRemaining !== null
                    ? ` · ${t('settings.billing.daysRemaining', {
                        count: entitlement.daysRemaining,
                      })}`
                    : ''}
                </Text>
              ) : null}
            </View>
          )}
        </Panel>

        <Panel>
          <RedeemCodeForm />
        </Panel>

        <Panel>
          <PanelHeader title={t('settings.billing.plans')} />

          {plansLoading ? (
            <Skeleton height={64} className="mt-4" />
          ) : (
            <View className="mt-4 gap-3">
              {plans.map((plan) => (
                <View
                  key={plan.planCode}
                  className="flex-row items-start justify-between gap-4"
                >
                  <View className="min-w-0 flex-1">
                    <Text className="t-body text-ink">
                      {t(`settings.billing.plan.${plan.planCode}`)}
                    </Text>
                    {plan.savingsAmount ? (
                      <Text className="mt-1 t-caption text-ink3">
                        {t('settings.billing.savings', {
                          amount: formatMoney(plan.savingsAmount),
                        })}
                      </Text>
                    ) : null}
                  </View>

                  <View className="items-end">
                    <Text className="t-body text-ink">{formatMoney(plan.amount)}</Text>
                    {plan.compareAtAmount ? (
                      <Text className="t-caption text-ink3 line-through">
                        {formatMoney(plan.compareAtAmount)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}

          <Text className="mt-4 t-caption leading-5 text-ink3">
            {t('settings.billing.payHint')}
          </Text>
        </Panel>
      </Sections>
    </Screen>
  )
}
