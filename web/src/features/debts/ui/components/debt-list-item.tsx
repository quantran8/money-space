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
import { TableCell, TableRow } from '@/components/ui/table'
import type { CashflowEvent } from '@money-space/core/features/cashflow/model/cashflow.types'
import { formatDate } from '@money-space/core/features/debts/model/debts-form'
import type { DebtItem } from '@money-space/core/features/debts/model/debts.types'
import { formatVndCell } from '@money-space/core/shared/lib/format-money'

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

/**
 * One debt, as a table row.
 *
 * A hand-built CSS grid used to stand in for a table here, which meant the
 * header's column widths and the row's were two independent declarations that
 * had to be kept in step by hand — and they had drifted: the header carried
 * neither the row's `gap-x-4` nor its final column width, so every heading sat
 * slightly left of its column and the narrow ones collided ("DƯ NỢKỲ TỚI").
 * A real `<table>` shares one set of column widths by construction, so that
 * class of bug cannot recur.
 *
 * The WHOLE row navigates to the debt. A "Chi tiết" link used to sit at the end
 * of each row beside a menu that also offered "Xem chi tiết" — three ways to do
 * one thing. `onClick` on the row handles the pointer; the name carries a real
 * button so keyboard and screen-reader users get the same route, since a `<tr>`
 * cannot be focused or announced as a control.
 */
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

  return (
    <TableRow className="cursor-pointer" onClick={() => onViewDetail(debt.id)}>
      <TableCell>
        {/* The row's keyboard equivalent. Styled as plain text — it is the
            name, not a link, and underlining every row would be noise. */}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onViewDetail(debt.id)
          }}
          className="truncate rounded-control text-left text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {debt.name}
        </button>
      </TableCell>
      <TableCell className="text-[12px]">
        {debt.lenderName || t('debts.demo.unknownLender')}
      </TableCell>
      <TableCell className="num text-right text-[14px] font-medium">
        {formatVndCell(debt.outstandingAmountValue)}
      </TableCell>
      <TableCell className="text-[12px]">
        {nextPayment ? (
          formatDate(nextPayment.expectedDate)
        ) : (
          <span className="text-attention">{t('debts.demo.unconfirmed')}</span>
        )}
      </TableCell>
      <TableCell className="num text-right text-[12px]">
        {debt.interestSummary ?? '—'}
      </TableCell>
      <TableCell className="text-[12px]">
        {ownerName ?? t('debts.demo.householdOwner')}
      </TableCell>
      <TableCell className="text-[12px] text-ink2">
        {debt.expectedFinalDueDate ? formatDate(debt.expectedFinalDueDate) : t('debts.demo.unknown')}
      </TableCell>
      <TableCell className="w-14 text-right">
        {/* Stops the row's own navigation: opening the menu is not a request to
            leave the page. */}
        <div onClick={(event) => event.stopPropagation()}>
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
              <DropdownMenuItem
                className="text-alert focus:text-alert"
                onClick={() => onDelete(debt.id)}
              >
                <Trash2 className="size-4" /> {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}
