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
  const initial = actor.trim().charAt(0).toLocaleUpperCase() || 'M'
  const relatedName = record.fromAssetName || record.toAssetName
  const meta = isUpcoming
    ? `${typeLabel} · ${record.displayDate}`
    : relatedName
      ? `${typeLabel} · ${relatedName}`
      : typeLabel

  return (
    <article className="grid grid-cols-[36px_minmax(0,1fr)_auto_32px] items-start gap-x-3 rounded-control px-3 py-3 transition-colors hover:bg-sunk">
      <div className="grid size-8 place-items-center rounded-full bg-sunk text-[11px] font-medium text-ink2">
        {initial}
      </div>
      <div className="min-w-0">
        <h4 className="text-[14px] leading-5">
          <span className="font-medium">{actor}</span>
          <span className="text-ink3"> · </span>
          {record.title}
        </h4>
        <p
          className={cn(
            'mt-1 truncate text-[12px]',
            record.isAttentionNeeded || record.status === 'overdue'
              ? 'text-attention'
              : 'text-ink3',
          )}
        >
          {meta}
          {isUpcoming ? ` · ${t(`events.history.status.${record.status}`)}` : ''}
        </p>
      </div>
      <p className={cn('num whitespace-nowrap pl-3 text-right text-[14px] font-medium', isInflow && 'text-accent')}>
        {amount}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="grid size-8 place-items-center rounded-control text-ink3 transition hover:bg-panel hover:text-ink"
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
