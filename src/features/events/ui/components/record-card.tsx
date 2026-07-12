import { ArrowDownLeft, ArrowUpRight, MoreHorizontal } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  formatRecordAmount,
  formatTimelineRowDate,
  getRecordAmountTone,
  getTimelineRowTypeLabel,
  type FinancialRecordItem,
} from '@/features/events/model/events-form'
import { formatVndShort } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

type RecordCardProps = {
  record: FinancialRecordItem
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

export function RecordCard({
  record,
  isSavingActual,
  onMarkPaid,
  onPostponePayment,
  onEditPayment,
  onTogglePaymentAttention,
  onEditEvent,
  onDuplicateEvent,
  onToggleEventAttention,
  onDeleteEvent,
}: RecordCardProps) {
  // An outflow (money out) points up-and-out in orange; everything else
  // (money in / neutral records like an asset sale or revaluation) points
  // down-and-in in green — matching the timeline mockup.
  const isOutflow = record.direction === 'outflow'
  const Icon = isOutflow ? ArrowUpRight : ArrowDownLeft

  return (
    <article className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0">
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center',
          isOutflow ? 'text-[hsl(var(--status-orange))]' : 'text-[hsl(var(--status-green))]',
        )}
        aria-hidden
      >
        <Icon className="size-5" strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-foreground">{record.title}</p>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {getTimelineRowTypeLabel(record)} · {formatTimelineRowDate(record.date)}
        </p>
      </div>

      <p className={cn('money-number shrink-0 text-base font-semibold', getRecordAmountTone(record))}>
        {formatRecordAmount(record, formatVndShort)}
      </p>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="shrink-0 rounded-full p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-[hsl(var(--muted))] hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
          aria-label="Tùy chọn record"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {record.sourceType === 'upcoming_payment' ? (
            <>
              <DropdownMenuItem disabled={isSavingActual} onSelect={() => onMarkPaid(record.id)}>
                Đã trả
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onPostponePayment(record.id)}>Dời ngày</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onEditPayment(record.id)}>Sửa</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onTogglePaymentAttention(record.id)}>
                Cần chú ý
              </DropdownMenuItem>
            </>
          ) : (
            <>
              {record.canEdit !== false ? (
                <DropdownMenuItem onSelect={() => onEditEvent(record.id)}>Sửa</DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onSelect={() => onDuplicateEvent(record.id)}>Nhân bản</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onToggleEventAttention(record.id)}>
                Cần chú ý
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[hsl(var(--status-red))] focus:text-[hsl(var(--status-red))]"
                onSelect={() => onDeleteEvent(record.id)}
              >
                Xóa
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  )
}
