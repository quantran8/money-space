import { create } from 'zustand'

import type { PlanLimits } from '#/features/billing/api/billing.repository'

/**
 * Which wall the household just hit. Mirrors `PaywallReason` on the server
 * (`entitlement.errors.ts`) — the 402 body carries one of these, and the sheet
 * picks its headline and its top benefit row from it.
 *
 * `general` is the entry from a plain "upgrade" button, where nothing was
 * refused and there is no number to show.
 */
export type PaywallReason =
  | 'goal_quota'
  | 'whatif_quota'
  | 'auto_price_quota'
  | 'forecast_horizon'
  | 'history'
  | 'export'
  | 'trial_ending'
  | 'expired'
  | 'general'

export type PaywallContext = {
  reason: PaywallReason
  /** The ceiling that was hit. Absent for boolean features and `general`. */
  limit?: number
  /** How much of it is used — `5/5`. Absent for the same reasons as `limit`. */
  used?: number
  /** The server's view of what the household may do, when the 402 carried it. */
  limits?: PlanLimits | null
}

type PaywallState = {
  open: boolean
  context: PaywallContext
  /**
   * Open the global paywall. Mounted once per host beside the what-if sheet,
   * for the same reason: it is reachable from every screen and belongs to no
   * route, so it cannot be a page.
   */
  openPaywall: (context?: Partial<PaywallContext>) => void
  close: () => void
}

const DEFAULT_CONTEXT: PaywallContext = { reason: 'general' }

export const usePaywallStore = create<PaywallState>((set) => ({
  open: false,
  context: DEFAULT_CONTEXT,
  openPaywall: (context = {}) =>
    set({ open: true, context: { ...DEFAULT_CONTEXT, ...context } }),
  // The context is deliberately KEPT on close: the sheet animates out, and
  // clearing the reason first would swap the headline to `general` mid-flight.
  close: () => set({ open: false }),
}))
