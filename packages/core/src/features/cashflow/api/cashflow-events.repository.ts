import { apiRequest } from '#/shared/api/http'
import type {
  CashflowAttentionLevel,
  CashflowCertainty,
  CashflowDirection,
  CashflowEvent,
  CashflowRecurrence,
} from '#/features/cashflow/model/cashflow.types'

type CashflowEventListResponse = {
  householdId: string
  items: CashflowEvent[]
  total: number
}

/** Server-side filters (§18). `status: 'live'` means everything that still owes money. */
export type CashflowEventFilters = {
  direction?: CashflowDirection
  status?: string
  requirement?: 'required' | 'planned'
  certainty?: CashflowCertainty
  /** Inclusive ISO date bounds on `expectedDate`. */
  from?: string
  to?: string
  limit?: number
}

export type CashflowEventPayload = {
  name: string
  /** FK to `money_event_categories.id`. Falls back to the system `other`
   *  category on the backend when omitted. */
  categoryId?: string
  amount: number
  direction: CashflowDirection
  expectedDate: string
  recurrence?: CashflowRecurrence
  recurrenceEndDate?: string | null
  /** Outgoing only — the backend forces `null` for incoming. */
  requirement?: 'required' | 'planned'
  certainty?: CashflowCertainty
  ownerMemberId?: string | null
  debtId?: string | null
  financialGoalId?: string | null
  plannedAssetId?: string | null
  /** Optional wallet this event settles through. See `CashflowEvent`. */
  settlementAssetId?: string | null
  attentionLevel?: CashflowAttentionLevel
  note?: string
}

function toQueryString(filters?: CashflowEventFilters): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function listCashflowEvents(householdId: string, filters?: CashflowEventFilters) {
  return apiRequest<CashflowEventListResponse>(
    `/households/${householdId}/cashflow-events${toQueryString(filters)}`,
  )
}

export function getCashflowEvent(householdId: string, eventId: string) {
  return apiRequest<CashflowEvent>(`/households/${householdId}/cashflow-events/${eventId}`)
}

export function createCashflowEvent(householdId: string, payload: CashflowEventPayload) {
  return apiRequest<CashflowEvent>(`/households/${householdId}/cashflow-events`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCashflowEvent(
  householdId: string,
  eventId: string,
  payload: Partial<CashflowEventPayload>,
) {
  return apiRequest<CashflowEvent>(
    `/households/${householdId}/cashflow-events/${eventId}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
  )
}

export function deleteCashflowEvent(householdId: string, eventId: string) {
  return apiRequest<{ deleted: boolean; eventId: string }>(
    `/households/${householdId}/cashflow-events/${eventId}`,
    { method: 'DELETE' },
  )
}

/**
 * Record that the expected movement actually happened. For a recurring event
 * this advances `expectedDate` to the next occurrence rather than closing the
 * record. `occurrenceDate` is the idempotency key — a double-tap cannot advance
 * a series twice.
 */
export type CompleteCashflowEventPayload = {
  occurrenceDate?: string
  /** What was actually moved. Defaults to the planned `amount`. */
  amount?: number
  /** The wallet debited (outgoing) or credited (incoming). */
  assetId?: string
  note?: string
}

export function completeCashflowEvent(
  householdId: string,
  eventId: string,
  payload: CompleteCashflowEventPayload = {},
) {
  return apiRequest<CashflowEvent>(
    `/households/${householdId}/cashflow-events/${eventId}/complete`,
    { method: 'POST', body: JSON.stringify(payload) },
  )
}

export function postponeCashflowEvent(
  householdId: string,
  eventId: string,
  payload: { newExpectedDate: string; note?: string },
) {
  return apiRequest<CashflowEvent>(
    `/households/${householdId}/cashflow-events/${eventId}/postpone`,
    { method: 'POST', body: JSON.stringify(payload) },
  )
}

export function cancelCashflowEvent(
  householdId: string,
  eventId: string,
  payload: { note?: string } = {},
) {
  return apiRequest<CashflowEvent>(
    `/households/${householdId}/cashflow-events/${eventId}/cancel`,
    { method: 'POST', body: JSON.stringify(payload) },
  )
}
