/**
 * Month arithmetic and labels for the events month navigator.
 *
 * Presentation only — the month key itself (`YYYY-MM`) is owned by core's
 * `useEventsPage`, which uses it to key both the timeline filter and the
 * backend thu/chi/net summary.
 */

/** Shift a `YYYY-MM` key by whole months. */
export function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number)
  const next = new Date(year, month - 1 + delta, 1)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
}

export function dateLocale(language?: string): string {
  return language?.startsWith('en') ? 'en-US' : 'vi-VN'
}

/** `Tháng 8 / 2026` in Vietnamese, the platform's long form in English. */
export function monthLabel(monthKey: string, locale: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  if (locale === 'vi-VN') return `Tháng ${month} / ${year}`
  return new Date(year, month - 1, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })
}

/** Just the month, for the summary panel's header. */
export function shortMonthLabel(monthKey: string, locale: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  if (locale === 'vi-VN') return `Tháng ${month}`
  return new Date(year, month - 1, 1).toLocaleDateString(locale, { month: 'long' })
}

/**
 * A day heading inside the timeline. ASCII (`08/07`) so the mono face is safe
 * on it, except for today, which is named in words.
 */
export function dayHeading(isoDate: string, today: string, todayLabel: string): string {
  if (isoDate === today) return todayLabel
  const [, month, day] = isoDate.split('-')
  return month && day ? `${day}/${month}` : isoDate
}
