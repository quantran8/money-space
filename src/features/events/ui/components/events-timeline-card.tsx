import { Search } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { RecordCard } from '@/features/events/ui/components/record-card'
import {
  getTimelineGroupLabel,
  type FinancialRecordItem,
  type RecordTab,
  type TimelineGroupKey,
} from '@/features/events/model/events-form'
import { cn } from '@/shared/lib/utils'

type EventsTimelineCardProps = {
  query: string
  onQueryChange: (value: string) => void
  tab: RecordTab
  onTabChange: (tab: RecordTab) => void
  groupedRecords: [TimelineGroupKey, FinancialRecordItem[]][]
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

const TABS: [RecordTab, string][] = [
  ['all', 'Tất cả'],
  ['upcoming', 'Sắp tới'],
  ['actual', 'Đã diễn ra'],
  ['attention', 'Cần chú ý'],
]

export function EventsTimelineCard({
  query,
  onQueryChange,
  tab,
  onTabChange,
  groupedRecords,
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
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Timeline chung cho planned và actual records</p>
          <h2 className="section-title mt-1 text-2xl font-semibold">Financial records</h2>
        </div>
        <div className="relative w-full sm:w-[280px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Tìm theo tên, ghi chú hoặc asset..."
            className="pl-11"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onTabChange(value)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              tab === value
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-7">
        {isLoading ? (
          <div className="divide-y divide-border/70">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <Skeleton className="size-6 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-4 w-20 shrink-0" />
              </div>
            ))}
          </div>
        ) : groupedRecords.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/80 bg-[hsl(var(--muted))]/40 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Chưa có record phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          groupedRecords.map(([groupKey, records]) => (
            <section key={groupKey}>
              <div className="mb-3 flex items-center gap-2">
                <span className="size-2 rounded-full bg-[hsl(var(--accent))]" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {getTimelineGroupLabel(groupKey)}
                </h3>
              </div>

              <div className="divide-y divide-border/70">
                {records.map((record) => (
                  <RecordCard
                    key={`${record.sourceType}-${record.id}`}
                    record={record}
                    isSavingActual={isSavingActual}
                    onMarkPaid={onMarkPaid}
                    onPostponePayment={onPostponePayment}
                    onEditPayment={onEditPayment}
                    onTogglePaymentAttention={onTogglePaymentAttention}
                    onEditEvent={onEditEvent}
                    onDuplicateEvent={onDuplicateEvent}
                    onToggleEventAttention={onToggleEventAttention}
                    onDeleteEvent={onDeleteEvent}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </Card>
  )
}
