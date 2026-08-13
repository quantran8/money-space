/**
 * Transitional bridge from `CashflowEvent` (§18) to the shape the pre-v3.1
 * payments components expect.
 *
 * This exists so Phase 5 can delete `features/payments/` without rewriting
 * `/events`, `/debts` and the dashboard in the same commit. Phases 6 and 9
 * replace those consumers with real cashflow UI, at which point this file goes
 * away. **Do not build anything new on it.**
 *
 * The lossy part is deliberate: the legacy shape has no direction, no
 * certainty, and no requirement, so an outgoing-only projection is the only
 * honest mapping. Callers that need the full record read `CashflowEvent`.
 */
import { formatVndShort } from '@/shared/lib/format-money'
import type {
  CashflowAttentionLevel,
  CashflowEvent,
  CashflowEventStatus,
} from '@/features/cashflow/model/cashflow.types'

/** The legacy `UpcomingPaymentItem['status']` triple. */
export type LegacyPaymentStatus = 'important' | 'normal' | 'pending'

export type LegacyPaymentItem = {
  id: string
  name: string
  /** Pre-formatted short VND, e.g. "24,5M" — the legacy components render this directly. */
  amount: string
  amountValue: number
  /** ISO date; legacy alias of `expectedDate`. */
  due: string
  dueDate: string
  status: LegacyPaymentStatus
  debtId?: string
  owner?: string
  /** Escape hatch: the untranslated record, for callers ready to move on. */
  source: CashflowEvent
}

/**
 * `attentionLevel` carries the legacy status's meaning far better than
 * `status` does — the old triple mixed urgency (`important`) with lifecycle
 * (`pending`). `pending_confirmation` is the one genuine lifecycle case.
 */
function toLegacyStatus(event: CashflowEvent): LegacyPaymentStatus {
  if (event.status === 'pending_confirmation') return 'pending'
  const urgent: CashflowAttentionLevel[] = ['important', 'urgent']
  if (event.status === 'overdue' || urgent.includes(event.attentionLevel)) return 'important'
  return 'normal'
}

export function toLegacyPaymentItem(event: CashflowEvent): LegacyPaymentItem {
  const amount = Number.isFinite(event.amount) ? event.amount : 0
  return {
    id: event.id,
    name: event.name,
    amount: formatVndShort(amount),
    amountValue: amount,
    due: event.expectedDate,
    dueDate: event.expectedDate,
    status: toLegacyStatus(event),
    debtId: event.debtId ?? undefined,
    owner: event.ownerMemberId ?? undefined,
    source: event,
  }
}

/**
 * Legacy callers wrote `status: 'important' | 'normal' | 'pending'` on create.
 * Map it back onto `attentionLevel`, which is where that meaning now lives.
 */
export function legacyStatusToAttentionLevel(
  status: LegacyPaymentStatus,
): CashflowAttentionLevel {
  return status === 'important' ? 'important' : 'normal'
}

/** Legacy `'paid'` ⇄ `completed`; legacy `'unpaid'` ⇄ everything still live. */
export function isCompleted(status: CashflowEventStatus): boolean {
  return status === 'completed'
}
