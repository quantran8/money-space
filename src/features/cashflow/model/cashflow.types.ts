/**
 * Cashflow events (spec §18) — the sole input to the forecast.
 *
 * Replaces the old `UpcomingPayment`, which could only express money going out
 * and therefore could not produce a running balance. A recurring event is ONE
 * record: `expectedDate` is the current occurrence and `recurrence` is the
 * rule. Completing an occurrence advances `expectedDate`; occurrence rows are
 * never pre-created.
 */

/** Which way the money moves. */
export type CashflowDirection = 'incoming' | 'outgoing'

/**
 * Whether an outgoing event is an obligation or a choice. Only `required`
 * counts toward obligation coverage — `planned` money still leaves the account
 * (so it moves the running balance) but not spending it does not mean the
 * household is "not covered". `null` for incoming.
 */
export type CashflowRequirement = 'required' | 'planned' | null

/**
 * How sure the amount/date is. The forecast banks only `confirmed` incoming;
 * `estimated` is displayed but never silently treated as certain (§26A.5).
 */
export type CashflowCertainty = 'confirmed' | 'estimated'

export type CashflowEventStatus =
  | 'expected'
  | 'completed'
  | 'pending_confirmation'
  | 'postponed'
  | 'overdue'
  | 'cancelled'

export type CashflowAttentionLevel = 'normal' | 'important' | 'urgent'

/** Mirrors the backend's `RecurrenceFrequency`. A one-off is `once`, not `none`. */
export type CashflowRecurrence = 'once' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export type CashflowEvent = {
  id: string
  householdId: string
  name: string
  /** Raw VND. The client formats it. */
  amount: number
  direction: CashflowDirection
  /** The CURRENT occurrence's date, not the series start. */
  expectedDate: string
  recurrence: CashflowRecurrence
  recurrenceEndDate?: string | null
  requirement: CashflowRequirement
  certainty: CashflowCertainty
  status: CashflowEventStatus
  attentionLevel: CashflowAttentionLevel
  ownerMemberId?: string | null
  debtId?: string | null
  financialGoalId?: string | null
  plannedAssetId?: string | null
  note?: string
  lastCompletedAt?: string | null
  lastCompletedById?: string | null
  lastCompletedAmount?: number | null
  lastCompletedAssetId?: string | null
}

/**
 * Statuses that still owe money — what the forecast counts. `postponed` is
 * deliberately excluded: it is shown on the timeline but its date is no longer
 * trusted, so it must not move the balance.
 */
export const LIVE_CASHFLOW_STATUSES: readonly CashflowEventStatus[] = [
  'expected',
  'pending_confirmation',
  'overdue',
]

export function isLiveCashflowStatus(status: CashflowEventStatus): boolean {
  return LIVE_CASHFLOW_STATUSES.includes(status)
}
