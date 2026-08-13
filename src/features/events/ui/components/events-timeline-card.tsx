import { CalendarDays } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Panel } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  FinancialRecordItem,
  RecordTab,
  TimelineGroupKey,
} from '@/features/events/model/events-form'
import { TODAY } from '@/features/events/model/events-form'
import { RecordCard } from '@/features/events/ui/components/record-card'
import { cn } from '@/shared/lib/utils'

type RecordCounts = Record<'source' | 'upcoming' | 'goal' | 'debt', number>

type EventsTimelineCardProps = {
  tab: RecordTab
  onTabChange: (tab: RecordTab) => void
  groupedRecords: [TimelineGroupKey, FinancialRecordItem[]][]
  recordCounts: RecordCounts
  isLoading?: boolean
  isSavingActual: boolean
  onMarkPaid: (id: string) => void
  onPostponePayment: (id: string) => void
  onEditPayment: (id: string) => void
  onTogglePaymentAttention: (id: string) => void
  onEditEvent: (id: string) => void
  onDuplicateEvent: (id: string) => void
  onToggleEventAttention: (id: string) => void
  onDeleteEvent: (id: string) => void
}

export function EventsTimelineCard({
  tab,
  onTabChange,
  groupedRecords,
  recordCounts,
  isLoading = false,
  isSavingActual,
  onMarkPaid,
  onPostponePayment,
  onEditPayment,
  onTogglePaymentAttention,
  onEditEvent,
  onDuplicateEvent,
  onToggleEventAttention,
  onDeleteEvent,
}: EventsTimelineCardProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  const monthLabel = new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  const records = useMemo(
    () => groupedRecords.flatMap(([, items]) => items),
    [groupedRecords],
  )
  const recordsByDate = useMemo(() => {
    const groups = new Map<string, FinancialRecordItem[]>()
    for (const record of records) {
      groups.set(record.date, [...(groups.get(record.date) ?? []), record])
    }
    return [...groups.entries()].sort(([left], [right]) => right.localeCompare(left))
  }, [records])
  const tabs: Array<[RecordTab, string]> = [
    ['all', t('events.history.filters.all')],
    ['source', t('events.history.filters.source', { count: recordCounts.source })],
    ['upcoming', t('events.history.filters.upcoming', { count: recordCounts.upcoming })],
    ['goal', t('events.history.filters.goal', { count: recordCounts.goal })],
    ['debt', t('events.history.filters.debt', { count: recordCounts.debt })],
  ]

  const recordProps = {
    isSavingActual,
    onMarkPaid,
    onPostponePayment,
    onEditPayment,
    onTogglePaymentAttention,
    onEditEvent,
    onDuplicateEvent,
    onToggleEventAttention,
    onDeleteEvent,
  }

  return (
    <Panel>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <CalendarDays className="size-4 text-ink3" />
          <span className="capitalize">{monthLabel}</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {tabs.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onTabChange(value)}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-2 text-[12px] font-medium transition-colors',
                tab === value
                  ? 'bg-ink text-white'
                  : 'bg-sunk text-ink2 hover:text-ink',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-7">
        {isLoading ? <TimelineSkeleton /> : null}
        {!isLoading && records.length === 0 ? (
          <p className="rounded-sunk bg-sunk px-5 py-12 text-center text-[13px] text-ink2">
            {t('events.history.empty')}
          </p>
        ) : null}
        {!isLoading
          ? recordsByDate.map(([date, items]) => (
              <section key={date} className="grid gap-3 border-b border-line py-4 last:border-b-0 sm:grid-cols-[88px_1fr]">
                <h3 className="pt-3 text-[12px] font-medium text-ink2">
                  {formatGroupDate(date, TODAY, locale, t('events.history.today'))}
                </h3>
                <div className="divide-y divide-line">
                  {items.map((record) => (
                    <RecordCard key={`${record.sourceType}-${record.id}`} record={record} {...recordProps} />
                  ))}
                </div>
              </section>
            ))
          : null}
      </div>
    </Panel>
  )
}

function formatGroupDate(dateValue: string, today: string, locale: string, todayLabel: string) {
  if (dateValue === today) return todayLabel
  const date = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateValue
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })
}

function TimelineSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-control" />
      ))}
    </div>
  )
}
