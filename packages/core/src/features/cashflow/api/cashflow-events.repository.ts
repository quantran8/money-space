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

/** Bank money not yet settling anything; see backend memory/cashflow-settlement.md. */
export type CashflowLinkCandidate = {
  kind: 'money_event' | 'bank_event'
  id: string
  amount: number
  date: string
  assetId: string | null
  note: string
}

export type CashflowSettlement = {
  moneyEventId: string
  occurrenceDate: string
  amount: number
  assetId: string | null
  settledAt: string
  settledById: string | null
  settledVia: 'manual_complete' | 'manual_link' | 'auto_note'
  notificationEventId: string | null
}

export type CashflowMatchRule = {
  id: string
  cashflowEventId: string
  phrase: string
  phraseNormalized: string
  createdAt: string
}

export type MatchRulePreviewRow = {
  bankEventId: string
  note: string
  receivedAt: string
  matches: boolean
}

const eventPath = (householdId: string, eventId: string) =>
  `/households/${householdId}/cashflow-events/${eventId}`

export function listLinkCandidates(householdId: string, eventId: string, q = '') {
  const query = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''
  return apiRequest<CashflowLinkCandidate[]>(`${eventPath(householdId, eventId)}/link-candidates${query}`)
}

export function listCashflowSettlements(householdId: string, eventId: string) {
  return apiRequest<CashflowSettlement[]>(`${eventPath(householdId, eventId)}/settlements`)
}

export function linkCashflowEvent(householdId: string, eventId: string, moneyEventId: string) {
  return apiRequest<{ event: CashflowEvent; advancedTo: string | null }>(
    `${eventPath(householdId, eventId)}/link`,
    { method: 'POST', body: JSON.stringify({ moneyEventId }) },
  )
}

export function replaceManualCompletion(householdId: string, eventId: string, moneyEventId: string) {
  return apiRequest<{ event: CashflowEvent }>(`${eventPath(householdId, eventId)}/replace-manual`, {
    method: 'POST',
    body: JSON.stringify({ moneyEventId }),
  })
}

export function unlinkCashflowEvent(householdId: string, eventId: string, moneyEventId: string) {
  return apiRequest<{ event: CashflowEvent }>(`${eventPath(householdId, eventId)}/unlink`, {
    method: 'POST',
    body: JSON.stringify({ moneyEventId }),
  })
}

export function listHouseholdMatchRules(householdId: string) {
  return apiRequest<CashflowMatchRule[]>(`/households/${householdId}/cashflow-events/match-rules`)
}

export function createMatchRule(householdId: string, eventId: string, phrase: string) {
  return apiRequest<CashflowMatchRule>(`${eventPath(householdId, eventId)}/match-rules`, {
    method: 'POST',
    body: JSON.stringify({ phrase }),
  })
}

export function deleteMatchRule(householdId: string, eventId: string, ruleId: string) {
  return apiRequest<{ deleted: boolean }>(`${eventPath(householdId, eventId)}/match-rules/${ruleId}`, {
    method: 'DELETE',
  })
}

export function previewMatchRule(householdId: string, phrase: string) {
  return apiRequest<MatchRulePreviewRow[]>(
    `/households/${householdId}/cashflow-events/match-rules/preview`,
    { method: 'POST', body: JSON.stringify({ phrase }) },
  )
}
