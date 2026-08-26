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
import { EVENT_TYPE_ICONS } from '@/features/events/ui/components/event-type-icon'
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
  const typeLabel = t(`options.eventType.${record.eventType}`, {
    defaultValue: getTimelineRowTypeLabel(record),
  })
  const actor = record.ownerName || record.fromAssetName || record.toAssetName || t('events.history.householdActor')
  const amount = formatRecordAmount(record, formatVndShort)
  const initial = actor.trim().charAt(0).toLocaleUpperCase() || 'M'
  const relatedName = record.fromAssetName || record.toAssetName
  const needsAttention = record.isAttentionNeeded || record.status === 'overdue'
  const TypeIcon = EVENT_TYPE_ICONS[record.eventType ?? 'other']
  const actorLabel = t('events.history.actor', { name: actor })

  return (
    <article className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-5 rounded-control px-2 py-2 transition-colors hover:bg-canvas">
      {/* Everything that says WHAT happened, left. */}
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'grid size-6 shrink-0 place-items-center',
            needsAttention ? 'text-attention-ink' : 'text-ink3',
          )}
          role="img"
          aria-label={typeLabel}
          title={typeLabel}
        >
          <TypeIcon className="size-[17px]" strokeWidth={1.75} />
        </span>

        <div className="min-w-0 flex-1">
          <h4 className="truncate t-body-sm font-medium leading-5">{record.title}</h4>
          {/* The actor lives in the avatar alone — spelling the name out here
              just pushed the thing that actually happened off to the right. */}
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <span
              className="grid size-8 shrink-0 place-items-center rounded-full bg-wash t-caption-sm font-medium text-ink2"
              role="img"
              aria-label={actorLabel}
              title={actorLabel}
            >
              {initial}
            </span>
            {relatedName ? (
              <span className="truncate t-caption text-ink3">{relatedName}</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* The amount and the row's one action, right. */}
      <div className="flex shrink-0 items-center gap-2">
        <p className="num min-w-[88px] whitespace-nowrap text-right t-body-sm font-medium">
          {amount}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="grid size-11 place-items-center rounded-control text-ink2 transition-colors hover:bg-card hover:text-ink"
            aria-label={t('events.redesign.timeline.actions')}
          >
            <MoreVertical className="size-[18px]" strokeWidth={1.75} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {record.canEdit !== false ? <DropdownMenuItem onSelect={() => onEditEvent(record.id)}>{t('common.edit')}</DropdownMenuItem> : null}
            <DropdownMenuItem onSelect={() => onDuplicateEvent(record.id)}>{t('events.redesign.actions.duplicate')}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onToggleEventAttention(record.id)}>{t('events.redesign.actions.attention')}</DropdownMenuItem>
            <DropdownMenuItem className="text-alert focus:text-alert" onSelect={() => onDeleteEvent(record.id)}>{t('common.delete')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  )
}
