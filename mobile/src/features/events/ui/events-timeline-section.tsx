import { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'

import type {
  FinancialRecordItem,
  RecordTab,
} from '@money-space/core/features/events/model/events-form'
import { TODAY } from '@money-space/core/features/events/model/events-form'

import { EmptyState, Label, Panel, Segmented, Select, Skeleton } from '@/components/ui'
import { dateLocale, dayHeading, monthLabel, shiftMonth } from '@/features/events/lib/event-months'
import { EventRecordRow } from '@/features/events/ui/event-record-row'
import { TOUCH_TARGET, colors } from '@/theme/tokens'

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
 * The type filter becomes a `Segmented` (three short options that all fit) and
 * the person filter a `Select`. Both sit above the list because the month is
 * what the summary panel is describing — the filters and the figures must
 * always be talking about the same set of rows.
 */
export function EventsTimelineSection({
  tab,
  onTabChange,
  groupedRecords,
  memberOptions,
  selectedMonth,
  onMonthChange,
  selectedMember,
  onMemberChange,
  isLoading = false,
  onEditEvent,
  onDuplicateEvent,
  onToggleEventAttention,
  onDeleteEvent,
}: {
  tab: RecordTab
  onTabChange: (tab: RecordTab) => void
  /** Already filtered by month and person upstream — core owns that. */
  groupedRecords: [string, FinancialRecordItem[]][]
  memberOptions: Option[]
  selectedMonth: string
  onMonthChange: (monthKey: string) => void
  selectedMember: string
  onMemberChange: (memberId: string) => void
  isLoading?: boolean
  onEditEvent: (id: string) => void
  onDuplicateEvent: (id: string) => void
  onToggleEventAttention: (id: string) => void
  onDeleteEvent: (id: string) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = dateLocale(i18n.resolvedLanguage)

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
      <View className="flex-row items-center justify-between">
        <MonthStep
          label={t('events.history.previousMonth')}
          onPress={() => onMonthChange(shiftMonth(selectedMonth, -1))}
          direction="previous"
        />
        <Text className="flex-1 text-center text-[16px] font-medium text-ink" numberOfLines={1}>
          {monthLabel(selectedMonth, locale)}
        </Text>
        <MonthStep
          label={t('events.history.nextMonth')}
          onPress={() => onMonthChange(shiftMonth(selectedMonth, 1))}
          direction="next"
        />
      </View>

      <Segmented
        className="mt-4"
        value={tab}
        onChange={onTabChange}
        options={[
          { value: 'all' as const, label: t('events.history.allChanges') },
          { value: 'source' as const, label: t('events.history.sourceChanges') },
          { value: 'debt' as const, label: t('events.history.debtChanges') },
        ]}
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
            <Skeleton height={52} className="rounded-sunk" />
            <Skeleton height={52} className="rounded-sunk" />
            <Skeleton height={52} className="rounded-sunk" />
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
                      onEdit={onEditEvent}
                      onDuplicate={onDuplicateEvent}
                      onToggleAttention={onToggleEventAttention}
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

function MonthStep({
  label,
  onPress,
  direction,
}: {
  label: string
  onPress: () => void
  direction: 'previous' | 'next'
}) {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ minHeight: TOUCH_TARGET, minWidth: TOUCH_TARGET }}
      className="items-center justify-center rounded-control active:bg-sunk"
    >
      <Icon size={18} color={colors.ink2} strokeWidth={1.75} />
    </Pressable>
  )
}
