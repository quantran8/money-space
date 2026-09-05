import { useMemo } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { CategoryVisual } from '@money-space/core/features/events/hooks/use-category-visuals'
import type {
  FinancialRecordItem,
  RecordTab,
} from '@money-space/core/features/events/model/events-form'
import { TODAY } from '@money-space/core/features/events/model/events-form'

import { EmptyState, Label, Panel, Select, Skeleton } from '@/components/ui'
import { dayHeading } from '@/features/events/lib/event-months'
import { EventRecordRow } from '@/features/events/ui/event-record-row'

type Option = { value: string; label: string }

/**
 * The ledger itself: what already moved, newest first, grouped by day.
 *
 * Three things the web does are deliberately dropped:
 *
 *  - **Pagination.** Seven rows a page with a numbered pager is how a desktop
 *    table keeps a viewport usable. A phone already scrolls, and a pager turns
 *    one flick into a tap-and-wait.
 *  - **The search box.** It earns its place over a long desktop table; here it
 *    would push the first record below the fold to filter a month's worth of
 *    rows the thumb can reach anyway.
 *  - **The row count under the month.** The summary panel above already says
 *    how many events happened, and §5 allows one fact exactly one home.
 *
 * The type and person filters are both `Select`s, and sit above the list: the
 * month scope at the top of the screen is what the summary panel is
 * describing, and the filters and the figures must always be talking about the
 * same set of rows.
 */
export function EventsTimelineSection({
  tab,
  onTabChange,
  groupedRecords,
  categoryVisualById,
  memberOptions,
  selectedMember,
  onMemberChange,
  isLoading = false,
  onEditEvent,
  onDeleteEvent,
}: {
  tab: RecordTab
  onTabChange: (tab: RecordTab) => void
  /** Already filtered by month and person upstream — core owns that. */
  groupedRecords: [string, FinancialRecordItem[]][]
  /** Category id → label + disc glyph/fill, from core's `useCategoryVisuals`. */
  categoryVisualById: Record<string, CategoryVisual>
  memberOptions: Option[]
  selectedMember: string
  onMemberChange: (memberId: string) => void
  isLoading?: boolean
  onEditEvent: (id: string) => void
  onDeleteEvent: (id: string) => void
}) {
  const { t } = useTranslation()

  // A ledger reads backwards from now, so within the month the days descend.
  const recordsByDay = useMemo(() => {
    const groups = new Map<string, FinancialRecordItem[]>()
    for (const [, items] of groupedRecords) {
      for (const record of items) {
        const bucket = groups.get(record.date)
        if (bucket) bucket.push(record)
        else groups.set(record.date, [record])
      }
    }
    return [...groups.entries()].sort(([left], [right]) => right.localeCompare(left))
  }, [groupedRecords])

  const isEmpty = recordsByDay.length === 0

  return (
    <Panel>
      {/* A `Select`, not a `Segmented`. Three short options fitted across
          375pt; the v5 taxonomy has six, and six segments at that width give
          each ~55pt — below the 44pt tap floor once padding is counted, with
          labels truncated to two characters. */}
      <Select
        label={t('events.history.type')}
        value={tab}
        options={[
          { value: 'all', label: t('events.history.allChanges') },
          { value: 'income', label: t('events.history.typeIncome') },
          { value: 'expense', label: t('events.history.typeExpense') },
          { value: 'adjustment', label: t('events.history.typeAdjustment') },
          { value: 'asset', label: t('events.history.typeAsset') },
          { value: 'payment', label: t('events.history.typePayment') },
        ]}
        onChange={(value) => onTabChange(value as RecordTab)}
      />

      {/* Only worth asking once there is more than one person to ask about. */}
      {memberOptions.length > 1 ? (
        <Select
          className="mt-3"
          label={t('events.history.person')}
          value={selectedMember}
          options={[{ value: 'all', label: t('events.history.allPeople') }, ...memberOptions]}
          onChange={onMemberChange}
        />
      ) : null}

      <View className="mt-5">
        {isLoading ? (
          <View className="gap-2">
            <Skeleton height={52} className="rounded-control" />
            <Skeleton height={52} className="rounded-control" />
            <Skeleton height={52} className="rounded-control" />
          </View>
        ) : isEmpty ? (
          <EmptyState message={t('events.history.empty')} />
        ) : (
          <View className="gap-5">
            {recordsByDay.map(([day, items]) => (
              <View key={day}>
                {/* ASCII by construction (`08/07`), except "Hôm nay", which is
                    why the heading uses the sans `Label` rather than mono. */}
                <Label>{dayHeading(day, TODAY, t('events.history.today'))}</Label>
                <View className="mt-1">
                  {items.map((record) => (
                    <EventRecordRow
                      key={record.id}
                      record={record}
                      categoryVisual={
                        record.categoryId ? categoryVisualById[record.categoryId] : undefined
                      }
                      onEdit={onEditEvent}
                      onDelete={onDeleteEvent}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </Panel>
  )
}
