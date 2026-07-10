import { apiRequest } from '@/shared/api/http'
import type { MoneyEventItem } from '@/features/events/model/events.types'

type EventListResponse = {
  householdId: string
  items: Array<MoneyEventItem & { id: string; amountValue: number }>
  total: number
}

export type EventPayload = {
  title: string
  amount: number
  note?: string
  isoDate: string
  type: 'expense' | 'income' | 'transfer' | 'asset_purchase' | 'asset_sale' | 'payment_paid' | 'goal_contribution' | 'debt_update' | 'adjustment' | 'other'
  category: string
  direction?: 'inflow' | 'outflow' | 'neutral'
  fromAssetId?: string
  toAssetId?: string
  upcomingPaymentId?: string
  debtId?: string
  financialGoalId?: string
}

export function listEvents(householdId: string, month?: string) {
  return apiRequest<EventListResponse>(
    `/api/households/${householdId}/money-events`,
    undefined,
    month ? { month } : undefined,
  )
}

export function createEvent(householdId: string, payload: EventPayload) {
  return apiRequest(`/api/households/${householdId}/money-events`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateEvent(householdId: string, eventId: string, payload: Partial<EventPayload>) {
  return apiRequest(`/api/households/${householdId}/money-events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteEvent(householdId: string, eventId: string) {
  return apiRequest<{ deleted: boolean; eventId: string }>(
    `/api/households/${householdId}/money-events/${eventId}`,
    {
      method: 'DELETE',
    },
  )
}
