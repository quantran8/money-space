import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Search,
  SlidersHorizontal,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Panel, PanelHeader } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import type { FinancialRecordItem, RecordTab } from '@money-space/core/features/events/model/events-form'
import { TODAY } from '@money-space/core/features/events/model/events-form'
import { RecordCard } from '@/features/events/ui/components/record-card'
import { cn } from '@money-space/core/shared/lib/utils'

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
  /** `YYYY-MM`, owned by the page. Read-only here — it only resets paging. */
  selectedMonth: string
  selectedMember: string
  onMemberChange: (memberId: string) => void
  query: string
  onQueryChange: (query: string) => void
  isLoading?: boolean
  onEditEvent: (id: string) => void
  onDuplicateEvent: (id: string) => void
  onToggleEventAttention: (id: string) => void
  onDeleteEvent: (id: string) => void
}

export function EventsTimelineCard({
  tab,
  onTabChange,
  groupedRecords,
  memberOptions,
  selectedMonth,
  selectedMember,
  onMemberChange,
  query,
  onQueryChange,
  isLoading = false,
  onEditEvent,
  onDuplicateEvent,
  onToggleEventAttention,
  onDeleteEvent,
}: EventsTimelineCardProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  const [page, setPage] = useState(1)

  // Month, person, type and search are all applied upstream — `groupedRecords`
  // arrives filtered — so this only flattens and orders what it was handed.
  const filteredRecords = useMemo(
    () =>
      groupedRecords
        .flatMap(([, items]) => items)
        .sort((left, right) => right.date.localeCompare(left.date)),
    [groupedRecords],
  )

  // The month lives on the page now, so its change arrives as new data rather
  // than through a handler here — and page 4 of August is not page 4 of July.
  // Adjusted during render rather than in an effect: an effect would paint the
  // wrong page once before correcting it.
  const [pagedMonth, setPagedMonth] = useState(selectedMonth)
  if (pagedMonth !== selectedMonth) {
    setPagedMonth(selectedMonth)
    setPage(1)
  }

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

  const firstVisible = filteredRecords.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const lastVisible = Math.min(safePage * PAGE_SIZE, filteredRecords.length)
  const isNarrowed = tab !== 'all' || selectedMember !== 'all' || query.trim().length > 0

  return (
    <Panel>
      <PanelHeader
        title={t('events.history.changes')}
        meta={t('events.history.changeCount', { count: filteredRecords.length })}
      />

      {/* Filters are controls, not metadata — they sit under the header rather
          than inside it (§11.1), search first because it is the one that finds
          a specific row rather than narrowing a class of them. */}
      <div className="mt-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <label className="flex min-h-11 w-full items-center gap-2 rounded-control border border-committed bg-card px-3.5 transition-[border-color,box-shadow] duration-150 focus-within:border-data-primary focus-within:shadow-[0_0_0_3px_rgba(115,164,215,0.16)] md:max-w-[320px]">
          <Search className="size-[17px] shrink-0 text-ink3" strokeWidth={1.75} />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              onQueryChange(event.target.value)
              setPage(1)
            }}
            placeholder={t('events.history.searchPlaceholder')}
            aria-label={t('events.history.searchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent t-body-sm outline-none placeholder:text-ink3"
          />
        </label>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <FilterSelect
            icon={UserRound}
            label={t('events.history.person')}
            value={selectedMember}
            onChange={(value) => {
              onMemberChange(value)
              setPage(1)
            }}
            options={[{ value: 'all', label: t('events.history.allPeople') }, ...memberOptions]}
          />
          <FilterSelect
            icon={SlidersHorizontal}
            label={t('events.history.type')}
            value={tab}
            onChange={(value) => {
              onTabChange(value as RecordTab)
              setPage(1)
            }}
            options={[
              { value: 'all', label: t('events.history.allChanges') },
              { value: 'income', label: t('events.history.typeIncome') },
              { value: 'expense', label: t('events.history.typeExpense') },
              { value: 'adjustment', label: t('events.history.typeAdjustment') },
              { value: 'asset', label: t('events.history.typeAsset') },
              { value: 'payment', label: t('events.history.typePayment') },
            ]}
          />
        </div>
      </div>

      <div className="mt-7">
        {isLoading ? <TimelineSkeleton /> : null}

        {!isLoading && filteredRecords.length === 0 ? (
          <div className="py-12 text-center">
            <Inbox className="mx-auto size-7 text-ink3" strokeWidth={1.75} aria-hidden />
            <p className="mt-3 t-body-sm text-ink2">
              {isNarrowed ? t('events.history.emptyFiltered') : t('events.history.empty')}
            </p>
          </div>
        ) : null}

        {/*
          The date is a GUTTER, not a heading over the rows.

          As a heading it took a full line per day, and on a month where most
          days hold a single row the list became more date than change. In a
          fixed left column the eye reads dates down one edge and changes down
          the other, and a day with three rows still costs one date. Below `md`
          there is no room for two columns, so it goes back to a line above.
        */}
        {!isLoading && recordsByDate.length > 0 ? (
          <div className="flex flex-col gap-7">
            {recordsByDate.map(([date, items]) => (
              <section key={date} className="grid gap-x-4 gap-y-2 md:grid-cols-[84px_1fr]">
                <h3 className="num t-caption text-ink3 md:pt-3">
                  {formatGroupDate(date, TODAY, locale, t('events.history.today'))}
                </h3>
                <div className="flex flex-col gap-1">
                  {items.map((record) => (
                    <RecordCard key={record.id} record={record} {...recordProps} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}

        {!isLoading && filteredRecords.length > PAGE_SIZE ? (
          <div className="mt-8 flex flex-col gap-3 border-t border-divider pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="t-caption text-ink2">
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
                className="flex h-9 items-center gap-1 rounded-control px-3 t-caption text-ink3 hover:bg-wash disabled:opacity-40"
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
                      <span className="grid size-9 place-items-center t-caption text-ink3">…</span>
                    ) : null}
                    <button
                      type="button"
                      aria-current={safePage === pageNumber ? 'page' : undefined}
                      className={cn(
                        'grid size-9 place-items-center rounded-control t-caption',
                        safePage === pageNumber
                          ? 'bg-wash font-medium text-ink'
                          : 'text-ink2 hover:bg-wash',
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
                className="flex h-9 items-center gap-1 rounded-control px-3 t-caption font-medium text-action hover:bg-wash disabled:opacity-40"
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
  icon: Icon,
  label,
  value,
  options,
  onChange,
  className,
}: {
  icon: LucideIcon
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <label
      className={cn(
        'flex min-h-11 min-w-0 items-center gap-2 rounded-control border border-committed bg-card px-3.5',
        className,
      )}
    >
      <Icon className="size-[17px] shrink-0 text-ink3" strokeWidth={1.75} aria-hidden />
      <span className="shrink-0 t-body-sm text-ink3">{label}:</span>
      <select
        className="min-w-0 flex-1 appearance-none bg-transparent t-body-sm text-ink outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="size-4 shrink-0 text-ink3" strokeWidth={1.75} aria-hidden />
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
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-control" />
      ))}
    </div>
  )
}
