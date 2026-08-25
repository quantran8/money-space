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
} from '@money-space/core/features/events/model/events-form'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

type RecordCardProps = {
  record: FinancialRecordItem
  onEditEvent: (id: string) => void
  onDuplicateEvent: (id: string) => void
  onToggleEventAttention: (id: string) => void
  onDeleteEvent: (id: string) => void
}

export function RecordCard({
  record,
  onEditEvent,
  onDuplicateEvent,
  onToggleEventAttention,
  onDeleteEvent,
}: RecordCardProps) {
  const { t } = useTranslation()
  const isInflow = record.direction === 'inflow'
  const typeLabel = t(`options.eventType.${record.eventType}`, {
    defaultValue: getTimelineRowTypeLabel(record),
  })
  const actor = record.ownerName || record.fromAssetName || record.toAssetName || t('events.history.householdActor')
  const amount = formatRecordAmount(record, formatVndShort)
  const initial = actor.trim().charAt(0).toLocaleUpperCase() || 'M'
  const relatedName = record.fromAssetName || record.toAssetName
  const meta = relatedName ? `${typeLabel} · ${relatedName}` : typeLabel

  return (
    <article className="grid grid-cols-[36px_minmax(0,1fr)_auto_32px] items-start gap-x-3 rounded-control px-3 py-3 transition-colors hover:bg-wash">
      {/* The actor lives in the avatar alone — repeating it in the title line
          just pushed the thing that actually happened off to the right. */}
      <div
        className="grid size-8 place-items-center rounded-full bg-wash t-caption-sm font-medium text-ink2"
        title={actor}
      >
        {initial}
      </div>
      <div className="min-w-0">
        <h4 className="t-body-sm leading-5">{record.title}</h4>
        <p
          className={cn(
            'mt-1 truncate t-caption',
            record.isAttentionNeeded || record.status === 'overdue'
              ? 'text-attention'
              : 'text-ink3',
          )}
        >
          {meta}
        </p>
      </div>
      <p className={cn('num whitespace-nowrap pl-3 text-right t-body-sm font-medium', isInflow && 'text-action')}>
        {amount}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="grid size-8 place-items-center rounded-control text-ink3 transition hover:bg-card hover:text-ink"
          aria-label={t('events.redesign.timeline.actions')}
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {record.canEdit !== false ? <DropdownMenuItem onSelect={() => onEditEvent(record.id)}>{t('common.edit')}</DropdownMenuItem> : null}
          <DropdownMenuItem onSelect={() => onDuplicateEvent(record.id)}>{t('events.redesign.actions.duplicate')}</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onToggleEventAttention(record.id)}>{t('events.redesign.actions.attention')}</DropdownMenuItem>
          <DropdownMenuItem className="text-alert focus:text-alert" onSelect={() => onDeleteEvent(record.id)}>{t('common.delete')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  )
}
