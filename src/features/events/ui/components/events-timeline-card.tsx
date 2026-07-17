import { CalendarDays, Search } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  FinancialRecordItem,
  RecordTab,
  TimelineGroupKey,
} from '@/features/events/model/events-form'
import { RecordCard } from '@/features/events/ui/components/record-card'
import { formatVndShort } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type RecordCounts = Record<'upcoming' | 'actual' | 'inflow' | 'outflow', number>

type EventsTimelineCardProps = {
  query: string
  onQueryChange: (value: string) => void
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
  query,
  onQueryChange,
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
  const monthLabel = new Date().toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })
  const records = useMemo(() => groupedRecords.flatMap(([, items]) => items), [groupedRecords])
  const upcoming = records.filter((record) => record.sourceType === 'upcoming_payment')
  const actual = records.filter((record) => record.sourceType === 'money_event')
  const upcomingTotal = upcoming.reduce((sum, record) => sum + Math.abs(record.amount), 0)
  const actualNet = actual.reduce((sum, record) => {
    if (record.direction === 'inflow') return sum + Math.abs(record.amount)
    if (record.direction === 'outflow') return sum - Math.abs(record.amount)
    return sum
  }, 0)
  const tabs: Array<[RecordTab, string]> = [
    ['all', t('events.redesign.timeline.tabs.all')],
    [
      'upcoming',
      t('events.redesign.timeline.tabs.upcoming', { count: recordCounts.upcoming }),
    ],
    ['actual', t('events.redesign.timeline.tabs.actual', { count: recordCounts.actual })],
    ['inflow', t('events.redesign.timeline.tabs.inflow')],
    ['outflow', t('events.redesign.timeline.tabs.outflow')],
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
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="section-title text-xl font-semibold">
            {t('events.redesign.timeline.title')}
          </h2>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={t('events.redesign.timeline.search')}
              className="pl-11"
            />
          </div>
          <div className="flex h-11 items-center justify-start rounded-xl border border-border bg-card px-4 text-sm font-medium">
            <CalendarDays className="mr-2 size-4" />
            {monthLabel}
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto border-b border-border pb-4">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onTabChange(value)}
            className={cn(
              'whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
              tab === value
                ? 'bg-[#1d1d1f] text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-8">
        {isLoading ? (
          <TimelineSkeleton />
        ) : records.length === 0 ? (
          <div className="rounded-2xl bg-muted px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">{t('events.redesign.timeline.empty')}</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 ? (
              <TimelineGroup
                label={t('events.redesign.timeline.groups.upcoming')}
                summary={t('events.redesign.timeline.groups.total', {
                  value: formatVndShort(upcomingTotal),
                })}
                accent
                records={upcoming}
                recordProps={recordProps}
              />
            ) : null}

            {actual.length > 0 ? (
              <TimelineGroup
                label={t('events.redesign.timeline.groups.actual')}
                summary={t('events.redesign.timeline.groups.net', {
                  sign: actualNet >= 0 ? '+' : '-',
                  value: formatVndShort(Math.abs(actualNet)),
                })}
                records={actual}
                recordProps={recordProps}
              />
            ) : null}
          </>
        )}
      </div>
    </Card>
  )
}

type RecordCallbacks = Pick<
  EventsTimelineCardProps,
  | 'isSavingActual'
  | 'onMarkPaid'
  | 'onPostponePayment'
  | 'onEditPayment'
  | 'onTogglePaymentAttention'
  | 'onEditEvent'
  | 'onDuplicateEvent'
  | 'onToggleEventAttention'
  | 'onDeleteEvent'
>

function TimelineGroup({
  label,
  summary,
  accent = false,
  records,
  recordProps,
}: {
  label: string
  summary: string
  accent?: boolean
  records: FinancialRecordItem[]
  recordProps: RecordCallbacks
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className={cn('size-2 rounded-full', accent ? 'bg-accent' : 'bg-neutral-500')} />
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">{summary}</p>
      </div>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
        {records.map((record) => (
          <RecordCard key={`${record.sourceType}-${record.id}`} record={record} {...recordProps} />
        ))}
      </div>
    </section>
  )
}

function TimelineSkeleton() {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-4 px-4 py-5 md:grid-cols-[90px_1fr_150px_130px_42px] md:items-center"
        >
          <Skeleton className="h-4 w-14" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-24 md:ml-auto" />
          <Skeleton className="size-8" />
        </div>
      ))}
    </div>
  )
}
