import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { ApiError } from '#/shared/api/http'
import {
  SERVER_PAYWALL_REASONS,
  usePaywallStore,
  type PaywallReason,
} from '#/shared/stores/paywall-store'

import type { PlanLimits } from '#/features/billing/api/billing.repository'

/**
 * Narrowed against the SERVER's reasons only. A 402 cannot carry `trial_ending`
 * or `manage` — the previous hand-written list accepted one of them and dropped
 * `manage`, so it was wrong in both directions.
 */
function toReason(raw: string | undefined): PaywallReason {
  return (SERVER_PAYWALL_REASONS as readonly string[]).includes(raw as string)
    ? (raw as PaywallReason)
    : 'general'
}

/**
 * The safety net that matters most in this phase.
 *
 * Every gate is enforced on the server, and any of them can be reached by a
 * path the client did not pre-check — a stale entitlement, a second device, a
 * limit lowered while the app was open, or simply a call site nobody wrapped in
 * `usePremiumAction`. Handling 402 in ONE place means the worst case for a
 * missed call site is the paywall opening a beat late, never a bare error
 * toast reading "Payment Required".
 *
 * It is registered on both caches: quotas are hit by mutations (creating a
 * third goal) and features by queries (asking for a 90-day horizon).
 */
function handleError(error: unknown): void {
  if (!(error instanceof ApiError) || error.statusCode !== 402) return

  const premium = error.premium
  usePaywallStore.getState().openPaywall({
    reason: toReason(premium?.reason),
    limit: premium?.limit,
    used: premium?.used,
    limits: (premium?.limits as PlanLimits | undefined) ?? null,
  })
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleError }),
  mutationCache: new MutationCache({ onError: handleError }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      /**
       * A 402 is a settled answer, not a blip. Retrying it three times delays
       * the paywall by the backoff and asks the server to refuse the same
       * thing three times over.
       */
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.statusCode === 402) return false
        return failureCount < 3
      },
    },
  },
})
