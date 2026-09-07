import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarClock, Calculator, RefreshCw, Target } from 'lucide-react'

import { useEntitlement } from '@money-space/core/features/billing/hooks/use-entitlement'
import { usePlans } from '@money-space/core/features/billing/hooks/use-plans'
import { formatMoney } from '@money-space/core/shared/lib/format-money'
import { usePaywallStore } from '@money-space/core/shared/stores/paywall-store'
import { cn } from '@money-space/core/shared/lib/utils'

import type { PlanCode } from '@money-space/core/features/billing/api/billing.repository'
import type { ComponentType } from 'react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusChip } from '@/components/ui/status-chip'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'

type BenefitKey = 'horizon' | 'price' | 'whatif' | 'goals'

const BENEFIT_ICONS: Record<BenefitKey, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  horizon: CalendarClock,
  price: RefreshCw,
  whatif: Calculator,
  goals: Target,
}

const BENEFIT_ORDER: BenefitKey[] = ['horizon', 'price', 'whatif', 'goals']

/**
 * Which benefit to float to the top for each wall. A household that just hit
 * the goal ceiling should read the goals row first — the rest of the list is
 * the same four either way, so this reorders rather than rewrites.
 */
const LEAD_BENEFIT: Partial<Record<string, BenefitKey>> = {
  goal_quota: 'goals',
  whatif_quota: 'whatif',
  auto_price_quota: 'price',
  forecast_horizon: 'horizon',
}

/** The plan the pricing is built around, so it is the one pre-selected. */
const DEFAULT_PLAN: PlanCode = 'premium_yearly'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN')
}

/**
 * The paywall.
 *
 * Mounted ONCE in the shell beside `<WhatIfSheet />`, for the same reason: it
 * is reachable from every screen and belongs to no route. `usePaywallStore`
 * opens it, and so does the global 402 handler — which is what guarantees that
 * a gate nobody pre-checked still surfaces as this sheet rather than as an
 * error toast.
 *
 * Nothing here hardcodes a price or a ceiling. Both come from the server:
 * prices from `GET /billing/plans`, the numbers in the headline from the 402
 * that opened it.
 */
export function PaywallSheet() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const open = usePaywallStore((store) => store.open)
  const context = usePaywallStore((store) => store.context)
  const close = usePaywallStore((store) => store.close)
  const { plans, isLoading: plansLoading } = usePlans()
  const { entitlement } = useEntitlement()

  // `null` means "nothing chosen yet in this opening", which resolves to the
  // default below. Keyed off the store's `open` rather than reset in an
  // effect: a household that browsed to the monthly plan and dismissed should
  // not find that choice still made for them the next time a different wall
  // opens, and an effect that calls setState on open would cost a second
  // render every time the sheet appears.
  const [choice, setChoice] = useState<{ open: boolean; plan: PlanCode } | null>(null)
  const selected = choice?.open === open ? choice.plan : DEFAULT_PLAN
  const setSelected = (plan: PlanCode) => setChoice({ open, plan })

  const { reason } = context
  const available = plans.filter((plan) => plan.available)
  // Falls back to whatever IS on sale — the yearly plan can be switched off in
  // config, and a paywall with no plan selected has no CTA.
  const activePlan =
    available.find((plan) => plan.planCode === selected) ?? available[0] ?? null

  const lead = LEAD_BENEFIT[reason]
  const benefits = lead
    ? [lead, ...BENEFIT_ORDER.filter((key) => key !== lead)]
    : BENEFIT_ORDER

  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => !next && close()}>
      <ResponsiveDialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[940px]">
        <ResponsiveDialogHeader>
          <p className="t-caption tracking-wide text-ink3">
            {t('billing.paywall.eyebrow')}
          </p>
          <ResponsiveDialogTitle className="t-title">
            {t(`billing.paywall.title.${reason}`, {
              limit: context.limit,
              used: context.used,
            })}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t(`billing.paywall.subtitle.${reason}`)}
          </ResponsiveDialogDescription>

          {/* An expired plan gets its date said out loud. "Hết hạn ngày X" is a
              materially different sentence from "đang dùng gói Free" — it is
              the one the household can act on. */}
          {reason === 'expired' && entitlement?.expiresAt ? (
            <StatusChip tone="attention" className="mt-2 self-start">
              {t('billing.paywall.expiredOn', {
                date: formatDate(entitlement.expiresAt),
              })}
            </StatusChip>
          ) : null}
        </ResponsiveDialogHeader>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: what the household gets, as outcomes rather than features. */}
          <section>
            <p className="t-body-sm text-ink2">{t('billing.paywall.youGet')}</p>

            <ul className="mt-3 flex flex-col rounded-card bg-card">
              {benefits.map((key, index) => {
                const Icon = BENEFIT_ICONS[key]
                return (
                  <li
                    key={key}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5',
                      index > 0 && 'border-t border-divider',
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-accent-soft">
                      <Icon className="size-[18px] text-ink2" strokeWidth={1.5} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="t-body-sm">{t(`billing.paywall.benefit.${key}.label`)}</p>
                      <p className="t-caption text-ink3">
                        {t(`billing.paywall.benefit.${key}.detail`)}
                      </p>
                    </div>
                    <p className="shrink-0 t-caption text-ink2">
                      {t(`billing.paywall.benefit.${key}.value`)}
                    </p>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* Right: the plans. The household callout sits ABOVE them — per
              household is the thing people misread as per seat, so it is
              answered before the prices rather than after. */}
          <section className="flex flex-col">
            <div className="rounded-card bg-accent-soft px-4 py-3">
              <p className="t-body-sm">{t('billing.paywall.household.title')}</p>
              <p className="mt-1 t-caption leading-5 text-ink2">
                {t('billing.paywall.household.detail')}
              </p>
            </div>

            {plansLoading ? (
              <Skeleton className="mt-4 h-32 w-full" />
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {available.map((plan) => {
                  const isSelected = activePlan?.planCode === plan.planCode
                  return (
                    <li key={plan.planCode}>
                      <button
                        type="button"
                        onClick={() => setSelected(plan.planCode)}
                        aria-pressed={isSelected}
                        className={cn(
                          'flex w-full items-center justify-between gap-4 rounded-card px-4 py-3 text-left transition-colors',
                          isSelected
                            ? 'bg-card ring-2 ring-action'
                            : 'bg-card ring-1 ring-divider hover:ring-protect',
                        )}
                      >
                        <div className="min-w-0">
                          <p className="t-body-sm">
                            {t(`settings.billing.plan.${plan.planCode}`)}
                          </p>
                          {plan.savingsAmount ? (
                            <p className="mt-0.5 t-caption text-ink3">
                              {t('settings.billing.savings', {
                                amount: formatMoney(plan.savingsAmount),
                              })}
                              {plan.monthlyEquivalent
                                ? ` · ${t('settings.billing.perMonth', {
                                    amount: formatMoney(plan.monthlyEquivalent),
                                  })}`
                                : ''}
                            </p>
                          ) : null}
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="t-body-sm">{formatMoney(plan.amount)}</p>
                          {plan.compareAtAmount ? (
                            <p className="t-caption text-ink3 line-through">
                              {formatMoney(plan.compareAtAmount)}
                            </p>
                          ) : null}
                          {/* Only when there IS a discount, and it reads the
                              server's own label. */}
                          {plan.discountPercent > 0 && plan.discountLabel ? (
                            <StatusChip tone="accent" className="mt-1">
                              {plan.discountLabel}
                            </StatusChip>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="mt-4 flex flex-col gap-2">
              {/* The CTA states the choice rather than saying "Continue".
                  Payment itself lands in Phase 4; until then the highest-intent
                  destination is the subscription page, where the code field is. */}
              <Button
                onClick={() => {
                  close()
                  navigate('/settings/subscription')
                }}
                disabled={!activePlan}
              >
                {activePlan
                  ? t('billing.paywall.cta', {
                      plan: t(`settings.billing.plan.${activePlan.planCode}`),
                      amount: formatMoney(activePlan.amount),
                    })
                  : t('settings.billing.viewPlans')}
              </Button>

              {/* Someone holding a code, at the wall, is the highest-intent
                  moment there is. */}
              <button
                type="button"
                onClick={() => {
                  close()
                  navigate('/settings/subscription')
                }}
                className="t-body-sm text-ink2 underline underline-offset-4"
              >
                {t('billing.redeem.haveCode')}
              </button>

              <p className="t-caption leading-5 text-ink3">
                {t('billing.paywall.payNote')}
              </p>

              {/* A paywall with no way out reads as a trap. */}
              <button
                type="button"
                onClick={close}
                className="mt-1 t-body-sm text-ink3"
              >
                {t('billing.paywall.later')}
              </button>
            </div>
          </section>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
