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
  /** A household already on Premium opening the sheet to see or extend it. */
  | 'manage'
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
  /** The activation-code sheet. Its own dialog, never nested in the paywall. */
  redeemOpen: boolean
  /**
   * Open the global paywall. Mounted once per host beside the what-if sheet,
   * for the same reason: it is reachable from every screen and belongs to no
   * route, so it cannot be a page.
   */
  openPaywall: (context?: Partial<PaywallContext>) => void
  close: () => void
  /** Closes the paywall on the way: two stacked dialogs trap focus. */
  openRedeem: () => void
  closeRedeem: () => void
}

const DEFAULT_CONTEXT: PaywallContext = { reason: 'general' }

export const usePaywallStore = create<PaywallState>((set) => ({
  open: false,
  context: DEFAULT_CONTEXT,
  redeemOpen: false,
  openPaywall: (context = {}) =>
    set({ open: true, context: { ...DEFAULT_CONTEXT, ...context } }),
  // The context is deliberately KEPT on close: the sheet animates out, and
  // clearing the reason first would swap the headline to `general` mid-flight.
  close: () => set({ open: false }),
  openRedeem: () => set({ open: false, redeemOpen: true }),
  closeRedeem: () => set({ redeemOpen: false }),
}))

/**
 * True while either billing sheet is up. A form dialog that opened one hides
 * itself on this rather than closing — closing would remount it and throw away
 * what the household had typed.
 */
export function useBillingSheetOpen(): boolean {
  return usePaywallStore((store) => store.open || store.redeemOpen)
}
