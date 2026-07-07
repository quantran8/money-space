import { upcomingPaymentList } from '@/features/payments/api/payments.repository'

/**
 * Read seam for the payments feature. Returns the initial upcoming-payment
 * list from mock seed data; swap for a Supabase query later.
 */
export function usePayments() {
  return { payments: upcomingPaymentList }
}
