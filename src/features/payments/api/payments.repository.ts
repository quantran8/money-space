import { apiRequest } from '@/shared/api/http'
import type { UpcomingPaymentItem } from '@/features/payments/model/payments.types'

type PaymentListResponse = {
  householdId: string
  items: UpcomingPaymentItem[]
  total: number
}

export type PaymentPayload = {
  name: string
  amount: number
  dueDate: string
  owner?: string
  debtId?: string
  status: 'important' | 'normal' | 'pending'
}

export function listPayments(householdId: string) {
  return apiRequest<PaymentListResponse>(`/api/households/${householdId}/upcoming-payments`)
}

export function createPayment(householdId: string, payload: PaymentPayload) {
  return apiRequest<UpcomingPaymentItem>(`/api/households/${householdId}/upcoming-payments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePayment(
  householdId: string,
  paymentId: string,
  payload: Partial<PaymentPayload>,
) {
  return apiRequest<UpcomingPaymentItem>(
    `/api/households/${householdId}/upcoming-payments/${paymentId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

export function deletePayment(householdId: string, paymentId: string) {
  return apiRequest<{ deleted: boolean; paymentId: string }>(
    `/api/households/${householdId}/upcoming-payments/${paymentId}`,
    {
      method: 'DELETE',
    },
  )
}
