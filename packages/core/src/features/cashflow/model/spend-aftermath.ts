import type { CashflowEvent } from '#/features/cashflow/model/cashflow.types'

/**
 * What a spend leaves for the outflows scheduled AFTER it — computed HERE, with
 * no request, so the form can answer as the amount is typed.
 *
 * ## Why the form needs this at all
 *
 * The goal-impact figures stop at the spend's own date: a bill due next month
 * must not reach back and squeeze a spend being entered today. That bound is
 * right, but it leaves the opposite question unanswered — emptying the wallet
 * on the 31st said nothing about the 4tr due on the 1st, and the household saw
 * no warning at all. Spending money that is already promised is exactly what
 * this screen exists to prevent, so the silence was the worst outcome.
 *
 * ## Why it is duplicated from the server
 *
 * Same reason as `goals/model/spend-impact.ts`: latency. The household types an
 * amount and may save immediately, and a warning that arrives after the click
 * has warned nobody. `useCashflowEvents` already holds the rows, so this costs
 * no round trip. **Both implementations must change together** — the server's
 * `goals/domain/spend-aftermath.ts` is the figure of record.
 *
 * ## Why incoming events count
 *
 * The question is "will this bill be payable", and a salary landing before it is
 * exactly what makes it payable. (A goal's progress asks a different question —
 * money that has not arrived cannot already be behind a goal — which is why the
 * goal figures ignore incoming events.)
 */

const LIVE_STATUSES = ['expected', 'pending_confirmation', 'overdue'] as const

export interface SpendAftermathRow {
  eventId: string
  name: string
  /** Signed: negative for an outflow, positive for money arriving. */
  amount: number
  expectedDate: string
  /** What the wallet holds once this event has happened. */
  balanceAfter: number
  /** True when the wallet is below zero here — this event cannot be paid. */
  short: boolean
}

export interface SpendAftermath {
  openingBalance: number
  rows: SpendAftermathRow[]
  shortfallCount: number
  lowestBalance: number
}

export function computeSpendAftermath(
  events: readonly CashflowEvent[],
  assetId: string,
  /** The wallet once the spend being entered is taken out. May be negative. */
  balanceAfterSpend: number,
  /** The spend's own date. Only events strictly after it are walked. */
  afterDate: string,
  /** Inclusive far bound, so the walk does not run to the end of time. */
  through: string,
  /** The event being edited, which the typed amount replaces. */
  excludeEventId?: string,
): SpendAftermath {
  const relevant = events
    .filter(
      (event) =>
        event.settlementAssetId === assetId &&
        event.id !== excludeEventId &&
        LIVE_STATUSES.includes(event.status as (typeof LIVE_STATUSES)[number]) &&
        event.expectedDate > afterDate &&
        event.expectedDate <= through,
    )
    // Date order is what makes a running balance mean anything. Ties break by
    // id so the same set always walks the same way.
    .sort(
      (a, b) =>
        a.expectedDate.localeCompare(b.expectedDate) || a.id.localeCompare(b.id),
    )

  let running = balanceAfterSpend
  let lowestBalance = balanceAfterSpend
  const rows: SpendAftermathRow[] = []

  for (const event of relevant) {
    const signed = event.direction === 'incoming' ? event.amount : -event.amount
    running += signed
    lowestBalance = Math.min(lowestBalance, running)
    rows.push({
      eventId: event.id,
      name: event.name,
      amount: signed,
      expectedDate: event.expectedDate,
      balanceAfter: running,
      short: running < 0,
    })
  }

  return {
    openingBalance: balanceAfterSpend,
    rows,
    shortfallCount: rows.filter((row) => row.short).length,
    lowestBalance,
  }
}
