import { useCallback } from 'react'

import { useEntitlement } from '#/features/billing/hooks/use-entitlement'
import {
  usePaywallStore,
  type PaywallContext,
  type PaywallReason,
} from '#/shared/stores/paywall-store'

import type { PlanLimits } from '#/features/billing/api/billing.repository'

type CountedQuota = 'goals' | 'whatIfPerMonth' | 'marketPricedAssets'

export type PremiumActionOptions = {
  reason: PaywallReason
  /**
   * The counted quota this action consumes, when it consumes one. Given it,
   * the hook compares the household's current usage against its ceiling and
   * opens the paywall BEFORE the request — so the third goal shows the sheet
   * on click rather than after a round trip that was always going to fail.
   */
  quota?: CountedQuota
}

/**
 * Run an action only if the plan allows it; otherwise open the paywall.
 *
 * This is the OPTIMISTIC half of the gate and it is deliberately not the
 * enforcement — the server refuses independently, and the global 402 handler
 * opens the same sheet when it does. What this buys is the difference between
 * a wall that explains itself instantly and one that explains itself after a
 * network round trip.
 *
 * It fails OPEN in every uncertain case: entitlement still loading, usage not
 * loaded, a quota with no ceiling. A paywall shown to someone who has already
 * paid is far more damaging than one shown a beat late, and the server is
 * always the last word.
 */
export function usePremiumAction() {
  const { entitlement, isPremium, isLoading } = useEntitlement()
  const openPaywall = usePaywallStore((store) => store.openPaywall)

  const check = useCallback(
    ({ reason, quota }: PremiumActionOptions): boolean => {
      // Premium, or we do not know yet: let it through and let the server rule.
      if (isPremium || isLoading || !entitlement) return true

      // A boolean feature with no counter attached. The caller has already
      // decided it is out of reach (a 60-day horizon on a free plan), so the
      // only thing left is to say so.
      if (!quota) {
        openPaywall({ reason, limits: entitlement.limits })
        return false
      }

      const limit = entitlement.limits[quota as keyof PlanLimits] as number | null
      // `null` is unlimited, never zero.
      if (limit === null || limit === undefined) return true

      const used = usageFor(entitlement.usage, quota)
      // Usage is only present on the entitlement query that asks for it. With
      // no count there is nothing to compare, so the request goes out and the
      // 402 handler catches it if it was over.
      if (used === null) return true
      if (used < limit) return true

      openPaywall({ reason, limit, used, limits: entitlement.limits })
      return false
    },
    [entitlement, isPremium, isLoading, openPaywall],
  )

  /**
   * `run(action)` — the shape the callers use. The action fires only when the
   * plan allows it, and its return value is passed straight back so this can
   * wrap a mutation without changing its signature.
   */
  const run = useCallback(
    <T,>(options: PremiumActionOptions, action: () => T): T | undefined => {
      if (!check(options)) return undefined
      return action()
    },
    [check],
  )

  return { run, check, isPremium }
}

function usageFor(
  usage: { goals: number; whatIfThisMonth: number; marketPricedAssets: number } | undefined,
  quota: CountedQuota,
): number | null {
  if (!usage) return null
  if (quota === 'goals') return usage.goals
  if (quota === 'whatIfPerMonth') return usage.whatIfThisMonth
  return usage.marketPricedAssets
}

export type { PaywallContext }
