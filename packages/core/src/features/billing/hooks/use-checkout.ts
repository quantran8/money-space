import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { createPaymentOrder } from '#/features/billing/api/billing.repository'
import type { PlanCode } from '#/features/billing/api/billing.repository'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'

/**
 * Start a checkout and hand the browser to PayOS.
 *
 * The redirect is deliberate rather than an embedded QR: PayOS hosts its own
 * page with the QR, the countdown and the bank picker already on it, and
 * rendering our own would mean reimplementing all three and keeping them in
 * step with whatever PayOS changes.
 *
 * `window.location.assign` rather than `window.open`: a popup is blocked by
 * default on mobile Safari, which is where most of these payments happen.
 */
export function useCheckout() {
  const { activeHouseholdId } = useActiveHousehold()
  // A flag, not a message. Every failure to OPEN a checkout reads the same to
  // the household — the page did not appear — and the copy lives in i18n
  // rather than being whatever the server happened to say.
  const [error, setError] = useState(false)

  const mutation = useMutation({
    mutationFn: (planCode: PlanCode) =>
      createPaymentOrder(activeHouseholdId!, planCode),
    onSuccess: (order) => {
      // The order code is remembered BEFORE leaving, so the return page can
      // ask about this order even though PayOS's redirect may not carry it.
      rememberPendingOrder(order.orderCode)
      window.location.assign(order.checkoutUrl)
    },
    onError: () => setError(true),
  })

  return {
    /** `undefined` while no household is selected — the button stays inert. */
    start: (planCode: PlanCode) => {
      if (!activeHouseholdId) return
      setError(false)
      mutation.mutate(planCode)
    },
    // Stays true through the redirect: the page is being replaced, and a
    // button that springs back to "ready" first reads as a failure.
    isStarting: mutation.isPending || mutation.isSuccess,
    error,
  }
}

const PENDING_ORDER_KEY = 'oursight:pending-order'

/**
 * The order we are waiting on, across the round trip to PayOS and back.
 *
 * `sessionStorage`, not a query param: PayOS controls the return URL's shape
 * and appends its own parameters, so relying on one of ours to survive is a
 * bet on someone else's implementation. Session-scoped because an order is
 * only interesting until it is answered.
 */
export function rememberPendingOrder(orderCode: string) {
  try {
    window.sessionStorage.setItem(PENDING_ORDER_KEY, orderCode)
  } catch {
    // Private mode, or storage disabled. The return page falls back to the
    // query string, and worst case shows the plan status instead — neither
    // loses the payment, which the webhook has already settled.
  }
}

export function readPendingOrder(): string | null {
  try {
    return window.sessionStorage.getItem(PENDING_ORDER_KEY)
  } catch {
    return null
  }
}

export function clearPendingOrder() {
  try {
    window.sessionStorage.removeItem(PENDING_ORDER_KEY)
  } catch {
    // Nothing to clean up if it could not be written in the first place.
  }
}
