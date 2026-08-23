/**
 * Date formatting for the forecast screens. Presentation only — every figure
 * comes from core.
 *
 * Every form here is ASCII, so the mono face is safe on it (§5). A forecast
 * date is a real day, not a month-precision projection like a goal's, so it
 * keeps the day.
 */

/** `'2026-08-25'` → `'25/08'`. */
export function formatDayMonth(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}` : iso
}

/** `'2026-08-25'` → `'25/08/2026'`. */
export function formatFullDate(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : iso
}

/** The `YYYY-MM` bucket a day belongs to, for the month headings. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

/** `'2026-08'` → `{ month: 8, year: '2026' }`, for `upcoming.timeline.monthGroup`. */
export function monthParts(key: string): { month: number; year: string } {
  const [year, month] = key.split('-')
  return { month: Number(month), year }
}

/** Today in LOCAL time as `YYYY-MM-DD` — never UTC, which can be a day off. */
export function todayIso(): string {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** `iso` shifted by `days`, in LOCAL time. Used by the postpone presets. */
export function isoPlusDays(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return iso
  const date = new Date(year, month - 1, day + days)
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0')
  const nextDay = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${nextMonth}-${nextDay}`
}
