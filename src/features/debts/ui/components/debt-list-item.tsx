import { Eye, Landmark, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate, getStatusLabel, getStatusTone } from '@/features/debts/model/debts-form'
import type { DebtItem } from '@/features/debts/model/debts.types'

type DebtListItemProps = {
  debt: DebtItem
  ownerName?: string
  receivedToAssetName?: string
  isUpdating: boolean
  onEdit: (id: string) => void
  onMarkPaidOff: (id: string) => void
  onViewDetail: (id: string) => void
  onDelete: (id: string) => void
}

export function DebtListItem({
  debt,
  ownerName,
  receivedToAssetName,
  isUpdating,
  onEdit,
  onMarkPaidOff,
  onViewDetail,
  onDelete,
}: DebtListItemProps) {
  return (
    <article className="rounded-[28px] border border-border/80 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Landmark className="size-5 text-foreground" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onViewDetail(debt.id)}
                className="truncate text-left text-lg font-semibold tracking-[-0.02em] transition hover:text-[hsl(var(--status-blue))]"
              >
                {debt.name}
              </button>
              <p className="mt-1 text-sm text-muted-foreground">
                {debt.lenderName} · vay ngày {formatDate(debt.borrowedAt)}
              </p>
            </div>
            <Badge className={getStatusTone(debt.status)}>{getStatusLabel(debt.status)}</Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {ownerName ? <Badge variant="secondary">Phụ trách: {ownerName}</Badge> : null}
            {receivedToAssetName ? (
              <Badge variant="secondary">Nhận vào {receivedToAssetName}</Badge>
            ) : null}
            {debt.fixedPaymentAmount ? (
              <Badge variant="secondary">Mỗi kỳ {debt.fixedPaymentAmount}</Badge>
            ) : null}
            {debt.interestSummary ? (
              <Badge variant="secondary">{debt.interestSummary}</Badge>
            ) : null}
          </div>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Còn nợ {debt.outstandingAmount} đ trên tổng vay {debt.originalAmount} đ
            {debt.expectedFinalDueDate
              ? ` · dự kiến xong ${formatDate(debt.expectedFinalDueDate)}`
              : ''}
          </p>

          {debt.note ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{debt.note}</p>
          ) : null}
        </div>

        <div className="lg:w-[220px]">
          <p className="money-number text-2xl font-semibold text-[hsl(var(--status-red))] lg:text-right">
            {debt.outstandingAmount} đ
          </p>

          <div className="mt-4 flex flex-wrap gap-2 lg:justify-end">
            {debt.status !== 'paid_off' ? (
              <Button size="sm" disabled={isUpdating} onClick={() => onMarkPaidOff(debt.id)}>
                {isUpdating ? 'Dang cap nhat...' : 'Đã trả xong'}
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetail(debt.id)}>
                  <Eye className="mr-2 size-4" />
                  Xem chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(debt.id)}>
                  <Pencil className="mr-2 size-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-[hsl(var(--status-red))] focus:text-[hsl(var(--status-red))]"
                  onClick={() => onDelete(debt.id)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Xóa khoản nợ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </article>
  )
}
