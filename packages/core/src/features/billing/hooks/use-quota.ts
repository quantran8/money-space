import { useEntitlement } from '#/features/billing/hooks/use-entitlement'

export type CountedQuota = 'goals' | 'whatIfPerMonth' | 'marketPricedAssets'

export type QuotaState = {
  used: number
  limit: number
  remaining: number
  /** Nothing left. The next attempt opens the paywall. */
  isExhausted: boolean
  /** One left. The line is worth showing before the household is stopped. */
  isLastOne: boolean
}

const USAGE_FIELD = {
  goals: 'goals',
  whatIfPerMonth: 'whatIfThisMonth',
  marketPricedAssets: 'marketPricedAssets',
} as const

/**
 * How much of a counted quota is left — for DISPLAY only.
 *
 * Deliberately separate from `usePremiumAction`: that hook's `check` opens the
 * paywall as a side effect, which is right when someone clicks and wrong during
 * render. This one only reads, so a screen can say "còn 1 lượt" without a sheet
 * appearing on its own.
 *
 * Returns `null` — meaning "say nothing" — for premium, for an unlimited
 * ceiling, and while the entitlement is still loading. A household that has
 * paid must never be shown a counter, and a number that flickers in from
 * `undefined` reads as a limit being imposed.
 */
export function useQuota(quota: CountedQuota): QuotaState | null {
  const { entitlement, isPremium, isLoading } = useEntitlement()

  if (isLoading || !entitlement || isPremium) return null

  const limit = entitlement.limits[quota]
  // `null` is unlimited, never zero.
  if (limit === null || limit === undefined) return null

  // `usage` rides only on `GET /entitlement`, which is the query this reads —
  // but a cached response from before that field existed would not have it.
  const used = entitlement.usage?.[USAGE_FIELD[quota]]
  if (used === undefined) return null

  const remaining = Math.max(0, limit - used)

  return {
    used,
    limit,
    remaining,
    isExhausted: remaining === 0,
    isLastOne: remaining === 1,
  }
}
