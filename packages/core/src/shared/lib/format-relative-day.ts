/**
 * "hôm nay" / "hôm qua" / a short date, for the journal's leftmost column.
 *
 * Deliberately day-granular: the journal answers "when did the picture change",
 * not "at what minute". A precise timestamp would read as surveillance of the
 * other person's evening rather than a record of the household's money.
 */
export function formatRelativeDay(
  iso: string,
  t: (key: string, params?: Record<string, unknown>) => string,
): string {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return ''

  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

  const days = Math.round((startOfDay(new Date()) - startOfDay(then)) / 86_400_000)

  if (days <= 0) return t('common.relativeDay.today')
  if (days === 1) return t('common.relativeDay.yesterday')
  if (days < 7) return t('common.relativeDay.daysAgo', { count: days })

  return then.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}
