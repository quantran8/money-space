import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import {
  actorInitials,
  describeEntry,
  describeImpact,
} from '@money-space/core/features/activity/model/activity-copy'
import type { ActivityEntry } from '@money-space/core/features/activity/model/activity.types'
import { formatVndScale, formatVndSigned } from '@money-space/core/shared/lib/format-money'
import { formatRelativeDay } from '@money-space/core/shared/lib/format-relative-day'

import { EmptyState, Label, Panel, Skeleton } from '@/components/ui'

/**
 * The household journal, grouped by day.
 *
 * Every word on this screen comes from `activity-copy.ts`. The backend emits
 * machine codes and this client renders the sentences — the same contract the
 * forecast's assumptions follow. Writing prose here that the server did not
 * authorise would put words in the journal that no rule produced, which in a
 * shared record between two people is the one thing it must never do.
 *
 * The web lays a row out as four columns (actor · sentence · amount · impact).
 * At 375pt that is a table, and §8 forbids one on a core flow, so the row
 * stacks: the sentence carries the line, the amount sits right-aligned beside
 * it where a column of amounts still lines up, and the impact drops to its own
 * line underneath rather than being truncated into meaninglessness.
 *
 * Grouped by day and never finer. `formatRelativeDay` is day-granular on
 * purpose: the household is asking "what changed recently", and a timestamp to
 * the minute would read as a log of the other person's evening rather than a
 * record of the household's money.
 */
export function ActivityListSection({
  entries,
  isLoading,
}: {
  entries: ActivityEntry[]
  isLoading: boolean
}) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <Panel>
        <View className="gap-2">
          <Skeleton height={44} className="rounded-sunk" />
          <Skeleton height={44} className="rounded-sunk" />
          <Skeleton height={44} className="rounded-sunk" />
        </View>
      </Panel>
    )
  }

  if (entries.length === 0) {
    return (
      <Panel>
        <EmptyState message={t('activity.empty')} />
      </Panel>
    )
  }

  return (
    <Panel>
      <View className="gap-6">
        {groupByDay(entries).map(([day, dayEntries]) => (
          <View key={day}>
            <Label>{formatRelativeDay(day, t)}</Label>
            <View className="mt-2">
              {dayEntries.map((entry) => (
                <ActivityRow key={entry.id} entry={entry} />
              ))}
            </View>
          </View>
        ))}
      </View>
    </Panel>
  )
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const { t } = useTranslation()
  const impact = describeImpact(entry, t, formatVndSigned)

  return (
    <View className="flex-row items-start gap-3 py-2.5">
      {/* Initials, or "••" when the system did it. Core strips the diacritics,
          so this cell is ASCII by construction and the mono face is safe. */}
      <Text className="w-6 pt-0.5 font-mono text-[11px] text-ink3">{actorInitials(entry)}</Text>

      <View className="min-w-0 flex-1">
        <Text className="text-[14px] leading-5 text-ink">{describeEntry(entry, t)}</Text>
        {impact ? <Text className="mt-0.5 text-[12px] leading-4 text-ink3">{impact}</Text> : null}
      </View>

      {entry.amount === null ? null : (
        <Text
          className="pt-0.5 text-[14px] text-ink2"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatVndScale(entry.amount)}
        </Text>
      )}
    </View>
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
