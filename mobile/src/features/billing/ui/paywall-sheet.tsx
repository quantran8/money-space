import { Platform, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { CalendarClock, Calculator, RefreshCw, Target } from 'lucide-react-native'

import { useEntitlement } from '@money-space/core/features/billing/hooks/use-entitlement'
import { usePlans } from '@money-space/core/features/billing/hooks/use-plans'
import { useStorePurchase } from '@money-space/core/features/billing/hooks/use-store-purchase'
import { useStartTrial } from '@money-space/core/features/billing/hooks/use-start-trial'
import { formatMoney } from '@money-space/core/shared/lib/format-money'
import { useNavigate } from '@money-space/core/shared/navigation'
import { usePaywallStore } from '@money-space/core/shared/stores/paywall-store'

import { BottomSheet, Button, Skeleton, StatusChip } from '@/components/ui'
import { PurchaseStatus } from '@/features/billing/ui/purchase-status'
import { colors } from '@/theme/tokens'

type BenefitKey = 'horizon' | 'price' | 'whatif' | 'goals'

const BENEFIT_ICONS = {
  horizon: CalendarClock,
  price: RefreshCw,
  whatif: Calculator,
  goals: Target,
} as const

const BENEFIT_ORDER: BenefitKey[] = ['horizon', 'price', 'whatif', 'goals']

/** The wall that was hit decides which benefit is read first. */
const LEAD_BENEFIT: Partial<Record<string, BenefitKey>> = {
  goal_quota: 'goals',
  whatif_quota: 'whatif',
  auto_price_quota: 'price',
  forecast_horizon: 'horizon',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN')
}

/**
 * The paywall, on a phone.
 *
 * Mounted ONCE in the tab layout beside `<WhatIfSheet />`, and opened from
 * core's `paywall-store` — including by the global 402 handler, which is shared
 * with the web.
 *
 * **Sells through the store, never a link out** — App Store and Play forbid
 * steering to an outside payment flow. Prices come from the store, and a
 * purchase grants nothing on the device. See memory/billing.md.
 */
export function PaywallSheet() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const open = usePaywallStore((store) => store.open)
  const context = usePaywallStore((store) => store.context)
  const close = usePaywallStore((store) => store.close)
  const { plans, isLoading: plansLoading } = usePlans()
  const { entitlement } = useEntitlement()
  const {
    isAvailable: canBuyInApp,
    productFor,
    isLoadingProducts,
    buy,
    restore,
    state: purchaseState,
    isBusy,
  } = useStorePurchase()
  // Closes on success: the wall they hit is down.
  const trial = useStartTrial(close)

  const { reason } = context
  const available = plans.filter((plan) => plan.available)

  const lead = LEAD_BENEFIT[reason]
  const benefits: BenefitKey[] = lead
    ? [lead, ...BENEFIT_ORDER.filter((key) => key !== lead)]
    : BENEFIT_ORDER

  return (
    <BottomSheet
      open={open}
      onClose={close}
      title={t(`billing.paywall.title.${reason}`, {
        limit: context.limit,
        used: context.used,
      })}
      footer={
        <View className="gap-2">
          {/* Above the secondary actions, below the per-plan buy buttons in the
              body. Hidden once `trialUsed` is true. */}
          {trial.canStartTrial ? (
            <>
              <Button
                variant="secondary"
                loading={trial.pending}
                onPress={() => void trial.start()}
              >
                {t('billing.paywall.trial.cta', { days: trial.trialDays })}
              </Button>
              <Text className="t-caption text-ink3">
                {t('billing.paywall.trial.note', { days: trial.trialDays })}
              </Text>
            </>
          ) : null}
          {/* A code is not a purchase, so it sits beside the store buttons
              rather than competing with them. */}
          <Button
            variant="ghost"
            onPress={() => {
              close()
              navigate('/subscription')
            }}
          >
            {t('billing.redeem.haveCode')}
          </Button>
          {/* Apple requires this and rejects builds without one. */}
          {canBuyInApp ? (
            <Button variant="ghost" loading={isBusy} onPress={restore}>
              {t('billing.paywall.store.restore')}
            </Button>
          ) : null}
          <Button variant="ghost" onPress={close}>
            {t('billing.paywall.later')}
          </Button>
        </View>
      }
    >
      <Text className="t-body-sm text-ink2">
        {t(`billing.paywall.subtitle.${reason}`)}
      </Text>

      {reason === 'expired' && entitlement?.expiresAt ? (
        <View className="mt-3 flex-row">
          <StatusChip
            tone="attention"
            label={t('billing.paywall.expiredOn', {
              date: formatDate(entitlement.expiresAt),
            })}
          />
        </View>
      ) : null}

      {/* Per household, said before the prices — it is the thing people
          misread as per seat. */}
      <View className="mt-4 rounded-card bg-accent-soft px-4 py-3">
        <Text className="t-body-sm text-ink">{t('billing.paywall.household.title')}</Text>
        <Text className="mt-1 t-caption text-ink2">
          {t('billing.paywall.household.detail')}
        </Text>
      </View>

      <Text className="mt-5 t-body-sm text-ink2">{t('billing.paywall.youGet')}</Text>
      <View className="mt-2 rounded-card bg-card">
        {benefits.map((key, index) => {
          const Icon = BENEFIT_ICONS[key]
          return (
            <View
              key={key}
              className={`flex-row items-center gap-3 px-4 py-3.5 ${
                index > 0 ? 'border-t border-hair' : ''
              }`}
            >
              <View className="size-9 items-center justify-center rounded-pill bg-accent-soft">
                <Icon size={18} strokeWidth={1.5} color={colors.ink2} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="t-body-sm text-ink">
                  {t(`billing.paywall.benefit.${key}.label`)}
                </Text>
                <Text className="t-caption text-ink3">
                  {t(`billing.paywall.benefit.${key}.detail`)}
                </Text>
              </View>
              <Text className="t-caption text-ink2">
                {t(`billing.paywall.benefit.${key}.value`)}
              </Text>
            </View>
          )
        })}
      </View>

      {/* One row per plan. The price is the STORE's string, not ours. */}
      {plansLoading || (canBuyInApp && isLoadingProducts) ? (
        <Skeleton height={80} className="mt-4 w-full" />
      ) : (
        <View className="mt-4 gap-2">
          {available.map((plan) => {
            const product = productFor(plan.planCode)
            const priceLabel = product?.priceString ?? formatMoney(plan.amount)
            const planLabel = t(`settings.billing.plan.${plan.planCode}`)
            const isThisPlan =
              purchaseState.status === 'purchasing' &&
              purchaseState.planCode === plan.planCode

            return (
              <View key={plan.planCode} className="gap-2">
                {canBuyInApp && product ? (
                  <Button loading={isThisPlan} onPress={() => buy(plan.planCode)}>
                    {t('billing.paywall.store.buy', {
                      plan: planLabel,
                      price: priceLabel,
                    })}
                  </Button>
                ) : (
                  /* No store product — Expo Go, or a plan not yet configured
                     in App Store Connect. Price shown, but nothing to press. */
                  <View className="flex-row items-center justify-between gap-4 rounded-card bg-card px-4 py-3">
                    <Text className="t-body-sm text-ink">{planLabel}</Text>
                    <Text className="t-body-sm text-ink">{priceLabel}</Text>
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

      {canBuyInApp ? (
        <Text className="mt-4 t-caption text-ink3">
          {t('billing.paywall.store.renewNote', {
            store: t(
              Platform.OS === 'ios'
                ? 'billing.paywall.store.appStore'
                : 'billing.paywall.store.playStore',
            ),
          })}
        </Text>
      ) : (
        <Text className="mt-4 t-caption text-ink3">
          {t('billing.paywall.mobileNote')}
        </Text>
      )}
    </BottomSheet>
  )
}
