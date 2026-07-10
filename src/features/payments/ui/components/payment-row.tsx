import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type PaymentStatus, type UpcomingPaymentItem } from '@/features/payments/model/payments'
import { statusTone } from '@/features/payments/model/payments-form'

type PaymentRowProps = {
  payment: UpcomingPaymentItem
  statusLabels: Record<PaymentStatus, string>
  dueMeta: (due: string) => string
  onEdit: (paymentId: string) => void
  onDelete: (paymentId: string) => void
}

export function PaymentRow({
  payment,
  statusLabels,
  dueMeta,
  onEdit,
  onDelete,
}: PaymentRowProps) {
  const { t } = useTranslation()

  return (
    <div className="surface-muted rounded-3xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{payment.name}</p>
            <Badge className={statusTone[payment.status]}>
              {statusLabels[payment.status]}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            {t('common.dueOn', { date: payment.due })} · {dueMeta(payment.due)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="money-number text-2xl font-semibold">{payment.amount}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label={t('common.actions')}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(payment.id)}>
                <Pencil className="size-4" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[hsl(var(--status-red))] focus:text-[hsl(var(--status-red))]"
                onSelect={() => onDelete(payment.id)}
              >
                <Trash2 className="size-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
