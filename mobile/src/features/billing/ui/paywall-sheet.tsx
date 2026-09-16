import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { PlanCode } from '@money-space/core/features/billing/api/billing.repository'

import { useEntitlement } from '@money-space/core/features/billing/hooks/use-entitlement'
import { usePlans } from '@money-space/core/features/billing/hooks/use-plans'
import { useStorePurchase } from '@money-space/core/features/billing/hooks/use-store-purchase'
import { useStartTrial } from '@money-space/core/features/billing/hooks/use-start-trial'
import { formatMoney } from '@money-space/core/shared/lib/format-money'
import { usePaywallStore } from '@money-space/core/shared/stores/paywall-store'

import { BottomSheet, Button, Skeleton, StatusChip } from '@/components/ui'
import { PurchaseStatus } from '@/features/billing/ui/purchase-status'
import { TOUCH_TARGET, colors } from '@/theme/tokens'

type BenefitKey = 'horizon' | 'price' | 'whatif' | 'goals'

const BENEFIT_ICONS = {
  horizon: 'time',
  price: 'refresh',
  whatif: 'calculator',
  goals: 'flag',
} as const satisfies Record<BenefitKey, React.ComponentProps<typeof Ionicons>['name']>

const BENEFIT_ORDER: BenefitKey[] = ['horizon', 'price', 'whatif', 'goals']

/** The plan the pricing is built around, so it is the one pre-selected. */
const DEFAULT_PLAN: PlanCode = 'premium_yearly'

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
  const open = usePaywallStore((store) => store.open)
  const context = usePaywallStore((store) => store.context)
  const close = usePaywallStore((store) => store.close)
  const openRedeem = usePaywallStore((store) => store.openRedeem)
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

  /* `null` means "nothing chosen yet in this opening", which resolves to the
     default below. Keyed off the store's `open` rather than reset in an effect:
     a household that browsed to the monthly plan and dismissed should not find
     that choice still made for them the next time a wall opens. */
  const [choice, setChoice] = useState<{ open: boolean; plan: PlanCode } | null>(null)

  const { reason } = context
  const available = plans.filter((plan) => plan.available)

  const selected = choice?.open === open ? choice.plan : DEFAULT_PLAN
  const setSelected = (plan: PlanCode) => setChoice({ open, plan })
  // Falls back to whatever IS on sale — the yearly plan can be switched off in
  // config, and a paywall with no plan selected has no CTA.
  const activePlan =
    available.find((plan) => plan.planCode === selected) ?? available[0] ?? null

  const lead = LEAD_BENEFIT[reason]
  const benefits: BenefitKey[] = lead
    ? [lead, ...BENEFIT_ORDER.filter((key) => key !== lead)]
    : BENEFIT_ORDER

  return (
    <BottomSheet
      open={open}
      onClose={close}
      // One header for every wall, as on the web. Which limit was hit is still
      // visible — the benefits list below reorders to lead with it.
      title={t('billing.paywall.eyebrow')}
      footer={
        // Restore is the only thing the sheet pins: Apple requires it and
        // rejects builds without one. Everything else — the CTA, the trial, the
        // code link — flows with the plans in the body, as on the web.
        canBuyInApp ? (
          <Button variant="ghost" loading={isBusy} onPress={restore}>
            {t('billing.paywall.store.restore')}
          </Button>
        ) : (
          <Button variant="ghost" onPress={close}>
            {t('billing.paywall.later')}
          </Button>
        )
      }
    >
      <Text className="t-body-sm text-ink2">{t('billing.paywall.headerSubtitle')}</Text>

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
          const glyph = BENEFIT_ICONS[key]
          return (
            <View
              key={key}
              className={`flex-row items-center gap-3 px-4 py-3.5 ${
                index > 0 ? 'border-t border-hair' : ''
              }`}
            >
              <View className="size-9 items-center justify-center rounded-pill bg-accent-soft">
                <Ionicons name={glyph} size={18} color={colors.ink2} />
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

      {/* One CARD per plan, chosen then bought — the web's shape. The price
          leads: it is the fact being compared, and the plan name labels it. */}
      {plansLoading || (canBuyInApp && isLoadingProducts) ? (
        <Skeleton height={200} className="mt-4 w-full" />
      ) : (
        <View className="mt-4 gap-2">
          {available.map((plan) => {
            const product = productFor(plan.planCode)
            const priceLabel = product?.priceString ?? formatMoney(plan.amount)
            const isSelected = activePlan?.planCode === plan.planCode

            return (
              <Pressable
                key={plan.planCode}
                onPress={() => setSelected(plan.planCode)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={{
                  backgroundColor: colors.card,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? colors.action : colors.divider,
                }}
                className="rounded-card px-4 py-3"
              >
                <View className="flex-row items-start justify-between gap-4">
                  <Text className="t-subhead text-ink" style={{ fontVariant: ['tabular-nums'] }}>
                    {priceLabel}
                  </Text>
                  {plan.discountPercent > 0 && plan.discountLabel ? (
                    <StatusChip tone="neutral" label={plan.discountLabel} />
                  ) : null}
                </View>

                <View className="mt-0.5 flex-row items-baseline justify-between gap-4">
                  <Text className="t-body-sm text-ink2">
                    {t(`settings.billing.plan.${plan.planCode}`)}
                  </Text>
                  {plan.compareAtAmount ? (
                    <Text
                      className="t-caption text-ink3"
                      style={{ textDecorationLine: 'line-through' }}
                    >
                      {formatMoney(plan.compareAtAmount)}
                    </Text>
                  ) : null}
                </View>

                {plan.savingsAmount ? (
                  <Text className="mt-0.5 t-caption text-ink3">
                    {t('settings.billing.savings', {
                      amount: formatMoney(plan.savingsAmount),
                    }) +
                      (plan.monthlyEquivalent
                        ? ` · ${t('settings.billing.perMonth', {
                            amount: formatMoney(plan.monthlyEquivalent),
                          })}`
                        : '')}
                  </Text>
                ) : null}
              </Pressable>
            )
          })}
        </View>
      )}

      {/* The CTA states the CHOICE rather than saying "Continue". The purchase
          still goes through the store — Apple and Play forbid steering to an
          outside payment flow — so this buys the selected plan rather than
          opening the web's checkout. */}
      {activePlan ? (
        <Button
          className="mt-4"
          loading={isBusy || purchaseState.status === 'purchasing'}
          // Never disabled (§22.10): with no store product — Expo Go, or a plan
          // not yet in App Store Connect — the press is a no-op and the note
          // below says why, rather than a dead control that explains nothing.
          onPress={() => canBuyInApp && buy(activePlan.planCode)}
        >
          {t('billing.paywall.cta', {
            plan: t(`settings.billing.plan.${activePlan.planCode}`),
            amount:
              productFor(activePlan.planCode)?.priceString ??
              formatMoney(activePlan.amount),
          })}
        </Button>
      ) : null}

      {/* UNDER the paid CTA: the trial is the cheaper ask, but paying is still
          the primary action. Hidden once `trialUsed` is true — a button that can
          only be refused is worse than no button. */}
      {trial.canStartTrial ? (
        <>
          <Button
            className="mt-2"
            variant="secondary"
            loading={trial.pending}
            onPress={() => void trial.start()}
          >
            {t('billing.paywall.trial.cta', { days: trial.trialDays })}
          </Button>
          <Text className="mt-2 t-caption leading-5 text-ink3">
            {t('billing.paywall.trial.note', { days: trial.trialDays })}
          </Text>
        </>
      ) : null}

      {/* Someone holding a code, at the wall, is the highest-intent moment there
          is. `openRedeem` SWAPS this sheet for that one — siblings, never
          stacked. A quiet underlined link, not a third button competing with
          the two above it. */}
      <Pressable
        onPress={openRedeem}
        accessibilityRole="button"
        style={{ minHeight: TOUCH_TARGET }}
        className="items-center justify-center active:opacity-70"
      >
        <Text
          className="t-body-sm text-ink2"
          style={{ textDecorationLine: 'underline' }}
        >
          {t('billing.redeem.haveCode')}
        </Text>
      </Pressable>

      <PurchaseStatus state={purchaseState} />

      {canBuyInApp ? (
        <Text className="t-caption leading-5 text-ink3">
          {t('billing.paywall.store.renewNote', {
            store: t(
              Platform.OS === 'ios'
                ? 'billing.paywall.store.appStore'
                : 'billing.paywall.store.playStore',
            ),
          })}
        </Text>
      ) : (
        <Text className="t-caption leading-5 text-ink3">
          {t('billing.paywall.mobileNote')}
        </Text>
      )}
    </BottomSheet>
  )
}
