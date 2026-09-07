import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { fetchPaymentOrder } from '#/features/billing/api/billing.repository'
import {
  clearPendingOrder,
  readPendingOrder,
} from '#/features/billing/hooks/use-checkout'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'

/** Every 2s, for 30s. */
const POLL_INTERVAL_MS = 2_000
const POLL_LIMIT_MS = 30_000

export type PaymentReturnState =
  | 'idle'
  | 'checking'
  | 'paid'
  | 'cancelled'
  | 'expired'
  /** Money may well have arrived; the webhook has not reached us yet. */
  | 'still_confirming'

/**
 * What happened to the payment the household just made.
 *
 * The webhook is what grants the period, and it is a separate network path
 * from the browser's redirect — so the return page can easily arrive FIRST.
 * Polling is how it waits, and the wait is **bounded**: every 2s for 30s, then
 * a calm "đang xác nhận" rather than a spinner forever. An abandoned tab must
 * not poll for the rest of the day, and by then the honest answer is "the
 * money is fine, the confirmation is late", not "failed".
 *
 * The order code comes from `sessionStorage` rather than the URL, because PayOS
 * owns the return URL's shape (`readPendingOrder`).
 *
 * Web only. Mobile never mounts this: it has no checkout to return from.
 */
export function usePaymentReturn(enabled = true) {
  const { activeHouseholdId } = useActiveHousehold()
  const queryClient = useQueryClient()

  const [orderCode] = useState<string | null>(() =>
    enabled ? readPendingOrder() : null,
  )
  const [timedOut, setTimedOut] = useState(false)
  const startedAt = useRef<number>(Date.now())

  const isWatching = Boolean(enabled && activeHouseholdId && orderCode)

  const query = useQuery({
    queryKey:
      activeHouseholdId && orderCode
        ? [...queryKeys.paymentOrders(activeHouseholdId), orderCode]
        : ['billing', 'orders', 'idle'],
    queryFn: () => fetchPaymentOrder(activeHouseholdId!, orderCode!),
    enabled: isWatching && !timedOut,
    // Always ask the server: the whole point is that the answer is changing.
    staleTime: 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      // A settled order has nothing left to poll for.
      if (status && status !== 'pending') return false
      if (Date.now() - startedAt.current > POLL_LIMIT_MS) return false
      return POLL_INTERVAL_MS
    },
  })

  const status = query.data?.status

  // Stop asking once the window has passed, so the hook settles on
  // `still_confirming` instead of leaving a query enabled forever.
  useEffect(() => {
    if (!isWatching || timedOut) return
    const timer = setTimeout(() => setTimedOut(true), POLL_LIMIT_MS)
    return () => clearTimeout(timer)
  }, [isWatching, timedOut])

  // A paid order changes what the household is entitled to, so the plan has to
  // be re-read — and the pending order is done with either way.
  useEffect(() => {
    if (!activeHouseholdId || !status || status === 'pending') return

    clearPendingOrder()
    if (status === 'paid') {
      // `refetchQueries`, not `invalidateQueries`: the entitlement query holds
      // `staleTime: 5m`, so marking it stale would leave the household reading
      // "Gói Miễn phí" on the page confirming they just paid.
      void queryClient.refetchQueries({
        queryKey: queryKeys.entitlement(activeHouseholdId),
      })
    }
  }, [status, activeHouseholdId, queryClient])

  const state: PaymentReturnState = !isWatching
    ? 'idle'
    : status === 'paid'
      ? 'paid'
      : status === 'cancelled'
        ? 'cancelled'
        : status === 'expired'
          ? 'expired'
          : timedOut
            ? 'still_confirming'
            : 'checking'

  return { state, order: query.data ?? null, orderCode }
}
