/**
 * Presentation rules for forecast figures. Kept out of the components so the
 * tone rules live in one auditable place.
 */
import type {
  ForecastDay,
  ForecastOccurrence,
  ForecastResult,
} from '@/features/forecast/model/forecast.types'

/**
 * Balance tone (§26, design §12).
 *
 * **Red is reserved for an actual projected shortfall** — a balance below zero.
 * Orange means "near the protected reserve": still solvent, worth a look.
 * Anything else is neutral. Escalating orange to red would turn a heads-up into
 * an alarm, which is exactly the tone the product forbids.
 */
export type BalanceTone = 'shortfall' | 'near-reserve' | 'normal'

export function balanceTone(balance: number, protectedReserveAmount: number): BalanceTone {
  if (balance < 0) return 'shortfall'
  if (protectedReserveAmount > 0 && balance < protectedReserveAmount) return 'near-reserve'
  return 'normal'
}

export const BALANCE_TONE_CLASS: Record<BalanceTone, string> = {
  shortfall: 'text-[hsl(var(--status-red))]',
  'near-reserve': 'text-[hsl(var(--status-orange))]',
  normal: 'text-[hsl(var(--muted-foreground))]',
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
  return markers
}
