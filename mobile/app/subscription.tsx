import { Platform, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useEntitlement } from '@money-space/core/features/billing/hooks/use-entitlement'
import { usePlans } from '@money-space/core/features/billing/hooks/use-plans'
import { useStorePurchase } from '@money-space/core/features/billing/hooks/use-store-purchase'
import { formatMoney } from '@money-space/core/shared/lib/format-money'
import { useNavigate } from '@money-space/core/shared/navigation'

import {
  BackLink,
  Button,
  Panel,
  PanelHeader,
  Screen,
  Sections,
  Skeleton,
  StatusChip,
} from '@/components/ui'
import { PurchaseStatus } from '@/features/billing/ui/purchase-status'
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
 * **Sells through the store, never a link out** — the App Store rejects apps
 * that link out to purchase. The code field stays; entering one is not a
 * transaction. See memory/billing.md.
 */
export default function SubscriptionScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { entitlement, isPremium, isLoading, refetch, isRefetching } =
    useEntitlement()
  const { plans, isLoading: plansLoading } = usePlans()
  const {
    isAvailable: canBuyInApp,
    productFor,
    isLoadingProducts,
    buy,
    restore,
    state: purchaseState,
    isBusy,
  } = useStorePurchase()

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

          {plansLoading || (canBuyInApp && isLoadingProducts) ? (
            <Skeleton height={64} className="mt-4" />
          ) : (
            <View className="mt-4 gap-3">
              {plans
                .filter((plan) => plan.available)
                .map((plan) => {
                  const product = productFor(plan.planCode)
                  const planLabel = t(`settings.billing.plan.${plan.planCode}`)
                  // The store's price wins wherever there is one.
                  const priceLabel = product?.priceString ?? formatMoney(plan.amount)
                  const isThisPlan =
                    purchaseState.status === 'purchasing' &&
                    purchaseState.planCode === plan.planCode

                  return (
                    <View key={plan.planCode} className="gap-2">
                      {canBuyInApp && product ? (
                        <Button
                          loading={isThisPlan}
                          onPress={() => buy(plan.planCode)}
                        >
                          {t('billing.paywall.store.buy', {
                            plan: planLabel,
                            price: priceLabel,
                          })}
                        </Button>
                      ) : (
                        <View className="flex-row items-start justify-between gap-4">
                          <Text className="min-w-0 flex-1 t-body text-ink">
                            {planLabel}
                          </Text>
                          <Text className="t-body text-ink">{priceLabel}</Text>
                        </View>
                      )}
                      {plan.savingsAmount ? (
                        <Text className="t-caption text-ink3">
                          {t('settings.billing.savings', {
                            amount: formatMoney(plan.savingsAmount),
                          })}
                        </Text>
                      ) : null}
                    </View>
                  )
                })}
            </View>
          )}

          <PurchaseStatus state={purchaseState} />

          {/* Apple requires this and rejects builds without one. */}
          {canBuyInApp ? (
            <View className="mt-4">
              <Button variant="ghost" loading={isBusy} onPress={restore}>
                {t('billing.paywall.store.restore')}
              </Button>
            </View>
          ) : null}

          <Text className="mt-4 t-caption leading-5 text-ink3">
            {canBuyInApp
              ? t('billing.paywall.store.renewNote', {
                  store: t(
                    Platform.OS === 'ios'
                      ? 'billing.paywall.store.appStore'
                      : 'billing.paywall.store.playStore',
                  ),
                })
              : t('settings.billing.payHint')}
          </Text>
        </Panel>
      </Sections>
    </Screen>
  )
}
