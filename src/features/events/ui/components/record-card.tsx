import { MoreVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  differenceInDays,
  formatRecordAmount,
  getStatusLabel,
  getTimelineRowTypeLabel,
  TODAY,
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
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  const isUpcoming = record.sourceType === 'upcoming_payment'
  const isInflow = record.direction === 'inflow'
  const date = new Date(`${record.date}T00:00:00`)
  const dateLabel = Number.isNaN(date.getTime())
    ? record.displayDate
    : date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })
  const days = isUpcoming ? differenceInDays(TODAY, record.date) : 0
  const typeLabel = isUpcoming
    ? t('events.redesign.timeline.planned')
    : t(`options.eventType.${record.eventType}`, {
        defaultValue: getTimelineRowTypeLabel(record),
      })
  const related = record.fromAssetName || record.toAssetName || record.ownerName
  const descriptionParts = [record.ownerName, record.fromAssetName || record.toAssetName].filter(Boolean)
  const amount = isUpcoming
    ? `-${formatVndShort(Math.abs(record.amount))}`
    : formatRecordAmount(record, formatVndShort)

  return (
    <article className="grid gap-4 px-4 py-5 md:grid-cols-[90px_1fr_150px_130px_42px] md:items-center">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{dateLabel}</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          {isUpcoming
            ? days === 0
              ? t('events.redesign.timeline.dueToday')
              : days > 0
                ? t('events.redesign.timeline.daysRemaining', { count: days })
                : t('events.redesign.timeline.overdue', { count: Math.abs(days) })
            : record.displayDate}
        </p>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="truncate text-sm font-semibold">{record.title}</h4>
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            {typeLabel}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {descriptionParts.length > 0
            ? descriptionParts.join(' · ')
            : record.note || t('events.redesign.timeline.noSource')}
        </p>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">
          {isUpcoming
            ? t('events.redesign.timeline.status')
            : t('events.redesign.timeline.related')}
        </p>
        <p
          className={cn(
            'mt-1 truncate text-sm font-medium',
            isUpcoming && record.status === 'overdue' && 'text-[hsl(var(--status-red))]',
            isUpcoming && record.status === 'pending_confirmation' && 'text-accent',
          )}
        >
          {isUpcoming ? getStatusLabel(record.status) : related || t('common.noNote')}
        </p>
      </div>

      <p
        className={cn(
          'money-number text-lg font-semibold md:text-right',
          !isUpcoming && isInflow && 'text-[hsl(var(--status-green))]',
        )}
      >
        {amount}
      </p>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label={t('events.redesign.timeline.actions')}
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isUpcoming ? (
            <>
              <DropdownMenuItem disabled={isSavingActual} onSelect={() => onMarkPaid(record.id)}>
                {t('events.redesign.actions.paid')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onPostponePayment(record.id)}>
                {t('events.redesign.actions.postpone')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onEditPayment(record.id)}>
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onTogglePaymentAttention(record.id)}>
                {t('events.redesign.actions.attention')}
              </DropdownMenuItem>
            </>
          ) : (
            <>
              {record.canEdit !== false ? (
                <DropdownMenuItem onSelect={() => onEditEvent(record.id)}>
                  {t('common.edit')}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onSelect={() => onDuplicateEvent(record.id)}>
                {t('events.redesign.actions.duplicate')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onToggleEventAttention(record.id)}>
                {t('events.redesign.actions.attention')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[hsl(var(--status-red))] focus:text-[hsl(var(--status-red))]"
                onSelect={() => onDeleteEvent(record.id)}
              >
                {t('common.delete')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  )
}
