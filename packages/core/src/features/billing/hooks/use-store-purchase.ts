import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  fetchEntitlement,
  linkRevenuecatSubscriber,
} from '#/features/billing/api/billing.repository'
import type { PlanCode } from '#/features/billing/api/billing.repository'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'
import {
  PLAN_PRODUCT_IDS,
  productIdForPlan,
  storePurchases,
  type StoreProduct,
} from '#/shared/store-purchases'

/** What the buy button is doing. Drives the copy, so it is a state not a flag. */
export type PurchaseState =
  | { status: 'idle' }
  | { status: 'purchasing'; planCode: PlanCode }
  /** Bought, and waiting for the server to confirm the webhook landed. */
  | { status: 'confirming' }
  | { status: 'done' }
  /** Money taken, grant not landed yet. NOT an error — the webhook will land. */
  | { status: 'slow' }
  /** Ask-to-Buy or a held charge: approval is somebody else's, and may take days. */
  | { status: 'pending' }
  /** Restore ran and the store owns nothing on this account. */
  | { status: 'restoreEmpty' }
  | { status: 'failed'; message?: string }

/** How long to wait for the webhook before saying "it is taking a while". */
const CONFIRM_ATTEMPTS = 6
const CONFIRM_DELAY_MS = 1500

/**
 * Buying Premium through the App Store or Play Store.
 *
 * **The client never grants itself anything** — a purchase only refetches
 * `GET /entitlement`; the webhook is what moves the expiry, which is also how
 * the partner gets it. See memory/billing.md.
 */
export function useStorePurchase() {
  const { activeHouseholdId } = useActiveHousehold()
  const queryClient = useQueryClient()
  const [state, setState] = useState<PurchaseState>({ status: 'idle' })

  const isAvailable = storePurchases.isAvailable()

  // The store's own prices, shown instead of our đồng amounts.
  const productsQuery = useQuery({
    queryKey: ['billing', 'store-products'],
    queryFn: () => storePurchases.getProducts(Object.values(PLAN_PRODUCT_IDS)),
    enabled: isAvailable,
    // Prices change with a store release, not within a session.
    staleTime: 60 * 60 * 1000,
  })

  const products = productsQuery.data ?? []
  const productFor = useCallback(
    (planCode: PlanCode): StoreProduct | null => {
      const productId = productIdForPlan(planCode)
      return products.find((product) => product.productId === productId) ?? null
    },
    [products],
  )

  /**
   * Wait for the webhook, by asking the server rather than trusting the local
   * receipt. Gives up saying "slow", never "failed".
   */
  const awaitEntitlement = useCallback(async (): Promise<boolean> => {
    if (!activeHouseholdId) return false
    const key = queryKeys.entitlement(activeHouseholdId)

    for (let attempt = 0; attempt < CONFIRM_ATTEMPTS; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, CONFIRM_DELAY_MS))
      const fresh = await queryClient.fetchQuery({
        queryKey: key,
        queryFn: () => fetchEntitlement(activeHouseholdId),
      })
      if (fresh?.tier === 'premium' && fresh.status === 'active') return true
    }
    return false
  }, [activeHouseholdId, queryClient])

  const mutation = useMutation({
    mutationFn: async (planCode: PlanCode) => {
      const productId = productIdForPlan(planCode)
      if (!productId) throw new Error('unknown_plan')

      // Registered BEFORE the sheet opens, so a purchase interrupted mid-flow
      // still resolves to a household. See memory/billing.md.
      const appUserId = await storePurchases.getAppUserId()
      if (appUserId && activeHouseholdId) {
        await linkRevenuecatSubscriber(activeHouseholdId, appUserId)
      }

      return storePurchases.purchase(productId)
    },
  })

  const buy = useCallback(
    async (planCode: PlanCode) => {
      if (!activeHouseholdId || !isAvailable) return
      setState({ status: 'purchasing', planCode })

      let outcome
      try {
        outcome = await mutation.mutateAsync(planCode)
      } catch (error) {
        setState({
          status: 'failed',
          message: error instanceof Error ? error.message : undefined,
        })
        return
      }

      // Backing out is not a failure and must not raise an error toast.
      if (outcome.status === 'cancelled') {
        setState({ status: 'idle' })
        return
      }
      if (outcome.status === 'failed') {
        setState({ status: 'failed', message: outcome.message })
        return
      }
      // Ask-to-Buy waits on a parent's approval, which can take days. Polling
      // for it would end in "slow", which reads as though something is wrong.
      if (outcome.status === 'pending') {
        setState({ status: 'pending' })
        return
      }

      setState({ status: 'confirming' })
      const granted = await awaitEntitlement()
      setState({ status: granted ? 'done' : 'slow' })
    },
    [activeHouseholdId, awaitEntitlement, isAvailable, mutation],
  )

  /** Restore. Apple requires this control and rejects builds without it. */
  const restore = useCallback(async () => {
    if (!activeHouseholdId || !isAvailable) return
    setState({ status: 'confirming' })

    try {
      const appUserId = await storePurchases.getAppUserId()
      if (appUserId) {
        // A reinstall may be the only moment the server learns the household.
        await linkRevenuecatSubscriber(activeHouseholdId, appUserId).catch(() => {})
      }

      const { hasActiveEntitlement } = await storePurchases.restore()
      // Said out loud rather than dropped back to idle: a restore that appears
      // to do nothing is indistinguishable from a broken button.
      if (!hasActiveEntitlement) {
        setState({ status: 'restoreEmpty' })
        return
      }

      const granted = await awaitEntitlement()
      setState({ status: granted ? 'done' : 'slow' })
    } catch (error) {
      // Without this the sheet would sit on "checking" forever.
      setState({
        status: 'failed',
        message: error instanceof Error ? error.message : undefined,
      })
    }
  }, [activeHouseholdId, awaitEntitlement, isAvailable])

  const reset = useCallback(() => setState({ status: 'idle' }), [])

  // Do not leave a finished notice on screen.
  useEffect(() => {
    if (state.status === 'done' || state.status === 'restoreEmpty') {
      const timer = setTimeout(() => setState({ status: 'idle' }), 4000)
      return () => clearTimeout(timer)
    }
  }, [state.status])

  return {
    /** False on the web, and on a build without the native module. */
    isAvailable,
    products,
    productFor,
    isLoadingProducts: productsQuery.isLoading,
    buy,
    restore,
    reset,
    state,
    isBusy: state.status === 'purchasing' || state.status === 'confirming',
  }
}
