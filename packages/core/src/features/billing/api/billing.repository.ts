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

/** Why a code cannot be used. A code, not a sentence — the client owns the copy. */
export type RedeemFailureReason =
  | 'invalid'
  | 'expired'
  | 'exhausted'
  | 'already_used'
  | 'no_effect'
  | 'rate_limited'

export type RedeemCodePreview = {
  code: string
  valid: boolean
  reason: RedeemFailureReason | null
  /** Which household this would activate — catches the wrong-household case. */
  householdName: string
  grant: {
    addedDays: number
    /** ISO. `null` = lifetime. */
    periodEndAfter: string | null
    /** True when this extends a period that is still running. */
    stacked: boolean
    isLifetime: boolean
  } | null
}

export type RedeemCodeResult = {
  redeemed: true
  code: string
  addedDays: number
  /** The new state in full, so nothing has to be refetched. */
  entitlement: Entitlement
}

export type PaymentOrderStatus = 'pending' | 'paid' | 'cancelled' | 'expired'

/** Which route paid for an order. `revenuecat` is an in-app purchase. */
export type PaymentProvider = 'payos' | 'revenuecat'
export type PurchaseStore = 'app_store' | 'play_store'

export type PaymentOrder = {
  /**
   * A string on the wire: PayOS's order code is a BigInt server-side. For an
   * in-app purchase there is no order code at all — the server sends the store
   * transaction id instead, so every row has something quotable to support.
   */
  orderCode: string
  status: PaymentOrderStatus
  planCode: PlanCode
  amount: number
  createdAt?: string
  paidAt: string | null
  provider?: PaymentProvider
  store?: PurchaseStore | null
}

export type CreatedOrder = {
  orderCode: string
  /** PayOS's hosted page, with the QR already on it. */
  checkoutUrl: string
  amount: number
  planCode: PlanCode
  expiresAt: string
}

/**
 * Open a checkout.
 *
 * Only the PLAN is sent. The amount is resolved server-side from the same
 * catalogue the prices come from — a client that could name its own price
 * could buy a lifetime plan for 1.000đ.
 */
export function createPaymentOrder(householdId: string, planCode: PlanCode) {
  return apiRequest<CreatedOrder>(`/households/${householdId}/payments/orders`, {
    method: 'POST',
    body: JSON.stringify({ planCode }),
  })
}

/** Where one order stands. The return page polls this. */
export function fetchPaymentOrder(householdId: string, orderCode: string) {
  return apiRequest<PaymentOrder>(
    `/households/${householdId}/payments/orders/${orderCode}`,
  )
}

export function fetchPaymentOrders(householdId: string) {
  return apiRequest<{ items: PaymentOrder[]; total: number }>(
    `/households/${householdId}/payments/orders`,
  )
}

export function cancelPaymentOrder(householdId: string, orderCode: string) {
  return apiRequest<{ cancelled: boolean; status: PaymentOrderStatus }>(
    `/households/${householdId}/payments/orders/${orderCode}/cancel`,
    { method: 'POST' },
  )
}

export function fetchEntitlement(householdId: string) {
  return apiRequest<Entitlement>(`/households/${householdId}/entitlement`)
}

/** What the code would do. Does not spend it. */
export function previewRedeemCode(householdId: string, code: string) {
  return apiRequest<RedeemCodePreview>(
    `/households/${householdId}/redeem-codes/preview`,
    { method: 'POST', body: JSON.stringify({ code }) },
  )
}

export function redeemCode(householdId: string, code: string) {
  return apiRequest<RedeemCodeResult>(
    `/households/${householdId}/redeem-codes/redeem`,
    { method: 'POST', body: JSON.stringify({ code }) },
  )
}

/** Public: the pricing table is shown before anyone signs in. */
export function fetchPlans() {
  return apiRequest<{ items: PlanOffer[]; total: number }>('/billing/plans', {
    skipAuth: true,
  })
}

/**
 * Tell the server which household a RevenueCat subscriber's purchases pay for.
 *
 * Called BEFORE the store sheet opens, and this is what makes a renewal
 * settleable a year later: Apple charges the card with no app running, and the
 * webhook that follows carries only `app_user_id`. Without this mapping the
 * money would arrive for a household the server could not name.
 *
 * The household comes from the authenticated membership server-side, never
 * from this body — a client cannot link a subscriber to somebody else's plan.
 */
export function linkRevenuecatSubscriber(householdId: string, appUserId: string) {
  return apiRequest<{ linked: true }>(
    `/households/${householdId}/revenuecat/link`,
    { method: 'POST', body: JSON.stringify({ appUserId }) },
  )
}
