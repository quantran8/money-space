/**
 * In-app purchase adapter, injected by the host app.
 *
 * Core cannot import `react-native-purchases` — it is a native module the web
 * bundle would fail to resolve. The default adapter reports that it cannot
 * sell, which is the honest answer on the web. See memory/billing.md.
 */

/** A product as the store prices it, in the buyer's own currency. */
export type StoreProduct = {
  /** The store product id, e.g. `oursight_premium_yearly`. */
  productId: string
  /**
   * The price formatted BY THE STORE, e.g. "299.000 ₫". Shown verbatim, never
   * replaced with our đồng amount. See memory/billing.md.
   */
  priceString: string
  /** Numeric price, for sorting and for the savings line only. */
  price: number
  currencyCode: string
}

export type PurchaseOutcome =
  | { status: 'purchased' }
  /** The person backed out of the store sheet. Not an error — say nothing. */
  | { status: 'cancelled' }
  | { status: 'pending' }
  | { status: 'failed'; message?: string }

export type StorePurchaseAdapter = {
  /** Whether IAP can be offered at all on this platform. */
  isAvailable: () => boolean
  /** Called at sign-in. This id arrives in the webhook, so it is the profile id. */
  identify: (appUserId: string) => Promise<void>
  /** The store's own id for the current subscriber. */
  getAppUserId: () => Promise<string | null>
  /** What is for sale, priced by the store. */
  getProducts: (productIds: string[]) => Promise<StoreProduct[]>
  purchase: (productId: string) => Promise<PurchaseOutcome>
  /**
   * Apple requires a restore control and rejects builds without one. Returns
   * only what the STORE believes; the server still decides entitlement.
   */
  restore: () => Promise<{ hasActiveEntitlement: boolean }>
}

/** The web's answer: this platform does not sell through a store. */
function createUnavailableAdapter(): StorePurchaseAdapter {
  return {
    isAvailable: () => false,
    identify: async () => {},
    getAppUserId: async () => null,
    getProducts: async () => [],
    purchase: async () => ({ status: 'failed', message: 'unavailable' }),
    restore: async () => ({ hasActiveEntitlement: false }),
  }
}

let adapter: StorePurchaseAdapter = createUnavailableAdapter()

export function configureStorePurchases(next: StorePurchaseAdapter) {
  adapter = next
}

export const storePurchases: StorePurchaseAdapter = {
  isAvailable: () => adapter.isAvailable(),
  identify: (appUserId) => adapter.identify(appUserId),
  getAppUserId: () => adapter.getAppUserId(),
  getProducts: (productIds) => adapter.getProducts(productIds),
  purchase: (productId) => adapter.purchase(productId),
  restore: () => adapter.restore(),
}

/**
 * The store product for each plan. Mirrors the backend's `STORE_PRODUCTS`.
 *
 * **Permanent** — a published store product id cannot be renamed or reused, so
 * a new plan means a new id, never an edited one.
 */
export const PLAN_PRODUCT_IDS = {
  premium_monthly: 'oursight_premium_monthly',
  premium_yearly: 'oursight_premium_yearly',
  premium_lifetime: 'oursight_premium_lifetime',
} as const

export type PlanProductId =
  (typeof PLAN_PRODUCT_IDS)[keyof typeof PLAN_PRODUCT_IDS]

export function productIdForPlan(planCode: string): string | null {
  return (PLAN_PRODUCT_IDS as Record<string, string>)[planCode] ?? null
}

export function planCodeForProductId(productId: string): string | null {
  const base = productId.split(':')[0]
  const entry = Object.entries(PLAN_PRODUCT_IDS).find(
    ([, value]) => value === base,
  )
  return entry?.[0] ?? null
}
