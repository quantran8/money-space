import { apiRequest } from '#/shared/api/http'

export type SubscriptionTier = 'free' | 'premium'
export type SubscriptionStatus = 'active' | 'expired'
export type EntitlementSource = 'redeem_code' | 'payment' | 'manual_grant' | 'trial'

export type PlanCode = 'premium_monthly' | 'premium_yearly' | 'premium_lifetime'

/**
 * What a tier allows. `null` means unlimited, never zero.
 *
 * Sent by the server inside every entitlement response, so no screen hardcodes
 * a ceiling — changing what Free includes is a backend edit, with no app-store
 * release on either client.
 */
export type PlanLimits = {
  goals: number | null
  whatIfPerMonth: number | null
  marketPricedAssets: number | null
  forecastHorizons: number[]
  historyMonths: number | null
  exportData: boolean
}

export type EntitlementUsage = {
  goals: number
  whatIfThisMonth: number
  marketPricedAssets: number
}

export type Entitlement = {
  householdId: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  /** `null` + premium = lifetime; `null` + free = never purchased. */
  expiresAt: string | null
  isLifetime: boolean
  /** Computed server-side: a device clock can be wrong. */
  daysRemaining: number | null
  source: EntitlementSource | null
  isTrial: boolean
  trialUsed: boolean
  limits: PlanLimits
  usage?: EntitlementUsage
}

export type PlanOffer = {
  planCode: PlanCode
  amountOriginal: number
  amount: number
  discountAmount: number
  discountPercent: number
  discountLabel: string | null
  /** Yearly only: what is saved against twelve monthly payments. */
  savingsAmount: number | null
  monthlyEquivalent: number | null
  /** Price to strike through, or `null` when there is nothing to compare to. */
  compareAtAmount: number | null
  durationDays: number | null
  available: boolean
}

export function fetchEntitlement(householdId: string) {
  return apiRequest<Entitlement>(`/households/${householdId}/entitlement`)
}

/** Public: the pricing table is shown before anyone signs in. */
export function fetchPlans() {
  return apiRequest<{ items: PlanOffer[]; total: number }>('/billing/plans', {
    skipAuth: true,
  })
}
