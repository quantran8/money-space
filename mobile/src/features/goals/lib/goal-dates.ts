import { formatMonthYear } from '@money-space/core/shared/lib/format-money'

/**
 * Date formatting for the goal screens. Presentation only — every figure and
 * every projection comes from core.
 *
 * Goal dates are **month-precision by nature**: a projection built from a
 * monthly pace cannot honestly name a day, and rendering one would claim an
 * accuracy the calculation does not have. `'No deadline'` is the legacy empty
 * marker the API can still send.
 */

export function isRealDate(value: string | undefined | null): value is string {
  return Boolean(value) && value !== 'No deadline'
}

/** `'2029-06-01'` → `'Th6 2029'` (vi) / `'Jun 2029'` (en). */
export function formatGoalMonth(
  value: string | undefined | null,
  locale: string,
  fallback: string,
): string {
  if (!isRealDate(value)) return fallback
  return formatMonthYear(value, locale) || fallback
}

/** `'2026-08-25'` → `'25/08'`. ASCII, so the mono face is safe on it. */
export function formatDayMonth(iso: string): string {
  const [, month, day] = iso.split('-')
  return month && day ? `${day.slice(0, 2)}/${month}` : iso
}

/** `YYYY-MM-DD` for N days before today, in LOCAL time. */
export function isoDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** The locale the app formats dates in, from i18next's resolved language. */
export function dateLocale(language: string | undefined): string {
  return language?.startsWith('en') ? 'en-US' : 'vi-VN'
}
