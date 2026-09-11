import { Platform } from 'react-native'
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type PurchasesStoreProduct,
} from 'react-native-purchases'

import type {
  PurchaseOutcome,
  StoreProduct,
  StorePurchaseAdapter,
} from '@money-space/core/shared/store-purchases'

/**
 * RevenueCat, behind core's purchase adapter.
 *
 * Deliberately does NOT decide entitlement — `CustomerInfo` is read only during
 * a restore, never to unlock a screen. See memory/billing.md.
 */

/** Must match the backend's `REVENUECAT_ENTITLEMENT_ID`. */
const ENTITLEMENT_ID = 'premium'

// Public by design: these identify the app and grant nothing. The webhook
// secret is the one that matters, and it lives only on the server.
const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
})

let configured = false

function ensureConfigured(): boolean {
  if (configured) return true
  if (!API_KEY) return false
  // Expo Go has no native module linked — a paywall without a buy button
  // beats a crash on the first screen that imports this.
  if (!Purchases?.configure) return false

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR)
  Purchases.configure({ apiKey: API_KEY })
  configured = true
  return true
}

function toStoreProduct(product: PurchasesStoreProduct): StoreProduct {
  return {
    productId: product.identifier,
    // Untouched: it already carries the buyer's currency and tax rules.
    priceString: product.priceString,
    price: product.price,
    currencyCode: product.currencyCode,
  }
}

export const nativePurchases: StorePurchaseAdapter = {
  isAvailable: () => ensureConfigured(),

  /**
   * The id given here arrives in the webhook as `app_user_id` and is how the
   * server finds the household, so it must be the profile id.
   */
  identify: async (appUserId) => {
    if (!ensureConfigured()) return
    await Purchases.logIn(appUserId)
  },

  getAppUserId: async () => {
    if (!ensureConfigured()) return null
    return Purchases.getAppUserID()
  },

  getProducts: async (productIds) => {
    if (!ensureConfigured()) return []
    const products = await Purchases.getProducts(productIds)
    return products.map(toStoreProduct)
  },

  purchase: async (productId): Promise<PurchaseOutcome> => {
    if (!ensureConfigured()) return { status: 'failed', message: 'unavailable' }

    try {
      const [product] = await Purchases.getProducts([productId])
      if (!product) return { status: 'failed', message: 'product_not_found' }

      await Purchases.purchaseStoreProduct(product)
      return { status: 'purchased' }
    } catch (error) {
      const code = (error as { code?: string }).code

      // Not a failure — somebody simply changed their mind.
      if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return { status: 'cancelled' }
      }
      // Ask-to-Buy, or a held charge. The money may still arrive, so the
      // webhook settles it whenever the store does.
      if (code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
        return { status: 'pending' }
      }

      return {
        status: 'failed',
        message: (error as { message?: string }).message,
      }
    }
  },

  /** Only the STORE's opinion — used to decide whether to wait for the server. */
  restore: async () => {
    if (!ensureConfigured()) return { hasActiveEntitlement: false }

    try {
      const info = await Purchases.restorePurchases()
      return {
        hasActiveEntitlement: Boolean(info.entitlements.active[ENTITLEMENT_ID]),
      }
    } catch {
      return { hasActiveEntitlement: false }
    }
  },
}
