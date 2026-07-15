import { ArrowRight, CheckCircle2, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

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
import type { UpcomingPaymentItem } from '@/features/payments/model/payments.types'
import { formatVndShort } from '@/shared/lib/format-money'

type DebtListItemProps = {
  debt: DebtItem
  ownerName?: string
  nextPayment?: UpcomingPaymentItem
  isUpdating: boolean
  onEdit: (id: string) => void
  onMarkPaidOff: (id: string) => void
  onViewDetail: (id: string) => void
  onDelete: (id: string) => void
}

const lenderLabels: Record<DebtItem['lenderType'], string> = {
  bank_institution: 'Vay ngân hàng',
  relative: 'Người thân',
  other: 'Khoản vay khác',
}

export function DebtListItem({
  debt,
  ownerName,
  nextPayment,
  isUpdating,
  onEdit,
  onMarkPaidOff,
  onViewDetail,
  onDelete,
}: DebtListItemProps) {
  const repaid = Math.max(0, debt.originalAmountValue - debt.outstandingAmountValue)
  const progress = debt.originalAmountValue > 0
    ? Math.min(100, Math.round((repaid / debt.originalAmountValue) * 100))
    : 0

  return (
    <article className="group py-6 first:pt-0 last:pb-0">
      <div className="grid gap-5 xl:grid-cols-[1.3fr_.8fr_.7fr_110px] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onViewDetail(debt.id)}
              className="truncate text-left text-base font-semibold transition-colors hover:text-[hsl(var(--accent))]"
            >
              {debt.name}
            </button>
            <Badge variant="secondary" className="border-none text-[11px] font-medium">
              {lenderLabels[debt.lenderType]}
            </Badge>
            <Badge className={`${getStatusTone(debt.status)} text-[11px] font-medium`}>
              {getStatusLabel(debt.status)}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {debt.lenderName}
            {ownerName ? ` · ${ownerName} phụ trách` : ''}
            {debt.expectedFinalDueDate ? ` · Kết thúc ${formatDate(debt.expectedFinalDueDate)}` : ''}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>Đã trả {formatVndShort(repaid)} / {formatVndShort(debt.originalAmountValue)}</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[hsl(var(--accent))] transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Dư nợ còn lại</p>
          <p className="money-number mt-1 text-xl font-semibold">
            {formatVndShort(debt.outstandingAmountValue)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {nextPayment
              ? `Kỳ tới ${formatDate(nextPayment.dueDate ?? nextPayment.due)} · ${formatVndShort(nextPayment.amountValue ?? 0)}`
              : debt.fixedPaymentAmountValue
                ? `Mỗi kỳ · ${formatVndShort(debt.fixedPaymentAmountValue)}`
                : 'Chưa có kỳ thanh toán'}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 xl:justify-end">
          <button
            type="button"
            onClick={() => onViewDetail(debt.id)}
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-[hsl(var(--accent))]"
          >
            Chi tiết
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="size-8 rounded-full" aria-label="Tùy chọn khoản nợ">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetail(debt.id)}>
                <Eye className="mr-2 size-4" /> Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(debt.id)}>
                <Pencil className="mr-2 size-4" /> Chỉnh sửa
              </DropdownMenuItem>
              {debt.status !== 'paid_off' ? (
                <DropdownMenuItem disabled={isUpdating} onClick={() => onMarkPaidOff(debt.id)}>
                  <CheckCircle2 className="mr-2 size-4" /> Đánh dấu đã trả
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[hsl(var(--status-red))] focus:text-[hsl(var(--status-red))]"
                onClick={() => onDelete(debt.id)}
              >
                <Trash2 className="mr-2 size-4" /> Xóa khoản nợ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  )
}
