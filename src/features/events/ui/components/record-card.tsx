import { MoreVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  formatRecordAmount,
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
  const { t } = useTranslation()
  const isUpcoming = record.sourceType === 'upcoming_payment'
  const isInflow = record.direction === 'inflow'
  const typeLabel = isUpcoming
    ? t('events.history.types.upcoming')
    : t(`options.eventType.${record.eventType}`, { defaultValue: getTimelineRowTypeLabel(record) })
  const actor = record.ownerName || record.fromAssetName || record.toAssetName || t('events.history.householdActor')
  const amount = isUpcoming
    ? `-${formatVndShort(Math.abs(record.amount))}`
    : formatRecordAmount(record, formatVndShort)

  return (
    <article className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(170px,1fr)_130px_120px_34px] sm:items-center sm:gap-4">
      <div className="min-w-0">
        <h4 className="truncate text-[13px] font-medium">{record.title}</h4>
        <p className="mt-1 truncate text-[11px] text-ink3">{actor}</p>
      </div>
      <div>
        <span className="rounded-full bg-sunk px-2.5 py-1 text-[11px] text-ink2">{typeLabel}</span>
        {isUpcoming ? (
          <p className="mt-1.5 text-[10px] text-attention">{t(`events.history.status.${record.status}`)}</p>
        ) : null}
      </div>
      <p className={cn('num text-[14px] font-medium sm:text-right', isInflow && 'text-accent')}>
        {amount}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="grid size-8 place-items-center rounded-control text-ink3 transition hover:bg-sunk hover:text-ink"
          aria-label={t('events.redesign.timeline.actions')}
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isUpcoming ? (
            <>
              <DropdownMenuItem disabled={isSavingActual} onSelect={() => onMarkPaid(record.id)}>{t('events.redesign.actions.paid')}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onPostponePayment(record.id)}>{t('events.redesign.actions.postpone')}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onEditPayment(record.id)}>{t('common.edit')}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onTogglePaymentAttention(record.id)}>{t('events.redesign.actions.attention')}</DropdownMenuItem>
            </>
          ) : (
            <>
              {record.canEdit !== false ? <DropdownMenuItem onSelect={() => onEditEvent(record.id)}>{t('common.edit')}</DropdownMenuItem> : null}
              <DropdownMenuItem onSelect={() => onDuplicateEvent(record.id)}>{t('events.redesign.actions.duplicate')}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onToggleEventAttention(record.id)}>{t('events.redesign.actions.attention')}</DropdownMenuItem>
              <DropdownMenuItem className="text-alert focus:text-alert" onSelect={() => onDeleteEvent(record.id)}>{t('common.delete')}</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  )
}
