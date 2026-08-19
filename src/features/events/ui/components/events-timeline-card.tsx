import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Panel } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import type { FinancialRecordItem, RecordTab } from '@/features/events/model/events-form'
import { TODAY } from '@/features/events/model/events-form'
import { RecordCard } from '@/features/events/ui/components/record-card'
import { cn } from '@/shared/lib/utils'

const PAGE_SIZE = 7

type Option = {
  value: string
  label: string
}

type EventsTimelineCardProps = {
  tab: RecordTab
  onTabChange: (tab: RecordTab) => void
  groupedRecords: Array<[string, FinancialRecordItem[]]>
  memberOptions: Option[]
  isLoading?: boolean
  onEditEvent: (id: string) => void
  onDuplicateEvent: (id: string) => void
  onToggleEventAttention: (id: string) => void
  onDeleteEvent: (id: string) => void
}

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(monthKey: string, delta: number) {
  const [year, month] = monthKey.split('-').map(Number)
  const next = new Date(year, month - 1 + delta, 1)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(monthKey: string, locale: string) {
  const [year, month] = monthKey.split('-').map(Number)
  if (locale === 'vi-VN') return `Tháng ${month} / ${year}`
  return new Date(year, month - 1, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })
}

export function EventsTimelineCard({
  tab,
  onTabChange,
  groupedRecords,
  memberOptions,
  isLoading = false,
  onEditEvent,
  onDuplicateEvent,
  onToggleEventAttention,
  onDeleteEvent,
}: EventsTimelineCardProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey)
  const [selectedMember, setSelectedMember] = useState('all')
  const [page, setPage] = useState(1)

  const records = useMemo(
    () => groupedRecords.flatMap(([, items]) => items),
    [groupedRecords],
  )
  const filteredRecords = useMemo(
    () =>
      records
        .filter((record) => record.date.slice(0, 7) === selectedMonth)
        .filter(
          (record) => selectedMember === 'all' || record.ownerMemberId === selectedMember,
        )
        .sort((left, right) => right.date.localeCompare(left.date)),
    [records, selectedMember, selectedMonth],
  )
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleRecords = filteredRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const recordsByDate = useMemo(() => {
    const groups = new Map<string, FinancialRecordItem[]>()
    for (const record of visibleRecords) {
      groups.set(record.date, [...(groups.get(record.date) ?? []), record])
    }
    return [...groups.entries()].sort(([left], [right]) => right.localeCompare(left))
  }, [visibleRecords])
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (value) => totalPages <= 5 || value === 1 || value === totalPages || Math.abs(value - safePage) <= 1,
  )

  const recordProps = {
    onEditEvent,
    onDuplicateEvent,
    onToggleEventAttention,
    onDeleteEvent,
  }

  function changeMonth(delta: number) {
    setSelectedMonth((value) => shiftMonth(value, delta))
    setPage(1)
  }

  function changeTab(value: RecordTab) {
    onTabChange(value)
    setPage(1)
  }

  const firstVisible = filteredRecords.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const lastVisible = Math.min(safePage * PAGE_SIZE, filteredRecords.length)

  return (
    <Panel>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="grid size-9 place-items-center rounded-control text-ink2 hover:bg-sunk"
            aria-label={t('events.history.previousMonth')}
            onClick={() => changeMonth(-1)}
          >
            <ChevronLeft className="size-4" strokeWidth={1.75} />
          </button>
          <div className="min-w-[164px] text-center">
            <h2 className="section-title text-[16px] capitalize">
              {monthLabel(selectedMonth, locale)}
            </h2>
            <span className="font-mono text-[11px] text-ink3">
              {t('events.history.changeCount', { count: filteredRecords.length })}
            </span>
          </div>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-control text-ink2 hover:bg-sunk"
            aria-label={t('events.history.nextMonth')}
            onClick={() => changeMonth(1)}
          >
            <ChevronRight className="size-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <FilterSelect
            label={t('events.history.person')}
            value={selectedMember}
            onChange={(value) => {
              setSelectedMember(value)
              setPage(1)
            }}
            options={[
              { value: 'all', label: t('events.history.allPeople') },
              ...memberOptions,
            ]}
          />
          <FilterSelect
            label={t('events.history.type')}
            value={tab}
            onChange={(value) => changeTab(value as RecordTab)}
            className="sm:min-w-[210px]"
            options={[
              { value: 'all', label: t('events.history.allChanges') },
              { value: 'source', label: t('events.history.sourceChanges') },
              { value: 'debt', label: t('events.history.debtChanges') },
            ]}
          />
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? <TimelineSkeleton /> : null}
        {!isLoading && filteredRecords.length === 0 ? (
          <p className="sunk px-5 py-12 text-center text-[13px] text-ink2">
            {t('events.history.empty')}
          </p>
        ) : null}
        {!isLoading
          ? recordsByDate.map(([date, items], index) => (
              <section key={date} className={index === 0 ? '' : 'mt-7'}>
                <h3 className="px-3 pb-2 pt-1 font-mono text-[11px] font-medium uppercase text-ink3">
                  {formatGroupDate(date, TODAY, locale, t('events.history.today'))}
                </h3>
                <div className="space-y-1">
                  {items.map((record) => (
                    <RecordCard
                      key={record.id}
                      record={record}
                      {...recordProps}
                    />
                  ))}
                </div>
              </section>
            ))
          : null}

        {!isLoading && filteredRecords.length > 0 ? (
          <div className="sunk mt-8 flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-ink2">
              {t('events.history.showing', {
                from: firstVisible,
                to: lastVisible,
                total: filteredRecords.length,
              })}
            </p>
            <nav className="flex items-center gap-1" aria-label={t('events.history.pagination')}>
              <button
                type="button"
                disabled={safePage === 1}
                className="flex h-9 items-center gap-1 rounded-control px-3 text-[12px] text-ink3 hover:bg-panel disabled:opacity-40"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <ChevronLeft className="size-4" strokeWidth={1.75} />
                {t('events.history.previous')}
              </button>
              {pageNumbers.map((pageNumber, index) => {
                const previous = pageNumbers[index - 1]
                return (
                  <span key={pageNumber} className="contents">
                    {previous && pageNumber - previous > 1 ? (
                      <span className="grid size-9 place-items-center text-[12px] text-ink3">…</span>
                    ) : null}
                    <button
                      type="button"
                      aria-current={safePage === pageNumber ? 'page' : undefined}
                      className={cn(
                        'grid size-9 place-items-center rounded-control text-[12px]',
                        safePage === pageNumber
                          ? 'bg-panel font-medium text-ink'
                          : 'text-ink2 hover:bg-panel',
                      )}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  </span>
                )
              })}
              <button
                type="button"
                disabled={safePage === totalPages}
                className="flex h-9 items-center gap-1 rounded-control px-3 text-[12px] font-medium text-accent hover:bg-panel disabled:opacity-40"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                {t('events.history.next')}
                <ChevronRight className="size-4" strokeWidth={1.75} />
              </button>
            </nav>
          </div>
        ) : null}
      </div>
    </Panel>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <label
      className={cn(
        'sunk flex h-10 min-w-[160px] items-center gap-2 px-3',
        className,
      )}
    >
      <span className="shrink-0 text-[12px] text-ink3">{label}</span>
      <select
        className="min-w-0 flex-1 appearance-none bg-transparent text-[13px] text-ink outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="size-4 shrink-0 text-ink3" strokeWidth={1.75} />
    </label>
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
