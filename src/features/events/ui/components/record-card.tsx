import { MoreHorizontal, Pencil } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  formatRecordAmount,
  getAttentionTone,
  getRecordAmountTone,
  getStatusLabel,
  getStatusTone,
  getTimelineTypeLabel,
  getUpcomingDescription,
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
  return (
    <article
      className="rounded-[28px] border border-border/80 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold text-foreground">{record.title}</p>
            <Badge className={record.sourceType === 'upcoming_payment' ? 'bg-[hsla(var(--status-blue),0.1)] text-[hsl(var(--status-blue))] border-none' : 'bg-[hsla(var(--status-green),0.1)] text-[hsl(var(--status-green))] border-none'}>
              {record.sourceType === 'upcoming_payment' ? 'Planned' : 'Actual'}
            </Badge>
            <Badge variant="outline">{getTimelineTypeLabel(record)}</Badge>
            <Badge className={getStatusTone(record.status)}>{getStatusLabel(record.status)}</Badge>
            <Badge className={getAttentionTone(record.attentionLevel)}>
              {record.attentionLevel === 'normal' ? 'Bình thường' : record.attentionLevel === 'important' ? 'Cần chú ý' : 'Ưu tiên cao'}
            </Badge>
          </div>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {record.sourceType === 'upcoming_payment'
              ? getUpcomingDescription(record)
              : `${record.displayDate} · ${
                  record.direction === 'inflow'
                    ? 'Ghi nhận tiền vào'
                    : record.direction === 'outflow'
                      ? 'Ghi nhận tiền ra'
                      : 'Record trung tính, dùng để giải thích snapshot'
                }`}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {record.ownerName ? <Badge variant="secondary">Phụ trách: {record.ownerName}</Badge> : null}
            {record.frequency ? <Badge variant="secondary">Lặp: {record.frequency}</Badge> : null}
            {record.fromAssetName ? <Badge variant="secondary">Từ {record.fromAssetName}</Badge> : null}
            {record.toAssetName ? <Badge variant="secondary">Đến {record.toAssetName}</Badge> : null}
            {record.category ? <Badge variant="secondary">#{record.category}</Badge> : null}
          </div>

          {record.note ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{record.note}</p>
          ) : null}
        </div>

        <div className="lg:ml-6 lg:w-[220px]">
          <p className={cn('money-number text-2xl font-semibold lg:text-right', getRecordAmountTone(record))}>
            {formatRecordAmount(record, formatVndShort)}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 lg:justify-end">
            {record.sourceType === 'upcoming_payment' ? (
              <>
                <Button size="sm" disabled={isSavingActual} onClick={() => onMarkPaid(record.id)}>
                  {isSavingActual ? 'Dang xu ly...' : 'Đã trả'}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="secondary">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onPostponePayment(record.id)}>
                      Dời ngày
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onEditPayment(record.id)}>
                      Sửa
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onTogglePaymentAttention(record.id)}>
                      Cần chú ý
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button size="sm" variant="secondary" onClick={() => onEditEvent(record.id)}>
                  <Pencil className="mr-2 size-4" />
                  Sửa
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onDuplicateEvent(record.id)}>
                      Nhân bản
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onToggleEventAttention(record.id)}>
                      Cần chú ý
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-[hsl(var(--status-red))] focus:text-[hsl(var(--status-red))]"
                      onSelect={() => onDeleteEvent(record.id)}
                    >
                      Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
