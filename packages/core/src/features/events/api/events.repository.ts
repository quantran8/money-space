import { apiRequest } from '#/shared/api/http'
import type { MoneyEventItem } from '#/features/events/model/events.types'

type EventListResponse = {
  householdId: string
  items: Array<MoneyEventItem & { id: string }>
  total: number
}

export type EventPayload = {
  amount: number
  /** Sale/purchase fee in VND. Defaults to 0. See asset-sale. */
  feeAmount?: number
  /** For an asset_sale: resolved sold quantity (market) / value (manual). */
  soldQuantity?: number
  soldValue?: number
  note?: string
  isoDate: string
  type: 'expense' | 'income' | 'transfer' | 'asset_purchase' | 'asset_sale' | 'asset_update' | 'payment_paid' | 'debt_update' | 'adjustment' | 'other'
  categoryId: string
  direction?: 'inflow' | 'outflow' | 'neutral'
  fromAssetId?: string
  toAssetId?: string
  cashflowEventId?: string
  debtId?: string
  /**
   * The goal this record touches. Send `null` on an EDIT to clear the link —
   * `undefined` is dropped by JSON.stringify, which the API reads as "leave it
   * as it was".
   */
  financialGoalId?: string | null
}

/**
 * Advisory preview of what an edit or delete would do to the wallets it touches,
 * read BEFORE the write. A wallet appears only when the change would drive its
 * balance below zero at some point in its timeline.
 *
 * That is allowed — a negative balance truthfully records spending that exceeds
 * recorded income — so this drives a confirmation, never a block. See
 * wallet-replay-on-edit.
 */
export type EventWalletImpact = {
  isClear: boolean
  wallets: Array<{
    assetId: string
    assetName: string
    /** Deepest point the balance reaches (most negative). */
    lowestBalance: number
    firstOverdraftDate: string
    overdrafts: Array<{ moneyEventId: string; isoDate: string; balance: number }>
  }>
}

/** Backend-computed thu/chi/net aggregate for a month (source of truth). */
export type EventsSummaryResponse = {
  householdId: string
  month: string
  recordedCount: number
  totalIncome: number
  totalOutcome: number
  netChange: number
}

export function listEvents(householdId: string, month?: string) {
  return apiRequest<EventListResponse>(
    `/households/${householdId}/money-events`,
    undefined,
    month ? { month } : undefined,
  )
}

export function getEventsSummary(householdId: string, month?: string) {
  return apiRequest<EventsSummaryResponse>(
    `/households/${householdId}/money-events/summary`,
    undefined,
    month ? { month } : undefined,
  )
}

export function createEvent(householdId: string, payload: EventPayload) {
  return apiRequest(`/households/${householdId}/money-events`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateEvent(householdId: string, eventId: string, payload: Partial<EventPayload>) {
  return apiRequest(`/households/${householdId}/money-events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

/**
 * What this edit would do to the wallets it touches, without writing it. POST
 * because the candidate payload is the input, not an addressable resource.
 */
export function previewEventUpdate(
  householdId: string,
  eventId: string,
  payload: Partial<EventPayload>,
) {
  return apiRequest<EventWalletImpact>(
    `/households/${householdId}/money-events/${eventId}/preview`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

/**
 * Events sitting at a point where their wallet's balance is negative, mapped to
 * that balance. Used to mark the rows worth a second look — an overdraft belongs
 * to the wallet's running balance, so it cannot be read off a single event row.
 */
export function listOverdraftEvents(householdId: string) {
  return apiRequest<{ householdId: string; overdrafts: Record<string, number> }>(
    `/households/${householdId}/money-events/overdrafts`,
  )
}

/** What deleting this event would do to its wallets. */
export function eventDeleteImpact(householdId: string, eventId: string) {
  return apiRequest<EventWalletImpact>(
    `/households/${householdId}/money-events/${eventId}/delete-impact`,
  )
}

export function deleteEvent(householdId: string, eventId: string) {
  return apiRequest<{ deleted: boolean; eventId: string }>(
    `/households/${householdId}/money-events/${eventId}`,
    {
      method: 'DELETE',
    },
  )
}
