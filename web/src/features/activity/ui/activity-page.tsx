import { useTranslation } from 'react-i18next'

import { CompactPageHeader } from '@/app/layout/compact-page-header'
import { Panel } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import { useActivity } from '@money-space/core/features/activity/hooks/use-activity'
import {
  actorInitials,
  describeEntry,
  describeImpact,
} from '@money-space/core/features/activity/model/activity-copy'
import type { ActivityEntry } from '@money-space/core/features/activity/model/activity.types'
import { formatVndScale, formatVndSigned } from '@money-space/core/shared/lib/format-money'
import { formatRelativeDay } from '@money-space/core/shared/lib/format-relative-day'

/**
 * `/activity` — the full journal.
 *
 * Reached from Home's "Xem tất cả", deliberately NOT a sixth nav item: the nav
 * is pinned at five because of the mobile bottom bar (§14.9, §13.3).
 *
 * Grouped by day rather than an undifferentiated stream, because the question
 * a household actually asks is "what changed recently", not "give me every row".
 */
export function ActivityPage() {
  const { t } = useTranslation()
  const { entries, isLoading } = useActivity()

  const groups = groupByDay(entries)

  return (
    <div className="space-y-4 pb-3">
      <CompactPageHeader title={t('activity.header.title')} />

      <Panel>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="py-4 t-body-sm text-ink2">{t('activity.empty')}</p>
        ) : (
          <div className="space-y-7">
            {groups.map(([day, dayEntries]) => (
              <section key={day}>
                <p className="label">{formatRelativeDay(day, t)}</p>
                <ul className="mt-3 -mx-2.5 t-body-sm">
                  {dayEntries.map((entry) => {
                    const impact = describeImpact(entry, t, formatVndSigned)
                    return (
                      <li
                        key={entry.id}
                        className="flex items-baseline gap-4 px-2.5 py-2.5"
                      >
                        <span className="w-6 shrink-0 font-mono t-caption-sm text-ink3">
                          {actorInitials(entry)}
                        </span>
                        <span className="flex-1">{describeEntry(entry, t)}</span>
                        {entry.amount === null ? null : (
                          <span className="num w-24 text-right text-ink2">
                            {formatVndScale(entry.amount)}
                          </span>
                        )}
                        {impact ? (
                          <span className="hidden w-40 text-right t-caption text-ink3 sm:block">
                            {impact}
                          </span>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

function groupByDay(entries: ActivityEntry[]): [string, ActivityEntry[]][] {
  const groups = new Map<string, ActivityEntry[]>()
  for (const entry of entries) {
    const day = entry.occurredAt.slice(0, 10)
    const bucket = groups.get(day)
    if (bucket) bucket.push(entry)
    else groups.set(day, [entry])
  }
  return [...groups.entries()]
}
