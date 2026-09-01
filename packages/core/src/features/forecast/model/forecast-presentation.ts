/**
 * Presentation rules for forecast figures. Kept out of the components so the
 * tone rules live in one auditable place.
 */
import type {
  ForecastDay,
  ForecastOccurrence,
  ForecastResult,
} from '#/features/forecast/model/forecast.types'

/**
 * Balance tone (§26, design §12).
 *
 * **Red is reserved for an actual projected shortfall** — a balance below zero.
 * Anything else is neutral; escalating a solvent balance to red would turn a
 * heads-up into an alarm, which is exactly the tone the product forbids.
 *
 * There used to be a middle, amber tier: "near the protected reserve". It went
 * with the reserve. Re-adding a warning band means choosing a threshold the
 * household never stated, so this stays binary until there is a figure they
 * actually gave us to compare against.
 */
export type BalanceTone = 'shortfall' | 'normal'

export function balanceTone(balance: number): BalanceTone {
  return balance < 0 ? 'shortfall' : 'normal'
}

export const BALANCE_TONE_CLASS: Record<BalanceTone, string> = {
  shortfall: 'text-alert',
  normal: 'text-ink2',
}

/**
 * Can a projected balance be stated at all?
 *
 * **Zero wallets is not a wallet holding 0đ.** Both sum to a
 * `startingLiquidBalance` of 0, but only the second is a balance the household
 * has. With no `usable_now` asset, every figure projected from that sum is
 * arithmetic on money nobody holds: a 1tr bill renders as "−1,0 triệu", which
 * reads as an overdraft that does not exist and paints the screen red over it.
 *
 * Callers show "—" instead. A genuine shortfall — an outflow larger than a real
 * wallet — still shows its negative figure: that is what the projection is for.
 *
 * `undefined` means the server did not say (an older build). Treated as "there
 * is a source", so a missing field can never blank the column silently.
 */
export function canProjectBalance(usableNowAssetCount?: number): boolean {
  return usableNowAssetCount === undefined || usableNowAssetCount > 0
}

/** Only days that actually have occurrences belong on the timeline. */
export function daysWithActivity(forecast?: ForecastResult): ForecastDay[] {
  if (!forecast) return []
  return forecast.days.filter((day) => day.occurrences.length > 0)
}

/**
 * The running balance shown at the end of an occurrence row. The backend gives
 * a per-DAY closing balance, so within a day we walk the counted occurrences in
 * order to get a per-ROW figure.
 */
export function runningBalancesForDay(day: ForecastDay): Map<string, number> {
  const balances = new Map<string, number>()
  let running = day.openingBalance
  for (const occurrence of day.occurrences) {
    if (occurrence.countedInBalance) {
      running +=
        occurrence.direction === 'incoming' ? occurrence.amount : -occurrence.amount
    }
    balances.set(occurrence.occurrenceKey, running)
  }
  return balances
}

/** Signed amount for display: outgoing is negative. */
export function signedAmount(occurrence: ForecastOccurrence): number {
  return occurrence.direction === 'incoming' ? occurrence.amount : -occurrence.amount
}

/**
 * The i18n key suffix for an occurrence's marker chips. `certainty` and
 * `requirement` are separate axes and both may show.
 */
export function occurrenceMarkers(occurrence: ForecastOccurrence): string[] {
  const markers: string[] = [occurrence.certainty]
  if (occurrence.requirement) markers.push(occurrence.requirement)
  if (occurrence.wasClampedFromPast) markers.push('overdue')
  if (!occurrence.countedInBalance && occurrence.exclusionReason) {
    markers.push(occurrence.exclusionReason)
  }
  // Says why the row carries no edit or delete: it is generated from a debt and
  // only the debt can change it.
  if (occurrence.debtId) markers.push('debt')
  return markers
}
