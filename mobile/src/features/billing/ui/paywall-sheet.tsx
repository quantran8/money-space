import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { CalendarClock, Calculator, RefreshCw, Target } from 'lucide-react-native'

import { useEntitlement } from '@money-space/core/features/billing/hooks/use-entitlement'
import { usePlans } from '@money-space/core/features/billing/hooks/use-plans'
import { formatMoney } from '@money-space/core/shared/lib/format-money'
import { useNavigate } from '@money-space/core/shared/navigation'
import { usePaywallStore } from '@money-space/core/shared/stores/paywall-store'

import { BottomSheet, Button, Skeleton, StatusChip } from '@/components/ui'
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
 * **It shows prices and takes a code, but has no button to a payment page.**
 * App Store rules: an app may not steer to an outside payment flow. The
 * renewal line names the website in plain words instead, and the code field is
 * fine — entering one is not a transaction.
 */
export function PaywallSheet() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const open = usePaywallStore((store) => store.open)
  const context = usePaywallStore((store) => store.context)
  const close = usePaywallStore((store) => store.close)
  const { plans, isLoading: plansLoading } = usePlans()
  const { entitlement } = useEntitlement()

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
          {/* The code field, not a checkout. Someone holding a code at the wall
              is the highest-intent moment there is, and it is not a purchase. */}
          <Button
            onPress={() => {
              close()
              navigate('/subscription')
            }}
          >
            {t('billing.redeem.haveCode')}
          </Button>
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

      {/* Prices are shown — that is allowed, and the household needs to know
          what the thing costs. What is absent is any way to pay from here. */}
      {plansLoading ? (
        <Skeleton height={80} className="mt-4 w-full" />
      ) : (
        <View className="mt-4 gap-2">
          {available.map((plan) => (
            <View
              key={plan.planCode}
              className="flex-row items-center justify-between gap-4 rounded-card bg-card px-4 py-3"
            >
              <View className="min-w-0">
                <Text className="t-body-sm text-ink">
                  {t(`settings.billing.plan.${plan.planCode}`)}
                </Text>
                {plan.savingsAmount ? (
                  <Text className="mt-0.5 t-caption text-ink3">
                    {t('settings.billing.savings', {
                      amount: formatMoney(plan.savingsAmount),
                    })}
                  </Text>
                ) : null}
              </View>
              <View className="items-end">
                <Text className="t-body-sm text-ink">{formatMoney(plan.amount)}</Text>
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

      <Text className="mt-4 t-caption text-ink3">{t('billing.paywall.mobileNote')}</Text>
    </BottomSheet>
  )
}
