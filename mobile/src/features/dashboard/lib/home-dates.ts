/**
 * Date strings for Home, in the mono-safe ASCII forms §5 allows.
 *
 * Formatting only — nothing here decides anything. The derivations in
 * `@money-space/core` own every figure and every date these render.
 */

/** `24/08` — day and month, for a timeline row or a chart end. */
export function formatDayMonth(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}` : isoDate
}

/** `24/08/2026` — the full date beside the screen title. */
export function formatToday(isoDate?: string): string {
  const source = isoDate ?? new Date().toISOString()
  const match = source.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : ''
}
