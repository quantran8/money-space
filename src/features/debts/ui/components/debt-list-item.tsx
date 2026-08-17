import { CheckCircle2, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CashflowEvent } from '@/features/cashflow/model/cashflow.types'
import { formatDate } from '@/features/debts/model/debts-form'
import type { DebtItem } from '@/features/debts/model/debts.types'
import { formatVndCell, formatVndScale } from '@/shared/lib/format-money'

type DebtListItemProps = {
  debt: DebtItem
  ownerName?: string
  nextPayment?: CashflowEvent
  isUpdating: boolean
  onEdit: (id: string) => void
  onMarkPaidOff: (id: string) => void
  onViewDetail: (id: string) => void
  onDelete: (id: string) => void
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
  const { t } = useTranslation()
  const dueDate = nextPayment?.expectedDate

  return (
    <article className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 rounded-control px-3 py-3 transition-colors hover:bg-sunk lg:grid-cols-[1.2fr_1fr_.8fr_1.15fr_.65fr_.8fr_1fr_90px] lg:items-center">
      <button type="button" onClick={() => onViewDetail(debt.id)} className="min-w-0 text-left">
        <p className="truncate text-[13px] font-medium">{debt.name}</p>
        <p className="mt-1 text-[11px] text-ink3">{t(`debts.demo.lenderType.${debt.lenderType}`)}</p>
      </button>
      <p className="mt-2 text-[12px] lg:mt-0">{debt.lenderName || t('debts.demo.unknownLender')}</p>
      <p className="num col-start-2 row-start-1 text-right text-[14px] font-medium lg:col-auto lg:row-auto">
        {formatVndCell(debt.outstandingAmountValue)}
      </p>
      <div className="mt-1 text-[12px] lg:mt-0">
        {nextPayment ? (
          <>
            <p>{formatDate(dueDate)}</p>
            <p className="mt-1 text-[11px] text-ink3">{formatVndScale(nextPayment.amount)}</p>
          </>
        ) : (
          <p className="text-attention">{t('debts.demo.unconfirmed')}</p>
        )}
      </div>
      <p className="num mt-1 text-[12px] lg:mt-0 lg:text-right">{debt.interestSummary ?? '—'}</p>
      <p className="mt-1 text-[12px] lg:mt-0">{ownerName ?? t('debts.demo.householdOwner')}</p>
      <p className="mt-1 text-[12px] text-ink2 lg:mt-0">
        {debt.expectedFinalDueDate ? formatDate(debt.expectedFinalDueDate) : t('debts.demo.unknown')}
      </p>
      <div className="col-start-2 row-start-2 row-span-5 flex items-start justify-end gap-1 lg:col-auto lg:row-auto">
        <button
          type="button"
          onClick={() => onViewDetail(debt.id)}
          className="hidden text-[12px] font-medium text-accent xl:block"
        >
          {t('assets.demo.detail')}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="size-8" aria-label={t('common.actions')}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetail(debt.id)}>
              <Eye className="size-4" /> {t('goals.list.viewDetail')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(debt.id)}>
              <Pencil className="size-4" /> {t('common.edit')}
            </DropdownMenuItem>
            {debt.status !== 'paid_off' ? (
              <DropdownMenuItem disabled={isUpdating} onClick={() => onMarkPaidOff(debt.id)}>
                <CheckCircle2 className="size-4" /> {t('debts.demo.markPaid')}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-alert focus:text-alert" onClick={() => onDelete(debt.id)}>
              <Trash2 className="size-4" /> {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  )
}
