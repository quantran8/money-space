import type { ActivityEntry } from '#/features/activity/model/activity.types'

/**
 * Turn a journal entry into the words a person reads.
 *
 * All of it lives here rather than in the server response: the backend emits
 * codes, this app renders sentences. Same contract as forecast assumptions.
 */
export function describeEntry(
  entry: ActivityEntry,
  t: (key: string, params?: Record<string, unknown>) => string,
): string {
  const object = entry.objectName ?? t('activity.object.folded')
  return t(`activity.action.${entry.action}`, { object })
}

/**
 * The impact column — how the shared picture moved.
 *
 * Entries without a financial impact do not render an impact label.
 */
export function describeImpact(
  entry: ActivityEntry,
  t: (key: string, params?: Record<string, unknown>) => string,
  formatSigned: (value: number) => string,
): string | null {
  if (!entry.impact) return null
  return t(`activity.impact.${entry.impact.metric}`, {
    value: formatSigned(entry.impact.delta),
  })
}

/** Initials for the mono actor column. ASCII only — it sits in a mono cell. */
export function actorInitials(entry: ActivityEntry): string {
  const name = entry.actor?.name
  if (!name) return '••'
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
}
