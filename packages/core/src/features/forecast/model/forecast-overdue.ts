/**
 * Overdue occurrences — the ones that came due before today and are still
 * waiting on somebody to confirm them.
 *
 * Lives with the forecast rather than with Home because it derives purely from
 * a `ForecastResult`: Home shows a capped preview of it, and the Upcoming page
 * shows all of it. Keeping one derivation is what makes "quá hạn" mean the same
 * thing in both places.
 */
import type { ForecastResult } from '#/features/forecast/model/forecast.types'

export type OverdueRow = {
  key: string
  sourceEventId: string
  /**
   * The day the occurrence is LISTED under — day 0. This is what the complete
   * action must send as its idempotency key, NOT `dueDate`.
   */
  date: string
  /**
   * The day it actually fell due, joined from the source event's
   * `expectedDate`. Undefined when that event is not loaded — the row then
   * shows no date rather than falling back to `date`, which is today and would
   * read as "due today" for something that is overdue.
   */
  dueDate?: string
  /** Whole days between `dueDate` and today. Undefined without a `dueDate`. */
  daysOverdue?: number
  name: string
  /** Signed for display: outgoing is negative. */
  signedAmount: number
  /**
   * Set when the occurrence is a debt repayment. Such a row is generated from
   * its debt and regenerated on every schedule change, so the UI offers no
   * edit or delete on it — only the debt can change it.
   */
  debtId?: string | null
}

export type OverdueSummary = {
  rows: OverdueRow[]
  totalCount: number
  /** Net effect on the balance if every one of them is confirmed as done. */
  netAmount: number
  /** Age of the oldest item, for the block's own summary. */
  oldestDays?: number
}

/**
 * Occurrences that came due before today and have not been acted on.
 *
 * The forecast collapses a missed series into ONE occurrence on day 0 (backend
 * `recurrence.ts`) and flags it `wasClampedFromPast`. It stays counted: an
 * unpaid bill is still owed, so it remains inside `startingLiquidBalance` and
 * everything projected from it.
 *
 * What never happens automatically is RESOLVING one — that is always a button
 * somebody presses (§18). So the household has to be told these are sitting
 * there, otherwise a figure that already includes them reads as settled.
 *
 * This is a notice, not a verdict: it names what is waiting and what it comes
 * to, and leaves the deciding to the two people reading it (§16).
 *
 * **When it fell due comes from the source event, not the occurrence.** The
 * backend overwrites the occurrence's own date with `asOfDate` when it clamps
 * (`recurrence.ts`), so `occurrence.date` is today for every row here and says
 * nothing about how long the item has been waiting. `expectedDate` on the event
 * is the real due date, so callers pass the events in to have it joined on.
 * Rows sort oldest first once that join succeeds.
 */
export function buildOverdue(
  forecast: ForecastResult,
  events: { id: string; expectedDate: string }[] = [],
  limit = 4,
): OverdueSummary {
  const expectedById = new Map(events.map((event) => [event.id, event.expectedDate]))

  const overdue = forecast.days
    .flatMap((day) => day.occurrences)
    .filter((occurrence) => occurrence.wasClampedFromPast)

  const rows: OverdueRow[] = overdue.map((occurrence) => {
    const dueDate = expectedById.get(occurrence.sourceEventId)
    // Only count a date that really is in the past. A completed-then-advanced
    // event can sit in the future while its clamped occurrence is still listed.
    const overdueBy =
      dueDate && dueDate < forecast.asOfDate
        ? daysBetween(dueDate, forecast.asOfDate)
        : undefined

    return {
      key: occurrence.occurrenceKey,
      sourceEventId: occurrence.sourceEventId,
      date: occurrence.date,
      dueDate: overdueBy === undefined ? undefined : dueDate,
      daysOverdue: overdueBy,
      name: occurrence.name,
      signedAmount:
        occurrence.direction === 'incoming' ? occurrence.amount : -occurrence.amount,
      debtId: occurrence.debtId,
    }
  })

  // Oldest first. Rows with no joined date keep their forecast order at the end.
  const sorted = [...rows].sort(
    (a, b) => (b.daysOverdue ?? -1) - (a.daysOverdue ?? -1),
  )

  const ages = sorted
    .map((row) => row.daysOverdue)
    .filter((days): days is number => days !== undefined)

  return {
    rows: sorted.slice(0, limit),
    totalCount: sorted.length,
    netAmount: sorted.reduce((sum, row) => sum + row.signedAmount, 0),
    oldestDays: ages.length > 0 ? Math.max(...ages) : undefined,
  }
}

/** Whole days from `from` to `to`, both ISO dates. */
function daysBetween(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)
  return Math.max(0, Math.round(ms / 86_400_000))
}
