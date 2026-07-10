import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createPayment,
  deletePayment,
  listPayments,
  updatePayment,
  type PaymentPayload,
} from '@/features/payments/api/payments.repository'
import type { UpcomingPaymentItem } from '@/features/payments/model/payments.types'
import { queryKeys } from '@/shared/api/query-keys'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'

const EMPTY_PAYMENTS: UpcomingPaymentItem[] = []

export function usePayments() {
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()

  const query = useQuery({
    queryKey: activeHouseholdId ? queryKeys.payments(activeHouseholdId) : ['payments', 'inactive'],
    queryFn: () => listPayments(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })

  const invalidate = async () => {
    if (!activeHouseholdId) return
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.payments(activeHouseholdId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.events(activeHouseholdId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(activeHouseholdId) }),
    ])
  }

  return {
    payments: query.data?.items ?? EMPTY_PAYMENTS,
    activeHouseholdId,
    ...query,
    createPayment: useMutation({
      mutationFn: (payload: PaymentPayload) => createPayment(activeHouseholdId!, payload),
      onSuccess: invalidate,
    }),
    updatePayment: useMutation({
      mutationFn: ({ paymentId, payload }: { paymentId: string; payload: Partial<PaymentPayload> }) =>
        updatePayment(activeHouseholdId!, paymentId, payload),
      onSuccess: invalidate,
    }),
    deletePayment: useMutation({
      mutationFn: (paymentId: string) => deletePayment(activeHouseholdId!, paymentId),
      onSuccess: invalidate,
    }),
  }
}
