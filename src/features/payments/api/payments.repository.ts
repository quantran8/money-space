import { apiRequest } from '@/shared/api/http'
import { formatVndShort } from '@/shared/lib/format-money'
import type { PaymentStatus, UpcomingPaymentItem } from '@/features/payments/model/payments.types'

type PaymentApiItem = {
  id: string
  name: string
  amount: number
  dueDate?: string
  due?: string
  status: PaymentStatus
  debtId?: string
  owner?: string
}

type PaymentListResponse = {
  householdId: string
  items: PaymentApiItem[]
  total: number
}

function toPaymentItem(item: PaymentApiItem): UpcomingPaymentItem {
  const amount = typeof item.amount === 'number' ? item.amount : 0
  return {
    ...item,
    amount: `${formatVndShort(amount)}`,
    amountValue: amount,
    due: item.due ?? item.dueDate ?? '',
  }
}

export type PaymentPayload = {
  name: string
  amount: number
  dueDate: string
  owner?: string
  debtId?: string
  status: 'important' | 'normal' | 'pending'
}

export async function listPayments(householdId: string) {
  const response = await apiRequest<PaymentListResponse>(
    `/api/households/${householdId}/upcoming-payments`,
  )
  return { ...response, items: response.items.map(toPaymentItem) }
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
