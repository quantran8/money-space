import { useMemo } from 'react'

import { useCashflowEvents } from '@/features/cashflow/hooks/use-cashflow-events'
import {
  legacyStatusToAttentionLevel,
  toLegacyPaymentItem,
  type LegacyPaymentItem,
  type LegacyPaymentStatus,
} from '@/features/cashflow/model/legacy-payment-shim'
import type { CashflowEventPayload } from '@/features/cashflow/api/cashflow-events.repository'

/**
 * Drop-in replacement for the deleted `usePayments`, backed by
 * `/cashflow-events`. Transitional — see `legacy-payment-shim.ts`. Phases 6
 * and 9 retire the consumers that need it; new code uses `useCashflowEvents`.
 */

/** Legacy payment shape plus the real member relationship used by new forms. */
export type LegacyPaymentPayload = {
  name: string
  amount: number
  dueDate: string
  owner?: string
  ownerMemberId?: string
  debtId?: string
  status: LegacyPaymentStatus
}

const EMPTY_PAYMENTS: LegacyPaymentItem[] = []

function toCashflowPayload(payload: Partial<LegacyPaymentPayload>): Partial<CashflowEventPayload> {
  const next: Partial<CashflowEventPayload> = {}
  if (payload.name !== undefined) next.name = payload.name
  if (payload.amount !== undefined) next.amount = payload.amount
  if (payload.dueDate !== undefined) next.expectedDate = payload.dueDate
  if (payload.debtId !== undefined) next.debtId = payload.debtId
  if (payload.ownerMemberId !== undefined) next.ownerMemberId = payload.ownerMemberId
  if (payload.status !== undefined) {
    next.attentionLevel = legacyStatusToAttentionLevel(payload.status)
  }
  // `owner` is legacy display text. The real relationship is carried by
  // `ownerMemberId`; never guess an id from a name.
  return next
}

export function usePaymentsCompat() {
  const {
    cashflowEvents,
    activeHouseholdId,
    isLoading,
    isError,
    error,
    createCashflowEvent,
    updateCashflowEvent,
    deleteCashflowEvent,
  } = useCashflowEvents({ direction: 'outgoing', status: 'live' })

  const payments = useMemo(
    () => (cashflowEvents.length ? cashflowEvents.map(toLegacyPaymentItem) : EMPTY_PAYMENTS),
    [cashflowEvents],
  )

  return {
    payments,
    activeHouseholdId,
    isLoading,
    isError,
    error,
    createPayment: {
      ...createCashflowEvent,
      isPending: createCashflowEvent.isPending,
      mutateAsync: (payload: LegacyPaymentPayload) =>
        createCashflowEvent.mutateAsync({
          direction: 'outgoing',
          requirement: 'required',
          certainty: 'confirmed',
          recurrence: 'once',
          ...toCashflowPayload(payload),
        } as CashflowEventPayload),
    },
    updatePayment: {
      ...updateCashflowEvent,
      isPending: updateCashflowEvent.isPending,
      mutateAsync: ({
        paymentId,
        payload,
      }: {
        paymentId: string
        payload: Partial<LegacyPaymentPayload>
      }) =>
        updateCashflowEvent.mutateAsync({
          eventId: paymentId,
          payload: toCashflowPayload(payload),
        }),
    },
    deletePayment: {
      ...deleteCashflowEvent,
      isPending: deleteCashflowEvent.isPending,
      mutateAsync: (paymentId: string) => deleteCashflowEvent.mutateAsync(paymentId),
    },
  }
}
