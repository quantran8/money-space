import type { MoneyEventItem } from '@/features/events/model/events.types'

/** Group key for an ISO date, e.g. "2026-07-05" -> "2026-07". */
export function monthKeyOf(isoDate: string): string {
  return isoDate.slice(0, 7)
}

export type MonthOption = {
  /** "YYYY-MM" key, or "all" for the no-filter option. */
  value: string
  /** Numeric month (1-12), undefined for the "all" option. */
  month?: number
  /** Four-digit year, undefined for the "all" option. */
  year?: string
}

/** Distinct months present in the events, most-recent first. */
export function monthOptionsOf(events: MoneyEventItem[]): MonthOption[] {
  const seen = new Set<string>()
  const options: MonthOption[] = []
  for (const event of events) {
    const value = monthKeyOf(event.isoDate)
    if (seen.has(value)) continue
    seen.add(value)
    const [year, month] = value.split('-')
    options.push({ value, month: Number(month), year })
  }
  return options.sort((a, b) => b.value.localeCompare(a.value))
}
